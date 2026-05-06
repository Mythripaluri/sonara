import Constants from "expo-constants";
import { tracks as fallbackTracks, type Track } from "../constants/catalog";

export type SearchResult = {
  title: string;
  artist: string;
  videoId: string;
  thumbnail: string;
  preResolved?: boolean;
};

type StreamResponse = {
  url?: string;
  title?: string;
  artist?: string;
  duration?: number;
  provider?: string;
  image?: string;
};

const SEARCH_CACHE_TTL_MS = 1000 * 60 * 20;

const searchCache = new Map<string, { results: SearchResult[]; expiresAt: number }>();

const getBackendStreamUrl = () => {
  const configUrl = Constants.expoConfig?.extra?.audioBackendUrl;

  if (typeof configUrl === "string" && configUrl.length > 0) {
    return configUrl;
  }

  return "http://localhost:3000";
};

const getSearchCacheKey = (query: string) => query.trim().toLowerCase();

const getCachedSearchResults = (query: string) => {
  const cached = searchCache.get(getSearchCacheKey(query));
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    searchCache.delete(getSearchCacheKey(query));
    return null;
  }

  return cached.results;
};

const setCachedSearchResults = (query: string, results: SearchResult[]) => {
  searchCache.set(getSearchCacheKey(query), {
    results,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
};

const buildResolvedTrack = (videoId: string, response: StreamResponse, fallbackTitle: string): Track => ({
  id: videoId,
  title: response.title || fallbackTitle || "Unknown track",
  artist: response.artist || "",
  artwork: response.image || fallbackTracks[0]?.artwork || "",
  url: response.url || "",
  resolvedAudioUrl: response.url || "",
  source: "resolved",
  durationSeconds: response.duration,
  videoId,
});

export const buildTrackFromSearchResult = (result: SearchResult): Track => ({
  id: result.videoId,
  title: result.title || "Unknown track",
  artist: result.artist || "",
  artwork: result.thumbnail || fallbackTracks[0]?.artwork || "",
  url: "",
  source: "resolved",
  videoId: result.videoId,
});

export const searchVideos = async (query: string): Promise<SearchResult[]> => {
  const cleaned = query.trim();
  if (!cleaned || cleaned.length < 3) return [];

  const cached = getCachedSearchResults(cleaned);
  if (cached) return cached;

  const backendUrl = getBackendStreamUrl();
  const endpoint = `${backendUrl}/search?q=${encodeURIComponent(cleaned)}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const results = (await response.json()) as SearchResult[];
  setCachedSearchResults(cleaned, results);
  return results;
};

export const resolveVideoToTrack = async (videoId: string, fallbackTitle = ""): Promise<Track> => {
  const backendUrl = getBackendStreamUrl();
  const endpoint = `${backendUrl}/stream?videoId=${encodeURIComponent(videoId)}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Stream preload failed: ${response.status}`);
  }

  const payload = (await response.json()) as StreamResponse;

  if (!payload.url) {
    throw new Error("No audio URL returned for video");
  }

  return buildResolvedTrack(videoId, payload, fallbackTitle);
};

export const prewarmVideoAudio = async (videoId: string, fallbackTitle = ""): Promise<void> => {
  try {
    await resolveVideoToTrack(videoId, fallbackTitle);
  } catch {
    // Preload is best-effort.
  }
};
