import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  tracks as fallbackTracks,
  type Track,
} from "../constants/catalog";

const FEATURED_CACHE_KEY = "catalog_featured_v2";
const SEARCH_CACHE_PREFIX = "catalog_search_v2_";

const CACHE_TTL_MS = 1000 * 60 * 20;

interface ITunesTrack {
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
  artworkUrl100?: string;
  previewUrl?: string;
}

const getHighQualityArtwork = (url?: string) => {
  if (!url) {
    return fallbackTracks[0]?.artwork ?? "";
  }

  return url
    // iTunes artwork
    .replace("100x100bb", "1200x1200bb")
    .replace("200x200bb", "1200x1200bb")
    .replace("300x300bb", "1200x1200bb")
    .replace("600x600bb", "1200x1200bb")

    // YouTube thumbnails
    .replace(/w60-h60/g, "w1000-h1000")
    .replace(/w120-h120/g, "w1000-h1000")
    .replace(/w180-h180/g, "w1000-h1000")
    .replace(/w300-h300/g, "w1000-h1000");
};

const normalizeItunes = (track: ITunesTrack): Track => ({
  id: String(
    track.trackId ??
      track.collectionId ??
      `${track.artistName}-${track.trackName}`
  ),

  title: track.trackName ?? "Unknown track",

  artist: track.artistName ?? "Unknown artist",

  album: track.collectionName ?? "Single",

  genre: track.primaryGenreName ?? "Music",

  durationSeconds:
    typeof track.trackTimeMillis === "number"
      ? Math.round(track.trackTimeMillis / 1000)
      : undefined,

  artwork: getHighQualityArtwork(track.artworkUrl100),

  url: track.previewUrl ?? fallbackTracks[0]?.url ?? "",

  source: "itunes",
});

const readCache = async (key: string) => {
  try {
    const raw = await AsyncStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed?.updatedAt ||
      !Array.isArray(parsed?.data)
    ) {
      return null;
    }

    if (
      Date.now() - parsed.updatedAt >
      CACHE_TTL_MS
    ) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = async (
  key: string,
  data: Track[]
) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        updatedAt: Date.now(),
        data,
      })
    );
  } catch {
    // Cache is best-effort only.
  }
};

const clearOldCaches = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();

    const oldKeys = keys.filter(
      (key) =>
        key.startsWith("catalog_featured_v1") ||
        key.startsWith("catalog_search_v1_")
    );

    if (oldKeys.length > 0) {
      await AsyncStorage.multiRemove(oldKeys);
    }
  } catch {
    // Ignore cache cleanup errors.
  }
};

const fetchTracks = async (
  term: string
): Promise<Track[]> => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      term
    )}&entity=song&limit=20`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch tracks for ${term}`
    );
  }

  const json = await response.json();

  return (json.results ?? [])
    .filter((track: ITunesTrack) => track.previewUrl)
    .map(normalizeItunes);
};

export const getFeaturedTracks = async () => {
  await clearOldCaches();

  const cached = await readCache(
    FEATURED_CACHE_KEY
  );

  if (cached?.length) {
    return cached;
  }

  try {
    const [pop, electronic, indie] =
      await Promise.all([
        fetchTracks("pop"),
        fetchTracks("electronic"),
        fetchTracks("indie"),
      ]);

    const merged = [
      ...pop,
      ...electronic,
      ...indie,
    ];

    const unique = merged.filter(
      (track, index, list) =>
        list.findIndex(
          (item) => item.id === track.id
        ) === index
    );

    const result =
      unique.length > 0
        ? unique.slice(0, 12)
        : fallbackTracks;

    await writeCache(
      FEATURED_CACHE_KEY,
      result
    );

    return result;
  } catch {
    return fallbackTracks;
  }
};

export const searchMusic = async (
  term: string
) => {
  await clearOldCaches();

  const cleanedTerm = term.trim();

  if (!cleanedTerm) {
    return getFeaturedTracks();
  }

  const cacheKey = `${SEARCH_CACHE_PREFIX}${cleanedTerm.toLowerCase()}`;

  const cached = await readCache(cacheKey);

  if (cached?.length) {
    return cached;
  }

  try {
    const tracks = await fetchTracks(
      cleanedTerm
    );

    const result =
      tracks.length > 0
        ? tracks
        : fallbackTracks;

    await writeCache(cacheKey, result);

    return result;
  } catch {
    const lowerTerm =
      cleanedTerm.toLowerCase();

      return fallbackTracks.filter((track) =>
      [
        track.title,
        track.artist,
        track.album,
        track.genre,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) =>
          value
            .toLowerCase()
            .includes(lowerTerm)
        )
    );
  }
};