export function normalizeTrackForPlayer(track: any) {
  if (!track) return track;

  const id = track.id ?? track.trackId ?? track.videoId ?? track.resourceId ?? null;
  const title = track.title ?? track.name ?? track.trackName ?? "";
  const artist =
    track.artist ??
    (Array.isArray(track.artists) ? track.artists.map((a: any) => a?.name ?? a).join(", ") : undefined) ??
    track.artists?.[0]?.name ?? "";

  const artwork =
    track.artwork ?? track.image ?? track.thumbnail ?? track.album?.images?.[0]?.url ?? track.albumArt ?? "";

  const url = track.url ?? track.streamUrl ?? track.audioUrl ?? null;
  const videoId = track.videoId ?? track.video_id ?? track.ytId ?? null;
  const source = track.source ?? track.provider ?? "unknown";

  return {
    id,
    title,
    artist,
    artwork,
    url,
    videoId,
    source,
  };
}

export default normalizeTrackForPlayer;
