import { describe, expect, it } from "vitest";
import type { Track } from "../constants/catalog";
import {
  moveQueueStateItem,
  removeFromQueueState,
  resolveQueueState,
} from "./playerQueue";

const makeTrack = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  artist: "Artist",
  url: `https://example.com/${id}`,
});

describe("player queue helpers", () => {
  const queue = [makeTrack("a"), makeTrack("b"), makeTrack("c"), makeTrack("d")];

  it("reorders the current song and recalculates its index by id", () => {
    const state = resolveQueueState(queue, "c");
    const nextState = moveQueueStateItem(state, 2, 0);

    expect(nextState.queue.map((track) => track.id)).toEqual(["c", "a", "b", "d"]);
    expect(nextState.currentSong?.id).toBe("c");
    expect(nextState.currentIndex).toBe(0);
  });

  it("keeps the current index stable when a different item moves", () => {
    const state = resolveQueueState(queue, "c");
    const nextState = moveQueueStateItem(state, 0, 3);

    expect(nextState.queue.map((track) => track.id)).toEqual(["b", "c", "d", "a"]);
    expect(nextState.currentSong?.id).toBe("c");
    expect(nextState.currentIndex).toBe(1);
  });

  it("moves the next song into place when the current song is removed", () => {
    const state = resolveQueueState(queue, "b");
    const outcome = removeFromQueueState(state, "b");

    expect(outcome.queue.map((track) => track.id)).toEqual(["a", "c", "d"]);
    expect(outcome.currentSong?.id).toBe("c");
    expect(outcome.currentIndex).toBe(1);
    expect(outcome.nextSongToPlay?.id).toBe("c");
    expect(outcome.stopped).toBe(false);
  });

  it("shifts the current index when removing a track above the current song", () => {
    const state = resolveQueueState(queue, "c");
    const outcome = removeFromQueueState(state, "a");

    expect(outcome.queue.map((track) => track.id)).toEqual(["b", "c", "d"]);
    expect(outcome.currentSong?.id).toBe("c");
    expect(outcome.currentIndex).toBe(1);
    expect(outcome.nextSongToPlay).toBeNull();
  });

  it("keeps the current index when removing a track below the current song", () => {
    const state = resolveQueueState(queue, "b");
    const outcome = removeFromQueueState(state, "d");

    expect(outcome.queue.map((track) => track.id)).toEqual(["a", "b", "c"]);
    expect(outcome.currentSong?.id).toBe("b");
    expect(outcome.currentIndex).toBe(1);
    expect(outcome.nextSongToPlay).toBeNull();
  });

  it("stops when the final track is removed", () => {
    const state = resolveQueueState([makeTrack("a")], "a");
    const outcome = removeFromQueueState(state, "a");

    expect(outcome.queue).toEqual([]);
    expect(outcome.currentSong).toBeNull();
    expect(outcome.currentIndex).toBe(-1);
    expect(outcome.nextSongToPlay).toBeNull();
    expect(outcome.stopped).toBe(true);
  });
});
