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
import { getAudioUrl, prefetchAudioUrl } from "../services/audioService";
import { normalizeTrackForPlayer } from "../utils/normalizeTrackForPlayer";
import { usePlaylistStore } from "../store/playlistStore";
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
  isBuffering: boolean;
  trackLoading: boolean;
  trackError: string | null;
};

type PlaySongOptions = {
  autoplay?: boolean;
  startPositionSeconds?: number;
  preloadedAudioUrl?: string;
};

type PlayerContextValue = PlayerState & {
  playSong: (song: Track, nextQueue?: Track[], options?: PlaySongOptions) => Promise<void>;
  enqueueSong: (song: Track) => void;
  enqueueNext: (song: Track) => void;
  replaceQueue: (tracks: Track[]) => void;
  removeFromQueue: (id: string) => Promise<void>;
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
    ? tracks
        .map((track) => normalizeTrackForPlayer(track))
        .filter((track) => Boolean(track?.id) && Boolean(track?.title))
    : [];

const mergeUniqueSongs = (collections: Track[][]): Track[] => {
  const map = new Map<string, Track>();

  collections.flat().forEach((track) => {
    const normalized = normalizeTrackForPlayer(track);
    if (!normalized?.id || !normalized?.title) return;
    if (!map.has(normalized.id)) {
      map.set(normalized.id, normalized);
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
  const currentIndexRef = useRef(-1);
  const loadRequestIdRef = useRef(0);
  const nextStreamRef = useRef<{ trackId: string; url: string } | null>(null);
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
  const [isBuffering, setIsBuffering] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const playlistStore = usePlaylistStore();

  const allSongs = useMemo(
    () => mergeUniqueSongs([catalogSongs, recentlyPlayed, queue, defaultQueue]),
    [catalogSongs, recentlyPlayed, queue],
  );

  useEffect(() => {
    // Ensure a default "Liked Songs" playlist exists and keep it in sync with likedSongIds
    const likedName = "Liked Songs";
    const existing = playlistStore.getPlaylistByName(likedName);

    if (!existing) {
      const created = playlistStore.createPlaylist(likedName, "Songs you liked");
      if (likedSongIds.length > 0) {
        const likedTracks = allSongs.filter((t) => likedSongIds.includes(t.id));
        playlistStore.replacePlaylistSongs(created.id, likedTracks);
      }
      return;
    }

    // Keep songs in the liked playlist synchronized with likedSongIds
    const likedTracks = allSongs.filter((t) => likedSongIds.includes(t.id));
    const same =
      likedTracks.length === existing.songs.length &&
      likedTracks.every((t, i) => t.id === existing.songs[i]?.id);

    if (!same) {
      playlistStore.replacePlaylistSongs(existing.id, likedTracks);
    }
  }, [likedSongIds, allSongs, playlistStore]);

  useEffect(() => {
    if (currentIndex < 0) {
      nextStreamRef.current = null;
      return;
    }

    const liveQueue = queueRef.current.length > 0 ? queueRef.current : defaultQueue;
    const nextTrack = liveQueue[currentIndex + 1];
    const secondNextTrack = liveQueue[currentIndex + 2];
    let cancelled = false;

    if (nextTrack) {
      prefetchAudioUrl(nextTrack);
      void getAudioUrl(nextTrack)
        .then((url) => {
          if (!cancelled) {
            nextStreamRef.current = { trackId: nextTrack.id, url };
          }
        })
        .catch(() => {
          if (!cancelled && nextStreamRef.current?.trackId === nextTrack.id) {
            nextStreamRef.current = null;
          }
        });
    }

    if (!nextTrack) {
      nextStreamRef.current = null;
    }

    if (secondNextTrack) {
      prefetchAudioUrl(secondNextTrack);
    }

    return () => {
      cancelled = true;
    };
  }, [currentIndex]);

  useEffect(() => {
    indexRef.current = currentIndex;
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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
    async (track: Track, options: PlaySongOptions = {}, loadRequestId?: number) => {
      const activeLoadRequestId = loadRequestId ?? ++loadRequestIdRef.current;
      const isCurrentLoadRequest = () => loadRequestIdRef.current === activeLoadRequestId;

      setIsBuffering(true);
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
          const audioUrl =
            !forceRefresh && options.preloadedAudioUrl
              ? options.preloadedAudioUrl
              : await getAudioUrl(track, { forceRefresh });

          if (!audioUrl) {
            console.warn("[Player] NO AUDIO URL", track);
            throw new Error("No audio URL available for track");
          }

          await nextSound.loadAsync({ uri: audioUrl }, playbackOptions, true);
        };

        const retryPlan = [false, false, true];
        let lastLoadError = null;

        for (let attempt = 0; attempt < retryPlan.length; attempt += 1) {
          try {
            await loadFromResolvedStream(retryPlan[attempt]);

            if (!isCurrentLoadRequest()) {
              try {
                await nextSound.unloadAsync();
              } catch {
                // Ignore cleanup failures for an abandoned load.
              }

              return;
            }

            lastLoadError = null;
            break;
          } catch (error) {
            if (!isCurrentLoadRequest()) {
              try {
                await nextSound.unloadAsync();
              } catch {
                // Ignore cleanup failures for an abandoned load.
              }

              return;
            }

            lastLoadError = error;
            const isLastAttempt = attempt === retryPlan.length - 1;

            if (isLastAttempt) {
              throw error;
            }

            console.log(
              `[Player] Load attempt ${attempt + 1} failed, retrying${retryPlan[attempt + 1] ? " with refresh" : ""}`,
            );
          }
        }

        if (lastLoadError) {
          throw lastLoadError;
        }

        if (!isCurrentLoadRequest()) {
          try {
            await nextSound.unloadAsync();
          } catch {
            // Ignore cleanup failures for an abandoned load.
          }

          return;
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
        if (!isCurrentLoadRequest()) {
          try {
            await nextSound.unloadAsync();
          } catch {
            // Ignore cleanup failures for an abandoned load.
          }

          return;
        }

        try {
          await nextSound.unloadAsync();
        } catch {
          // Ignore cleanup failures for a sound that never loaded.
        }

        setIsPlaying(false);
        setTrackError(loadError instanceof Error ? loadError.message : "Unable to load track");
        throw loadError;
      } finally {
        setIsBuffering(false);
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
        queueRef.current = queueToUse;
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
          currentIndexRef.current = restoredIndex;
          setCurrentIndex(restoredIndex);
          nextStreamRef.current = null;

          const loadRequestId = ++loadRequestIdRef.current;

          await loadAndPlayTrack(restoredSong, {
            autoplay: Boolean(parsed.isPlaying),
            startPositionSeconds:
              typeof parsed.lastPositionSeconds === "number" ? parsed.lastPositionSeconds : 0,
          }, loadRequestId);
        }
      } catch {
        setQueue(defaultQueue);
        queueRef.current = defaultQueue;
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

  const enqueueSong = useCallback((song: Track) => {
    const normalized = normalizeTrackForPlayer(song);
    if (!normalized?.id) return;

    setQueue((previousQueue) => {
      const existingIndex = previousQueue.findIndex((item) => item.id === normalized.id);
      if (existingIndex !== -1) {
        // Keep queue stable while making the action visible: move existing track to end.
        const moved = previousQueue[existingIndex];
        const without = previousQueue.filter((_, idx) => idx !== existingIndex);
        const nextQueue = [...without, moved];
        queueRef.current = nextQueue;
        return nextQueue;
      }

      const nextQueue = [...previousQueue, normalized];
      queueRef.current = nextQueue;
      return nextQueue;
    });

    setCatalogSongs((previous) => mergeUniqueSongs([previous, [normalized]]));
  }, []);

  const enqueueNext = useCallback((song: Track) => {
    const normalized = normalizeTrackForPlayer(song);
    if (!normalized?.id) return;

    setQueue((previousQueue) => {
      let queueToUse = [...previousQueue];

      // If track already exists, move it to play next instead of ignoring.
      const existingIndex = queueToUse.findIndex((item) => item.id === normalized.id);
      if (existingIndex !== -1) {
        const [existing] = queueToUse.splice(existingIndex, 1);
        const liveIndex = currentIndexRef.current;
        const insertIndex = Math.max(0, liveIndex >= 0 ? liveIndex + 1 : queueToUse.length);
        queueToUse.splice(insertIndex, 0, existing);
        queueRef.current = queueToUse;
        return queueToUse;
      }

      const liveIndex = currentIndexRef.current;
      const insertIndex = Math.max(0, liveIndex >= 0 ? liveIndex + 1 : queueToUse.length);
      queueToUse.splice(insertIndex, 0, normalized);
      queueRef.current = queueToUse;
      return queueToUse;
    });

    setCatalogSongs((previous) => mergeUniqueSongs([previous, [normalized]]));
  }, []);

  const replaceQueue = useCallback((newQueue: Track[]) => {
    setQueue([...newQueue]);
    queueRef.current = [...newQueue];
    nextStreamRef.current = null;

    if (!currentSong) return;

    const updatedIndex = newQueue.findIndex(
      (song) => song.id === currentSong.id
    );

    if (updatedIndex !== -1) {
      currentIndexRef.current = updatedIndex;
      setCurrentIndex(updatedIndex);
    }
  }, [currentSong]);

  const removeFromQueue = useCallback(
    async (id: string) => {
      const removingCurrent = queueRef.current[currentIndexRef.current]?.id === id;

      const updatedQueue = queueRef.current.filter((song) => song.id !== id);

      if (updatedQueue.length === 0) {
        setQueue([]);
        setCurrentIndex(0);
        setCurrentSong(null);

        if (soundRef.current) {
          await soundRef.current.stopAsync();
        }
        return;
      }

      if (removingCurrent) {
        const nextIndex =
          currentIndexRef.current >= updatedQueue.length
            ? updatedQueue.length - 1
            : currentIndexRef.current;

        setQueue(updatedQueue);
        queueRef.current = updatedQueue;
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;

        await playSong(updatedQueue[nextIndex], updatedQueue);
      } else {
        const removedIndex = queueRef.current.findIndex(
          (song) => song.id === id
        );

        setQueue(updatedQueue);
        queueRef.current = updatedQueue;

        if (removedIndex < currentIndexRef.current) {
          setCurrentIndex((prev) => prev - 1);
          currentIndexRef.current = currentIndexRef.current - 1;
        }
      }
    },
    [playSong],
  );

  const playSong = useCallback(
    async (song: Track, nextQueue: Track[] = defaultQueue, options: PlaySongOptions = {}) => {
      if (!song) return;

      const normalizedSong = normalizeTrackForPlayer(song);
      if (!normalizedSong?.id) return;

      const loadRequestId = ++loadRequestIdRef.current;
      nextStreamRef.current = null;

      const queueToUse = normalizeQueue(nextQueue);
      const liveQueue = queueRef.current.length > 0 ? queueRef.current : defaultQueue;
      const initialQueue = queueToUse.length > 0 ? queueToUse : liveQueue;
      const resolvedSong = resolveTrack(normalizedSong, initialQueue) ?? normalizedSong;

      let finalQueue = initialQueue;
      let nextIndex = finalQueue.findIndex((item) => item.id === resolvedSong.id);

      if (nextIndex === -1) {
        finalQueue = [...finalQueue, resolvedSong];
        nextIndex = finalQueue.length - 1;
      }

      commitPlaybackTime();
      setQueue(finalQueue);
      queueRef.current = finalQueue;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      setCurrentSong(resolvedSong);
      setCatalogSongs((previous) => mergeUniqueSongs([previous, finalQueue, [resolvedSong]]));
      rememberRecentlyPlayed(resolvedSong);

      try {
        await loadAndPlayTrack(resolvedSong, options, loadRequestId);
      } catch (loadError) {
        // ✅ FIX 2: On playback error, explicitly set error state
        // DO NOT auto-skip to next song. Let user retry or manually skip.
        setIsPlaying(false);
        console.error("[Player] Failed to load track:", loadError);
        
        // Show error but keep queue intact for retry
        setTrackError(
          loadError instanceof Error 
            ? loadError.message 
            : "Unable to play track"
        );
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

      const preloadedAudioUrl =
        nextStreamRef.current?.trackId === nextSong.id ? nextStreamRef.current.url : undefined;

      nextStreamRef.current = null;

      await playSong(nextSong, tracks, preloadedAudioUrl ? { preloadedAudioUrl } : undefined);
    },
    [playSong],
  );

  const ensureCurrentSongInQueue = useCallback(() => {
    if (!currentSong) return null;

    const tracks = queueRef.current.length > 0 ? queueRef.current : defaultQueue;
    const index = tracks.findIndex((song) => song.id === currentSong.id);

    if (index === -1) {
      const nextQueue = [...tracks, currentSong];
      const nextIndex = nextQueue.length - 1;
      setQueue(nextQueue);
      queueRef.current = nextQueue;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      return { tracks: nextQueue, index: nextIndex };
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
      const randomIndex = pickRandomTrackIndex(tracks.length, avoidIndex);
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
    isBuffering,
    trackLoading,
    trackError,
    playSong,
    enqueueSong,
    enqueueNext,
    replaceQueue,
    removeFromQueue,
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
      const liveQueue = queueRef.current.length > 0 ? queueRef.current : defaultQueue;
      await playSong(currentSong, liveQueue, {
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
