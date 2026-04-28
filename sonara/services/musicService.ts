import AsyncStorage from "@react-native-async-storage/async-storage";
import { tracks as fallbackTracks, type Track } from "../constants/catalog";

const FEATURED_CACHE_KEY = "catalog_featured_v1";
const SEARCH_CACHE_PREFIX = "catalog_search_v1_";
const CACHE_TTL_MS = 1000 * 60 * 20;

const normalizeItunes = (track): Track => ({
  id: String(track.trackId ?? track.collectionId ?? `${track.artistName}-${track.trackName}`),
  title: track.trackName ?? "Unknown track",
  artist: track.artistName ?? "Unknown artist",
  album: track.collectionName ?? "Single",
  genre: track.primaryGenreName ?? "Music",
  durationSeconds: typeof track.trackTimeMillis === "number" ? Math.round(track.trackTimeMillis / 1000) : undefined,
  artwork: track.artworkUrl100
    ? track.artworkUrl100.replace(/100x100bb/, "600x600bb")
    : fallbackTracks[0]?.artwork,
  url: track.previewUrl ?? fallbackTracks[0]?.url ?? "",
  source: "itunes",
});

const readCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.updatedAt || !Array.isArray(parsed?.data)) {
      return null;
    }

    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        updatedAt: Date.now(),
        data,
      }),
    );
  } catch {
    // Best-effort cache only.
  }
};

const fetchTracks = async (term) => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=20`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tracks for ${term}`);
  }

  const json = await response.json();
  return (json.results ?? [])
    .filter((track) => track.previewUrl)
    .map(normalizeItunes);
};

export const getFeaturedTracks = async () => {
  const cached = await readCache(FEATURED_CACHE_KEY);
  if (cached?.length) {
    return cached;
  }

  try {
    const [pop, electronic, indie] = await Promise.all([
      fetchTracks("pop"),
      fetchTracks("electronic"),
      fetchTracks("indie"),
    ]);

    const merged = [...pop, ...electronic, ...indie];
    const unique = merged.filter(
      (track, index, list) => list.findIndex((item) => item.id === track.id) === index,
    );

    const result = unique.length > 0 ? unique.slice(0, 12) : fallbackTracks;
    await writeCache(FEATURED_CACHE_KEY, result);
    return result;
  } catch {
    return fallbackTracks;
  }
};

export const searchMusic = async (term) => {
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
    const tracks = await fetchTracks(cleanedTerm);
    const result = tracks.length > 0 ? tracks : fallbackTracks;
    await writeCache(cacheKey, result);
    return result;
  } catch {
    const lowerTerm = cleanedTerm.toLowerCase();
    return fallbackTracks.filter((track) =>
      [track.title, track.artist, track.album, track.genre]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lowerTerm)),
    );
  }
};