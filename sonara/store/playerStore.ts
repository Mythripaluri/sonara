import { create } from "zustand";
import type { Track } from "../constants/catalog";
import {
  enqueueLastState,
  enqueueNextState,
  moveQueueStateItem,
  normalizeQueue,
  removeFromQueueState,
  resolveQueueState,
  setPlaybackQueue,
  type PlayerQueueState,
  type QueueRemovalResult,
} from "../utils/playerQueue";

export type PlayerStoreState = PlayerQueueState & {
  setPlaybackState: (queue: Track[], currentSong: Track | null) => void;
  replaceQueue: (tracks: Track[]) => void;
  enqueueNext: (song: Track) => void;
  enqueueLast: (song: Track) => void;
  moveQueueItem: (from: number, to: number) => void;
  removeFromQueue: (id: string) => QueueRemovalResult;
};

export const usePlayerStore = create<PlayerStoreState>()((set, get) => ({
  queue: [],
  currentIndex: -1,
  currentSong: null,

  setPlaybackState: (queue: Track[], currentSong: Track | null) => {
    set(setPlaybackQueue(queue, currentSong));
  },

  replaceQueue: (tracks: Track[]) => {
    const currentSong = get().currentSong;
    set(resolveQueueState(normalizeQueue(tracks), currentSong?.id ?? null));
  },

  enqueueNext: (song: Track) => {
    set((state) => enqueueNextState(state, song));
  },

  enqueueLast: (song: Track) => {
    set((state) => enqueueLastState(state, song));
  },

  moveQueueItem: (from: number, to: number) => {
    set((state) => moveQueueStateItem(state, from, to));
  },

  removeFromQueue: (id: string) => {
    const outcome = removeFromQueueState(get(), id);
    set({
      queue: outcome.queue,
      currentIndex: outcome.currentIndex,
      currentSong: outcome.currentSong,
    });

    return outcome;
  },
}));
