import { describe, expect, it, vi } from "vitest";
import {
  cycleRepeatMode,
  pickRandomTrackIndex,
  resolveTrackEndAction,
} from "./playback";

describe("playback helpers", () => {
  it("cycles repeat mode in order", () => {
    expect(cycleRepeatMode("off")).toBe("all");
    expect(cycleRepeatMode("all")).toBe("one");
    expect(cycleRepeatMode("one")).toBe("off");
  });

  it("resolves track end actions for repeat and shuffle", () => {
    expect(
      resolveTrackEndAction({
        currentIndex: 2,
        queueLength: 5,
        repeatMode: "one",
        shuffleEnabled: false,
      }),
    ).toEqual({ type: "replay" });

    expect(
      resolveTrackEndAction({
        currentIndex: 4,
        queueLength: 5,
        repeatMode: "all",
        shuffleEnabled: false,
      }),
    ).toEqual({ type: "restart" });

    expect(
      resolveTrackEndAction({
        currentIndex: 4,
        queueLength: 5,
        repeatMode: "off",
        shuffleEnabled: false,
      }),
    ).toEqual({ type: "stop" });

    expect(
      resolveTrackEndAction({
        currentIndex: 1,
        queueLength: 5,
        repeatMode: "off",
        shuffleEnabled: false,
      }),
    ).toEqual({ type: "next", nextIndex: 2 });
  });

  it("picks a different random index when possible", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0);

    expect(pickRandomTrackIndex(4, 0)).toBe(1);
    expect(pickRandomTrackIndex(1, 0)).toBe(0);

    mockRandom.mockRestore();
  });
});