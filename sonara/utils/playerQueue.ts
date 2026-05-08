import type { Track } from "../constants/catalog";
import { normalizeTrackForPlayer } from "./normalizeTrackForPlayer";

export type PlayerQueueState = {
  queue: Track[];
  currentIndex: number;
  currentSong: Track | null;
};

export type QueueRemovalResult = PlayerQueueState & {
  nextSongToPlay: Track | null;
  stopped: boolean;
};

const clampIndex = (value: number, length: number) => {
  if (length <= 0) return -1;
  return Math.max(0, Math.min(value, length - 1));
};

export const normalizeQueue = (tracks: Track[] | null | undefined): Track[] => {
  if (!Array.isArray(tracks)) return [];

  return tracks
    .map((track) => normalizeTrackForPlayer(track))
    .filter((track) => Boolean(track?.id) && Boolean(track?.title));
};

export const reorderQueue = (tracks: Track[], from: number, to: number): Track[] => {
  if (from === to) return [...tracks];
  if (from < 0 || to < 0 || from >= tracks.length || to >= tracks.length) return [...tracks];

  const nextQueue = [...tracks];
  const [movedTrack] = nextQueue.splice(from, 1);

  if (!movedTrack) return [...tracks];

  nextQueue.splice(to, 0, movedTrack);
  return nextQueue;
};

const resolveCurrentSongId = (state: PlayerQueueState): string | null =>
  state.currentSong?.id ?? state.queue[state.currentIndex]?.id ?? null;

export const resolveQueueState = (
  queue: Track[],
  currentSongId: string | null,
): PlayerQueueState => {
  const nextQueue = normalizeQueue(queue);

  if (!currentSongId) {
    return {
      queue: nextQueue,
      currentIndex: -1,
      currentSong: null,
    };
  }

  const currentIndex = nextQueue.findIndex((track) => track.id === currentSongId);

  return {
    queue: nextQueue,
    currentIndex,
    currentSong: currentIndex >= 0 ? nextQueue[currentIndex] : null,
  };
};

export const setPlaybackQueue = (
  queue: Track[],
  currentSong: Track | null,
): PlayerQueueState => resolveQueueState(queue, currentSong?.id ?? null);

export const moveQueueStateItem = (
  state: PlayerQueueState,
  from: number,
  to: number,
): PlayerQueueState => {
  const nextQueue = reorderQueue(state.queue, from, to);
  const currentSongId = resolveCurrentSongId(state);

  return resolveQueueState(nextQueue, currentSongId);
};

const insertTrackAt = (tracks: Track[], song: Track, index: number): Track[] => {
  const normalizedSong = normalizeTrackForPlayer(song);
  if (!normalizedSong?.id) return [...tracks];

  const nextQueue = [...tracks.filter((track) => track.id !== normalizedSong.id)];
  const insertIndex = Math.max(
    0,
    Math.min(index, nextQueue.length)
    );

  nextQueue.splice(insertIndex, 0, normalizedSong);
  return nextQueue;
};

export const enqueueNextState = (
  state: PlayerQueueState,
  song: Track,
): PlayerQueueState => {
  const normalizedSong = normalizeTrackForPlayer(song);
  if (!normalizedSong?.id) return state;

  const liveIndex = state.currentIndex >= 0 ? state.currentIndex + 1 : state.queue.length;
  const nextQueue = insertTrackAt(state.queue, normalizedSong, liveIndex);

  return resolveQueueState(nextQueue, resolveCurrentSongId(state));
};

export const enqueueLastState = (
  state: PlayerQueueState,
  song: Track,
): PlayerQueueState => {
  const normalizedSong = normalizeTrackForPlayer(song);
  if (!normalizedSong?.id) return state;

  const nextQueue = insertTrackAt(state.queue, normalizedSong, state.queue.length);

  return resolveQueueState(nextQueue, resolveCurrentSongId(state));
};

export const removeFromQueueState = (
  state: PlayerQueueState,
  id: string,
): QueueRemovalResult => {
  const currentSongId = resolveCurrentSongId(state);
  const removedIndex = state.queue.findIndex((track) => track.id === id);

  if (removedIndex === -1) {
    return {
      ...state,
      nextSongToPlay: null,
      stopped: false,
    };
  }

  const nextQueue = state.queue.filter((track) => track.id !== id);

  if (nextQueue.length === 0) {
    return {
      queue: [],
      currentIndex: -1,
      currentSong: null,
      nextSongToPlay: null,
      stopped: true,
    };
  }

  if (currentSongId === id) {
    const nextIndex = clampIndex(removedIndex, nextQueue.length);
    const nextSongToPlay = nextQueue[nextIndex] ?? null;

    return {
      queue: nextQueue,
      currentIndex: nextIndex,
      currentSong: nextSongToPlay,
      nextSongToPlay,
      stopped: false,
    };
  }

  const nextCurrentIndex = removedIndex < state.currentIndex ? state.currentIndex - 1 : state.currentIndex;
  const resolvedCurrentIndex = clampIndex(nextCurrentIndex, nextQueue.length);

  return {
    queue: nextQueue,
    currentIndex: resolvedCurrentIndex,
    currentSong: resolvedCurrentIndex >= 0 ? nextQueue[resolvedCurrentIndex] : null,
    nextSongToPlay: null,
    stopped: false,
  };
};
