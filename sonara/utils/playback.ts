export type RepeatMode = "off" | "all" | "one";

export type TrackEndAction =
  | { type: "replay" }
  | { type: "random" }
  | { type: "next"; nextIndex: number }
  | { type: "restart" }
  | { type: "stop" };

export const cycleRepeatMode = (mode: RepeatMode): RepeatMode => {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
};

export const pickRandomTrackIndex = (queueLength: number, avoidIndex?: number): number | null => {
  if (queueLength <= 0) return null;
  if (queueLength === 1) return 0;

  let randomIndex = Math.floor(Math.random() * queueLength);

  if (typeof avoidIndex === "number" && randomIndex === avoidIndex) {
    randomIndex = (randomIndex + 1) % queueLength;
  }

  return randomIndex;
};

export const resolveTrackEndAction = ({
  currentIndex,
  queueLength,
  repeatMode,
  shuffleEnabled,
}: {
  currentIndex: number;
  queueLength: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
}): TrackEndAction => {
  if (repeatMode === "one") {
    return { type: "replay" };
  }

  if (shuffleEnabled) {
    return { type: "random" };
  }

  const isLastTrack = currentIndex >= queueLength - 1;

  if (isLastTrack) {
    return repeatMode === "all" ? { type: "restart" } : { type: "stop" };
  }

  return { type: "next", nextIndex: currentIndex + 1 };
};