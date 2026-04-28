import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, type AVPlaybackStatus } from "expo-av";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { tracks as defaultQueue, type Track } from "../constants/catalog";
import { getAudioUrl } from "../services/audioService";
import { cycleRepeatMode, pickRandomTrackIndex, resolveTrackEndAction } from "../utils/playback";

const PLAYER_STATE_KEY = "player_state";
const MAX_RECENTLY_PLAYED = 12;

export type RepeatMode = "off" | "all" | "one";

export type PlayerState = {
  currentSong: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  likedSongIds: string[];
  recentlyPlayed: Track[];
  allSongs: Track[];
  totalPlayTimeSeconds: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  hydrated: boolean;
  trackLoading: boolean;
  trackError: string | null;
};

type PlaySongOptions = {
  autoplay?: boolean;
  startPositionSeconds?: number;
};

type PlayerContextValue = PlayerState & {
  playSong: (song: Track, nextQueue?: Track[], options?: PlaySongOptions) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  playNext: (options?: { fromAutoFinish?: boolean }) => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  toggleLike: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  registerCatalogTracks: (tracks: Track[]) => void;
  retryCurrentTrack: () => Promise<void>;
  refreshState: () => Promise<void>;
};

type PersistedState = {
  currentSong: Track | null;
  queue: Track[];
  currentIndex: number;
  likedSongIds: string[];
  recentlyPlayed: Track[];
  catalogSongs: Track[];
  totalPlayTimeSeconds: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  lastPositionSeconds: number;
  isPlaying: boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const normalizeQueue = (tracks: Track[] | null | undefined): Track[] =>
  Array.isArray(tracks)
    ? tracks.filter((track) => Boolean(track?.id) && (Boolean(track?.url) || Boolean(track?.videoId)))
    : [];

const mergeUniqueSongs = (collections: Track[][]): Track[] => {
  const map = new Map<string, Track>();

  collections.flat().forEach((track) => {
    if (!track?.id || (!track?.url && !track?.videoId)) return;
    if (!map.has(track.id)) {
      map.set(track.id, track);
    }
  });

  return Array.from(map.values());
};

const resolveTrack = (track: Track | null, tracks: Track[]): Track | null => {
  if (!track) return null;

  return (
    tracks.find((item) => item.id === track.id) ?? {
      ...track,
      url: track.url ?? "",
      videoId: track.videoId,
    }
  );
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<Track[]>(defaultQueue);
  const indexRef = useRef(-1);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStartedAtRef = useRef<number | null>(null);
  const handleTrackEndRef = useRef<(() => Promise<void>) | null>(null);

  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>(defaultQueue);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [catalogSongs, setCatalogSongs] = useState<Track[]>([]);
  const [totalPlayTimeSeconds, setTotalPlayTimeSeconds] = useState(0);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [hydrated, setHydrated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const allSongs = useMemo(
    () => mergeUniqueSongs([catalogSongs, recentlyPlayed, queue, defaultQueue]),
    [catalogSongs, recentlyPlayed, queue],
  );

  const commitPlaybackTime = useCallback(() => {
    if (playbackStartedAtRef.current == null) {
      return;
    }

    const elapsedSeconds = Math.max(0, (Date.now() - playbackStartedAtRef.current) / 1000);
    playbackStartedAtRef.current = null;

    if (elapsedSeconds > 0) {
      setTotalPlayTimeSeconds((previous) => previous + elapsedSeconds);
    }
  }, []);

  const updateFromPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        return;
      }

      setPosition((status.positionMillis ?? 0) / 1000);
      setDuration((status.durationMillis ?? 0) / 1000);
      setIsPlaying(status.isPlaying);

      if (status.isPlaying && playbackStartedAtRef.current == null) {
        playbackStartedAtRef.current = Date.now();
      }

      if (!status.isPlaying) {
        commitPlaybackTime();
      }

      if (status.didJustFinish) {
        void handleTrackEndRef.current?.();
      }
    },
    [commitPlaybackTime],
  );

  const unloadCurrentSound = useCallback(async () => {
    if (!soundRef.current) return;

    try {
      await soundRef.current.unloadAsync();
    } catch {
      // Ignore unload errors from disposed sounds.
    }

    soundRef.current.setOnPlaybackStatusUpdate(null);
    soundRef.current = null;
  }, []);

  const loadAndPlayTrack = useCallback(
    async (track: Track, options: PlaySongOptions = {}) => {
      setTrackLoading(true);
      setTrackError(null);
      if (options.autoplay !== false) {
        setIsPlaying(true);
      }

      const nextSound = new Audio.Sound();

      try {
        const playbackOptions = {
          shouldPlay: options.autoplay !== false,
          positionMillis:
            typeof options.startPositionSeconds === "number" && options.startPositionSeconds > 0
              ? Math.floor(options.startPositionSeconds * 1000)
              : 0,
        };

        const loadFromResolvedStream = async (forceRefresh = false) => {
          const audioUrl = await getAudioUrl(track, { forceRefresh });
          await nextSound.loadAsync({ uri: audioUrl }, playbackOptions, true);
        };

        try {
          await loadFromResolvedStream(false);
        } catch (firstError) {
          const isLikelyExpiredStream =
            firstError instanceof Error && /403|forbidden/i.test(firstError.message);

          if (!track.videoId || !isLikelyExpiredStream) {
            throw firstError;
          }

          console.log("[Player] Retrying with fresh stream URL after 403");
          await loadFromResolvedStream(true);
        }

        nextSound.setOnPlaybackStatusUpdate(updateFromPlaybackStatus);

        const previousSound = soundRef.current;
        soundRef.current = nextSound;

        if (previousSound) {
          try {
            previousSound.setOnPlaybackStatusUpdate(null);
            await previousSound.unloadAsync();
          } catch {
            // Ignore unload errors from race conditions.
          }
        }

        if (options.autoplay === false) {
          playbackStartedAtRef.current = null;
          setIsPlaying(false);
        } else {
          playbackStartedAtRef.current = Date.now();
          setIsPlaying(true);
        }
      } catch (loadError) {
        try {
          await nextSound.unloadAsync();
        } catch {
          // Ignore cleanup failures for a sound that never loaded.
        }

        setIsPlaying(false);
        setTrackError(loadError instanceof Error ? loadError.message : "Unable to load track");
        throw loadError;
      } finally {
        setTrackLoading(false);
      }
    },
    [updateFromPlaybackStatus],
  );

  const persistState = useCallback(async () => {
    const payload: PersistedState = {
      currentSong,
      queue,
      currentIndex,
      likedSongIds,
      recentlyPlayed,
      catalogSongs,
      totalPlayTimeSeconds,
      shuffleEnabled,
      repeatMode,
      lastPositionSeconds: position || 0,
      isPlaying,
    };

    try {
      await AsyncStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(payload));
    } catch {
      // Persistence is best-effort.
    }
  }, [
    catalogSongs,
    currentIndex,
    currentSong,
    isPlaying,
    likedSongIds,
    position,
    queue,
    recentlyPlayed,
    repeatMode,
    shuffleEnabled,
    totalPlayTimeSeconds,
  ]);

  const schedulePersist = useCallback(() => {
    if (!hydrated) return;

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(() => {
      void persistState();
    }, 400);
  }, [hydrated, persistState]);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: true,
    }).catch(() => {});

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }

      commitPlaybackTime();
      void unloadCurrentSound();
    };
  }, [commitPlaybackTime, unloadCurrentSound]);

  useEffect(() => {
    if (!hydrated) return;
    schedulePersist();
  }, [
    hydrated,
    schedulePersist,
    currentSong,
    queue,
    currentIndex,
    likedSongIds,
    recentlyPlayed,
    catalogSongs,
    totalPlayTimeSeconds,
    shuffleEnabled,
    repeatMode,
    position,
    isPlaying,
  ]);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const saved = await AsyncStorage.getItem(PLAYER_STATE_KEY);

        if (!saved || !mounted) {
          return;
        }

        const parsed = JSON.parse(saved) as Partial<PersistedState>;
        const restoredQueue = normalizeQueue(parsed.queue as Track[]);
        const queueToUse = restoredQueue.length > 0 ? restoredQueue : defaultQueue;
        const restoredSong = resolveTrack((parsed.currentSong as Track) ?? null, queueToUse);

        setQueue(queueToUse);
        setLikedSongIds(Array.isArray(parsed.likedSongIds) ? parsed.likedSongIds : []);
        setRecentlyPlayed(Array.isArray(parsed.recentlyPlayed) ? parsed.recentlyPlayed : []);
        setCatalogSongs(normalizeQueue(parsed.catalogSongs as Track[]));
        setTotalPlayTimeSeconds(
          typeof parsed.totalPlayTimeSeconds === "number" ? parsed.totalPlayTimeSeconds : 0,
        );
        setShuffleEnabled(Boolean(parsed.shuffleEnabled));
        setRepeatMode(
          parsed.repeatMode === "all" || parsed.repeatMode === "one" ? parsed.repeatMode : "off",
        );

        if (restoredSong) {
          const restoredIndex = queueToUse.findIndex((item) => item.id === restoredSong.id);
          setCurrentSong(restoredSong);
          setCurrentIndex(restoredIndex);

          await loadAndPlayTrack(restoredSong, {
            autoplay: Boolean(parsed.isPlaying),
            startPositionSeconds:
              typeof parsed.lastPositionSeconds === "number" ? parsed.lastPositionSeconds : 0,
          });
        }
      } catch {
        setQueue(defaultQueue);
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [loadAndPlayTrack]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        commitPlaybackTime();
        void persistState();
      }
    });

    return () => subscription.remove();
  }, [commitPlaybackTime, persistState]);

  const rememberRecentlyPlayed = useCallback((track: Track) => {
    setRecentlyPlayed((previous) => {
      const deduped = previous.filter((item) => item.id !== track.id);
      return [track, ...deduped].slice(0, MAX_RECENTLY_PLAYED);
    });
  }, []);

  const playSong = useCallback(
    async (song: Track, nextQueue: Track[] = defaultQueue, options: PlaySongOptions = {}) => {
      if (!song?.id) return;

      const queueToUse = normalizeQueue(nextQueue);
      const initialQueue = queueToUse.length > 0 ? queueToUse : defaultQueue;
      const resolvedSong = resolveTrack(song, initialQueue) ?? song;

      let finalQueue = initialQueue;
      let nextIndex = finalQueue.findIndex((item) => item.id === resolvedSong.id);

      if (nextIndex === -1) {
        finalQueue = [...finalQueue, resolvedSong];
        nextIndex = finalQueue.length - 1;
      }

      commitPlaybackTime();
      setQueue(finalQueue);
      setCurrentIndex(nextIndex);
      setCurrentSong(resolvedSong);
      setCatalogSongs((previous) => mergeUniqueSongs([previous, finalQueue, [resolvedSong]]));
      rememberRecentlyPlayed(resolvedSong);

      try {
        await loadAndPlayTrack(resolvedSong, options);
      } catch {
        setIsPlaying(false);
      }
    },
    [commitPlaybackTime, loadAndPlayTrack, rememberRecentlyPlayed],
  );

  const pause = useCallback(async () => {
    if (!soundRef.current || !isPlaying) return;

    commitPlaybackTime();

    try {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } catch {
      // Ignore pause errors from transient audio states.
    }
  }, [commitPlaybackTime, isPlaying]);

  const resume = useCallback(async () => {
    if (!soundRef.current || isPlaying) return;

    try {
      await soundRef.current.playAsync();
      playbackStartedAtRef.current = Date.now();
      setIsPlaying(true);
    } catch {
      // Ignore resume errors from transient audio states.
    }
  }, [isPlaying]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
      return;
    }

    await resume();
  }, [isPlaying, pause, resume]);

  const seekTo = useCallback(async (seconds: number) => {
    if (!soundRef.current) return;

    try {
      await soundRef.current.setPositionAsync(Math.max(0, Math.floor(seconds * 1000)));
      setPosition(Math.max(0, seconds));
    } catch {
      // Ignore seek errors while buffering.
    }
  }, []);

  const playTrackAtIndex = useCallback(
    async (nextIndex: number) => {
      const tracks = queueRef.current.length > 0 ? queueRef.current : defaultQueue;
      const nextSong = tracks[nextIndex];
      if (!nextSong) return;

      await playSong(nextSong, tracks);
    },
    [playSong],
  );

  const ensureCurrentSongInQueue = useCallback(() => {
    if (!currentSong) return null;

    const tracks = queueRef.current.length > 0 ? queueRef.current : defaultQueue;
    const index = tracks.findIndex((song) => song.id === currentSong.id);

    if (index === -1) {
      setQueue([currentSong]);
      setCurrentIndex(0);
      return { tracks: [currentSong], index: 0 };
    }

    return { tracks, index };
  }, [currentSong]);

  const replayCurrentTrack = useCallback(async () => {
    if (!soundRef.current) return;

    commitPlaybackTime();
    playbackStartedAtRef.current = Date.now();

    try {
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch {
      // Ignore replay errors.
    }
  }, [commitPlaybackTime]);

  const playRandomTrack = useCallback(
    async (avoidIndex?: number) => {
      const tracks = queueRef.current.length > 0 ? queueRef.current : defaultQueue;

      // const randomIndex = pickRandomTrackIndex(tracks.length, avoidIndex);
      const randomIndex = Math.floor(Math.random() * queue.length);
      if (randomIndex === null) return;

      await playTrackAtIndex(randomIndex);
    },
    [playTrackAtIndex],
  );

  const handleTrackEnd = useCallback(async () => {
    const ensuredQueue = ensureCurrentSongInQueue();
    if (!ensuredQueue) return;
    const action = resolveTrackEndAction({
      currentIndex: ensuredQueue.index,
      queueLength: ensuredQueue.tracks.length,
      repeatMode,
      shuffleEnabled,
    });

    if (action.type === "replay") {
      await replayCurrentTrack();
      return;
    }

    if (action.type === "random") {
      await playRandomTrack(ensuredQueue.index);
      return;
    }

    if (action.type === "next") {
      await playTrackAtIndex(action.nextIndex);
      return;
    }

    if (action.type === "restart") {
      await playTrackAtIndex(0);
      return;
    }

    commitPlaybackTime();
    await pause();
  }, [commitPlaybackTime, ensureCurrentSongInQueue, pause, playRandomTrack, playTrackAtIndex, replayCurrentTrack, repeatMode, shuffleEnabled]);

    useEffect(() => {
      handleTrackEndRef.current = () => handleTrackEnd();
    }, [handleTrackEnd]);

  const playNext = useCallback(
    async ({ fromAutoFinish = false }: { fromAutoFinish?: boolean } = {}) => {
      const ensuredQueue = ensureCurrentSongInQueue();
      if (!ensuredQueue) return;

      if (repeatMode === "one") {
        await playTrackAtIndex(ensuredQueue.index);
        return;
      }

      if (shuffleEnabled) {
        if (ensuredQueue.tracks.length === 1) {
          await playTrackAtIndex(0);
          return;
        }

        let randomIndex = ensuredQueue.index;
        while (randomIndex === ensuredQueue.index) {
          randomIndex = Math.floor(Math.random() * ensuredQueue.tracks.length);
        }

        await playTrackAtIndex(randomIndex);
        return;
      }

      const isLastTrack = ensuredQueue.index >= ensuredQueue.tracks.length - 1;

      if (isLastTrack && repeatMode === "off") {
        if (fromAutoFinish) {
          commitPlaybackTime();
          await pause();
        }
        return;
      }

      const nextIndex = (ensuredQueue.index + 1) % ensuredQueue.tracks.length;
      await playTrackAtIndex(nextIndex);
    },
    [commitPlaybackTime, ensureCurrentSongInQueue, pause, playTrackAtIndex, repeatMode, shuffleEnabled],
  );

  const playPrevious = useCallback(async () => {
    const ensuredQueue = ensureCurrentSongInQueue();
    if (!ensuredQueue) return;

    if (repeatMode === "one") {
      await playTrackAtIndex(ensuredQueue.index);
      return;
    }

    if (shuffleEnabled) {
      if (ensuredQueue.tracks.length === 1) {
        await playTrackAtIndex(0);
        return;
      }

      let randomIndex = ensuredQueue.index;
      while (randomIndex === ensuredQueue.index) {
        randomIndex = Math.floor(Math.random() * ensuredQueue.tracks.length);
      }

      await playTrackAtIndex(randomIndex);
      return;
    }

    if (ensuredQueue.index === 0 && repeatMode === "off") {
      return;
    }

    const previousIndex =
      ensuredQueue.index > 0 ? ensuredQueue.index - 1 : ensuredQueue.tracks.length - 1;
    await playTrackAtIndex(previousIndex);
  }, [ensureCurrentSongInQueue, playTrackAtIndex, repeatMode, shuffleEnabled]);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((previous) => !previous);
  }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode((previous) => cycleRepeatMode(previous));
  }, []);

  const registerCatalogTracks = useCallback((tracks: Track[]) => {
    setCatalogSongs((previous) => mergeUniqueSongs([previous, normalizeQueue(tracks)]));
  }, []);

  const toggleLike = useCallback((songId: string) => {
    setLikedSongIds((previous) =>
      previous.includes(songId)
        ? previous.filter((id) => id !== songId)
        : [...previous, songId],
    );
  }, []);

  const isLiked = useCallback(
    (songId: string) => likedSongIds.includes(songId),
    [likedSongIds],
  );

  const value: PlayerContextValue = {
    currentSong,
    isPlaying,
    position,
    duration,
    queue,
    currentIndex,
    likedSongIds,
    recentlyPlayed,
    allSongs,
    totalPlayTimeSeconds,
    shuffleEnabled,
    repeatMode,
    hydrated,
    trackLoading,
    trackError,
    playSong,
    pause,
    resume,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeatMode,
    toggleLike,
    isLiked,
    registerCatalogTracks,
    retryCurrentTrack: async () => {
      if (!currentSong) return;
      await playSong(currentSong, queue.length > 0 ? queue : defaultQueue, {
        autoplay: true,
        startPositionSeconds: 0,
      });
    },
    refreshState: persistState,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }

  return context;
};
