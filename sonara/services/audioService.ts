// import Constants from "expo-constants";
// import { type Track } from "../constants/catalog";

// type AudioResolverResponse = {
//   url?: string;
//   title?: string;
//   provider?: string;
// };

// const getBackendStreamUrl = () => {
//   // Try to get from config first
//   const configUrl = Constants.expoConfig?.extra?.audioBackendUrl;
//   if (typeof configUrl === "string" && configUrl.length > 0) {
//     return configUrl;
//   }
//   // Default to localhost (works in Expo Go on Android emulator/iOS simulator)
//   return "http://localhost:3000";
// };

// const getResolverEndpoint = () => {
//   const endpoint = Constants.expoConfig?.extra?.audioResolverUrl;
//   return typeof endpoint === "string" && endpoint.length > 0 ? endpoint : null;
// };

// export const getAudioUrl = async (track: Track): Promise<string> => {
//   // Try to resolve via backend first (yt-dlp integration)
//   try {
//     const backendUrl = getBackendStreamUrl();
//     // Build search query from track info with "official audio" for better accuracy
//     const searchQuery = `${track.title} ${track.artist} official audio`;
//     const endpoint = `${backendUrl}/stream?q=${encodeURIComponent(searchQuery)}`;

//     console.log(`[AudioService] Fetching:`, searchQuery);
//     const response = await fetch(endpoint);
//     if (response.ok) {
//       const payload = (await response.json()) as AudioResolverResponse;
//       if (payload.url && payload.url.length > 0) {
//         console.log(`[AudioService] ✅ Resolved from ${payload.provider}:`, track.title);
//         return payload.url;
//       }
//     }
//   } catch (err) {
//     console.log("[AudioService] Backend resolver failed:", err instanceof Error ? err.message : err);
//   }

//   // Fallback to local resolver endpoint if configured
//   const endpoint = getResolverEndpoint();
//   if (endpoint) {
//     try {
//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           trackId: track.id,
//           title: track.title,
//           artist: track.artist,
//           sourceUrl: track.url,
//         }),
//       });

//       if (!response.ok) {
//         return track.url || "";
//       }

//       const payload = (await response.json()) as AudioResolverResponse;
//       if (payload.url && payload.url.length > 0) {
//         return payload.url;
//       }
//     } catch {
//       // Fall through to fallback
//     }
//   }

//   // Final fallback to track's original URL
//   return track.url || "";
// };





import Constants from "expo-constants";
import { type Track } from "../constants/catalog";

type AudioResolverResponse = {
  url?: string;
  title?: string;
  artist?: string;
  provider?: string;
  videoId?: string;
};

/**
 * Get backend base URL
 * Priority:
 * 1. app.json extra.audioBackendUrl
 * 2. fallback (localhost for emulator only)
 */
const getBackendStreamUrl = () => {
  const configUrl = Constants.expoConfig?.extra?.audioBackendUrl;

  if (typeof configUrl === "string" && configUrl.length > 0) {
    return configUrl;
  }

  return "http://localhost:3000";
};

type GetAudioUrlOptions = {
  forceRefresh?: boolean;
};

const resolvedUrlCache = new Map<string, string>();
const pendingResolutionCache = new Map<string, Promise<string>>();
const STREAM_PROXY_TTL_MS = 1000 * 60 * 3;
const resolvedAtCache = new Map<string, number>();

const getResolutionCacheKey = (track: Track) => {
  if (track.videoId && track.videoId.length > 0) {
    return `video:${track.videoId}`;
  }

  return `query:${track.title || ""}:${track.artist || ""}`;
};

const buildStreamEndpoint = (track: Track, options: GetAudioUrlOptions = {}) => {
  const backendUrl = getBackendStreamUrl();
  const refreshParam = options.forceRefresh ? "&refresh=1" : "";

  if (track.videoId && track.videoId.length > 0) {
    return `${backendUrl}/stream?videoId=${encodeURIComponent(track.videoId)}${refreshParam}`;
  }

  const searchQuery = `${track.title || ""} ${track.artist || ""}`.trim();
  return `${backendUrl}/stream?q=${encodeURIComponent(searchQuery)}${refreshParam}`;
};

const buildAudioProxyEndpoint = (videoId: string, options: GetAudioUrlOptions = {}) => {
  const backendUrl = getBackendStreamUrl();
  const refreshParam = options.forceRefresh ? "?refresh=1" : "";
  return `${backendUrl}/audio/${encodeURIComponent(videoId)}${refreshParam}`;
};

export const getAudioUrl = async (
  track: Track,
  options: GetAudioUrlOptions = {},
): Promise<string> => {
  const cacheKey = getResolutionCacheKey(track);

  if (!options.forceRefresh) {
    const cached = resolvedUrlCache.get(cacheKey);
    const cachedAt = resolvedAtCache.get(cacheKey) || 0;
    const isExpired = Date.now() - cachedAt > STREAM_PROXY_TTL_MS;

    if (cached && !isExpired) {
      return cached;
    }

    if (cached && isExpired) {
      resolvedUrlCache.delete(cacheKey);
      resolvedAtCache.delete(cacheKey);
    }

    const pending = pendingResolutionCache.get(cacheKey);
    if (pending) {
      return pending;
    }
  }

  const request = (async () => {
    try {
      if (track.videoId && track.videoId.length > 0) {
        const proxyUrl = buildAudioProxyEndpoint(track.videoId, options);
        resolvedUrlCache.set(cacheKey, proxyUrl);
        resolvedAtCache.set(cacheKey, Date.now());
        return proxyUrl;
      }

      const endpoint = buildStreamEndpoint(track, options);
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const payload = (await response.json()) as AudioResolverResponse;
      const resolvedVideoId = payload.videoId || track.videoId;

      if (resolvedVideoId && resolvedVideoId.length > 0) {
        const proxyUrl = buildAudioProxyEndpoint(resolvedVideoId, options);
        resolvedUrlCache.set(cacheKey, proxyUrl);
        resolvedAtCache.set(cacheKey, Date.now());
        return proxyUrl;
      }

      if (payload.url && payload.url.length > 0) {
        resolvedUrlCache.set(cacheKey, payload.url);
        resolvedAtCache.set(cacheKey, Date.now());
        return payload.url;
      }

      if (track.url && track.url.length > 0) {
        resolvedUrlCache.set(cacheKey, track.url);
        resolvedAtCache.set(cacheKey, Date.now());
        return track.url;
      }

      throw new Error("No audio URL returned from backend");
    } catch (error) {
      if (track.url && track.url.length > 0) {
        resolvedUrlCache.set(cacheKey, track.url);
        resolvedAtCache.set(cacheKey, Date.now());
        return track.url;
      }

      throw error instanceof Error ? error : new Error("Unable to resolve audio URL");
    } finally {
      pendingResolutionCache.delete(cacheKey);
    }
  })();

  pendingResolutionCache.set(cacheKey, request);
  return request;
};

export const prefetchAudioUrl = (track: Track, options: GetAudioUrlOptions = {}) => {
  void getAudioUrl(track, options).catch(() => {});
};