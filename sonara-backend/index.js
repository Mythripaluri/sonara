require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const ytdlp = require("yt-dlp-exec");

const app = express();
app.use(cors());

let spotifyToken = null;
let tokenExpiry = 0;
let spotifyBlockedUntil = 0;

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const SPOTIFY_BLOCK_TTL_MS = 1000 * 60 * 60 * 6;
const RESOLVE_TIMEOUT_MS = 7000;
const matchCache = new Map();
const queryVideoCache = new Map();
const streamResultCache = new Map();

const normalizeForMatch = (str) => {
  return (str || "")
    .toLowerCase()
    .normalize("NFKD")                 // better normalization
    .replace(/[\u0300-\u036f]/g, "")   // remove accents
    .replace(/[^a-z0-9\s\u4e00-\u9fff]/gi, " ") // keep letters, numbers, chinese
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeText = normalizeForMatch;

const isAllCaps = (str) => {
  if (!str) return false;

  const trimmed = str.trim();
  if (!trimmed) return false;

  return trimmed === trimmed.toUpperCase();
};

const hasSpecialChars = (str) => /[^\p{L}\p{N}\s]/u.test(str || "");

const toTitleCase = (str) =>
  (str || "")
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

const removeNoise = (str) =>
  (str || "").replace(/\b(remix|live|version|official)\b/gi, " ");

const cleanQuery = (title, artist) => {
  let t = title || "";
  const a = artist || "";

  if (isAllCaps(t)) {
    t = toTitleCase(t);
  }

  if (hasSpecialChars(t)) {
    t = t.replace(/[^\p{L}\p{N}\s]/gu, " ");
  }

  t = t.replace(/\s+/g, " ").trim();

  return `${t} ${a}`.trim();
};

const splitTitleArtist = (raw) => {
  const value = (raw || "").trim();
  if (!value) return null;

  const parts = value.split(/\s*[-–—]\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  return {
    title: parts[0],
    artist: parts.slice(1).join(" "),
  };
};

const extractTrackArtist = (rawQuery) => {
  const value = (rawQuery || "").replace(/\s+/g, " ").trim();
  if (!value) return null;

  const explicitSplit = splitTitleArtist(value);
  if (explicitSplit) {
    return explicitSplit;
  }

  const byMatch = value.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return {
      title: byMatch[1].trim(),
      artist: byMatch[2].trim(),
    };
  }

  const words = value.split(" ").filter(Boolean);

  if (words.length >= 2) {
    return {
      trackTitle: words.slice(0, -1).join(" "),
      artist: words.slice(-1).join(" "),
    };
  }

  return {
    trackTitle: value,
    artist: "",
  };
};

const isGarbageCandidate = (title) => {
  const normalized = normalizeForMatch(title);

  return (
    normalized.includes("news") ||
    normalized.includes("vacancy") ||
    normalized.includes("exam") ||
    normalized.includes("covid") ||
    normalized.includes("minister")
  );
};

const matchScore = (videoTitle, trackTitle, artist) => {
  const vTokens = normalizeForMatch(videoTitle).split(" ").filter(Boolean);
  const tTokens = normalizeForMatch(trackTitle).split(" ").filter(Boolean);
  const aTokens = normalizeForMatch(artist).split(" ").filter(Boolean);

  const vSet = new Set(vTokens);

  let score = 0;

  for (const token of tTokens) {
    if (vSet.has(token)) score += 3;
  }

  for (const token of aTokens) {
    if (vSet.has(token)) score += 2;
  }

  return score;
};

const makeCacheKey = (title, artist) =>
  `${normalizeText(title)}|${normalizeText(artist)}`;

const getCachedMatch = (key) => {
  if (!key) return null;

  const cached = matchCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    matchCache.delete(key);
    return null;
  }

  return cached;
};

const getCachedStreamResult = (videoId) => {
  if (!videoId) return null;

  const cached = streamResultCache.get(videoId);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    streamResultCache.delete(videoId);
    return null;
  }

  return cached;
};

const withTimeout = (promise, ms = RESOLVE_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("resolve timeout")), ms);
    }),
  ]);

const resolveAudioWithFallback = async (videoId, timeoutMs = RESOLVE_TIMEOUT_MS) => {
  try {
    return await withTimeout(resolveAudioFromVideoId(videoId), timeoutMs);
  } catch {
    console.log("[stream] resolve timed out, retrying without timeout:", videoId);
    return resolveAudioFromVideoId(videoId);
  }
};

const setCachedStreamResult = (videoId, result) => {
  if (!videoId || !result?.audioUrl) return;

  streamResultCache.set(videoId, {
    ...result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const readCachedResolvedAudio = (key) => {
  // Stream URLs expire quickly; keep intent/video matching cached, not resolved URLs.
  return null;
};

const setCachedMatch = (key, value) => {
  if (!key) return;

  matchCache.set(key, {
    ...value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const isSpotifyPremiumBlock = (error) => {
  if (!axios.isAxiosError(error)) return false;

  const body =
    typeof error.response?.data === "string"
      ? error.response.data.toLowerCase()
      : "";

  return body.includes("active premium subscription required");
};

const markSpotifyBlocked = () => {
  spotifyBlockedUntil = Date.now() + SPOTIFY_BLOCK_TTL_MS;
};

const spotifyAvailable = () => Date.now() >= spotifyBlockedUntil;

const getSpotifyToken = async () => {
  if (!spotifyAvailable()) {
    return null;
  }

  if (spotifyToken && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

//   try {
//     const res = await axios.post(
//       "https://accounts.spotify.com/api/token",
//       new URLSearchParams({
//         grant_type: "client_credentials",
//       }),
//       {
//         headers: {
//           Authorization:
//             "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       },
//     );

  try {
    const res = await axios.post(
  "https://accounts.spotify.com/api/token",
  new URLSearchParams({
    grant_type: "client_credentials",
  }),
  {
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
          ":" +
          process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }
);



    spotifyToken = res.data.access_token;
    tokenExpiry = Date.now() + res.data.expires_in * 1000;
    return spotifyToken;
  } catch (error) {
    if (isSpotifyPremiumBlock(error)) {
      markSpotifyBlocked();
    }
    return null;
  }
};

const searchSpotifyTrack = async (query) => {
  if (!spotifyAvailable()) return null;

  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const track = res.data?.tracks?.items?.[0];
    if (!track) return null;

    return {
      title: track.name,
      artist: track.artists?.[0]?.name || "",
      durationSeconds: Math.round((track.duration_ms || 0) / 1000),
    };
  } catch (error) {
    if (isSpotifyPremiumBlock(error)) {
      markSpotifyBlocked();
    }

    if (axios.isAxiosError(error)) {
      console.warn(
        "Spotify lookup unavailable, falling back to raw query:",
        error.response?.status || error.code,
      );
    }
    return null;
  }
};

const searchSpotifyArtists = async (query) => {
  if (!spotifyAvailable()) return [];

  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const items = res.data?.artists?.items || [];

    return items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0,
      source: "spotify",
    }));
  } catch (error) {
    if (isSpotifyPremiumBlock(error)) {
      markSpotifyBlocked();
    }
    return [];
  }
};

const searchSpotifyAlbums = async (query) => {
  if (!spotifyAvailable()) return [];

  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const items = res.data?.albums?.items || [];

    return items.map((album) => ({
      id: album.id,
      title: album.name,
      artist: album.artists?.[0]?.name || "",
      releaseDate: album.release_date || "",
      totalTracks: album.total_tracks || 0,
      source: "spotify",
    }));
  } catch (error) {
    if (isSpotifyPremiumBlock(error)) {
      markSpotifyBlocked();
    }
    return [];
  }
};

const searchItunesTracks = async (query) => {
  try {
    const res = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: query,
        entity: "song",
        limit: 10,
      },
    });

    const items = res.data?.results || [];

    return items.map((track) => ({
      id: String(track.trackId || ""),
      title: track.trackName || "",
      artist: track.artistName || "",
      album: track.collectionName || "",
      durationSeconds: track.trackTimeMillis
        ? Math.round(track.trackTimeMillis / 1000)
        : 0,
      source: "itunes",
    }));
  } catch {
    return [];
  }
};

const searchItunesArtists = async (query) => {
  try {
    const res = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: query,
        entity: "musicArtist",
        limit: 10,
      },
    });

    const items = res.data?.results || [];

    return items.map((artist) => ({
      id: String(artist.artistId || ""),
      name: artist.artistName || "",
      genre: artist.primaryGenreName || "",
      source: "itunes",
    }));
  } catch {
    return [];
  }
};

const searchItunesAlbums = async (query) => {
  try {
    const res = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: query,
        entity: "album",
        limit: 10,
      },
    });

    const items = res.data?.results || [];

    return items.map((album) => ({
      id: String(album.collectionId || ""),
      title: album.collectionName || "",
      artist: album.artistName || "",
      releaseDate: album.releaseDate || "",
      trackCount: album.trackCount || 0,
      source: "itunes",
    }));
  } catch {
    return [];
  }
};

const searchYouTubeAPI = async (query) => {
  if (!process.env.YT_API_KEY) {
    const fallback = await ytdlp(`ytsearch5:${query}`, {
      dumpSingleJson: true,
      ignoreErrors: true,
      noWarnings: true,
    });

    return (fallback.entries || [])
      .map((item) => ({
        videoId: item?.id,
        title: item?.title || "",
        channel: item?.uploader || item?.channel || "",
        thumbnail: item?.thumbnail || item?.thumbnails?.[0]?.url || "",
      }))
      .filter((item) => item.videoId);
  }

  const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
    params: {
      key: process.env.YT_API_KEY,
      q: query,
      part: "snippet",
      type: "video",
      maxResults: 10,
    },
  });

  return (res.data?.items || []).map((item) => ({
    videoId: item?.id?.videoId,
    title: item?.snippet?.title || "",
    channel: item?.snippet?.channelTitle || "",
    thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || "",
  })).filter((item) => item.videoId);
};

const buildSearchQueries = (query) => {
  const extracted = extractTrackArtist(query);
  const title = extracted?.trackTitle || query;
  const artist = extracted?.artist || "";

  return Array.from(new Set([
    `${title} ${artist}`.trim(),
    `${artist} ${title}`.trim(),
    title.trim(),
  ].filter(Boolean)));
};

const searchVideoCandidatesFast = async (query) => {
  const queries = buildSearchQueries(query).slice(0, 3);
  const allCandidates = [];

  for (const q of queries) {
    try {
      const results = await searchYouTubeAPI(q);
      allCandidates.push(...results);
    } catch {
      // Continue with other queries.
    }
  }

  const seen = new Set();
  return allCandidates.filter((candidate) => {
    if (!candidate?.videoId || seen.has(candidate.videoId)) return false;
    if (isGarbageCandidate(candidate.title || "")) return false;
    seen.add(candidate.videoId);
    return true;
  });
};

const getVideoDetails = async (ids) => {
  if (!process.env.YT_API_KEY || ids.length === 0) {
    return [];
  }

  const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
    params: {
      key: process.env.YT_API_KEY,
      id: ids.join(","),
      part: "contentDetails",
    },
  });

  return res.data?.items || [];
};

const parseDuration = (iso) => {
  if (!iso || typeof iso !== "string") return 0;

  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
};

app.get("/metadata/tracks", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  const spotifyTrack = await searchSpotifyTrack(query);
  const itunesTracks = await searchItunesTracks(query);

  const trackResults = [];

  if (spotifyTrack) {
    trackResults.push({
      id: `${normalizeText(spotifyTrack.title)}:${normalizeText(spotifyTrack.artist)}`,
      title: spotifyTrack.title,
      artist: spotifyTrack.artist,
      durationSeconds: spotifyTrack.durationSeconds,
      source: "spotify",
    });
  }

  trackResults.push(...itunesTracks);

  return res.json({
    items: trackResults,
    spotifyEnabled: spotifyAvailable(),
  });
});

app.get("/metadata/artists", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  const spotifyArtists = await searchSpotifyArtists(query);
  const itunesArtists = await searchItunesArtists(query);

  return res.json({
    items: [...spotifyArtists, ...itunesArtists],
    spotifyEnabled: spotifyAvailable(),
  });
});

app.get("/metadata/albums", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  const spotifyAlbums = await searchSpotifyAlbums(query);
  const itunesAlbums = await searchItunesAlbums(query);

  return res.json({
    items: [...spotifyAlbums, ...itunesAlbums],
    spotifyEnabled: spotifyAvailable(),
  });
});

app.get("/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  console.log("SEARCH:", query);

  if (!query || query.length < 3) {
    console.log("Query too short, returning empty");
    return res.json([]);
  }

  try {
    let candidates = [];

    // 1) Try fast API-backed search when available.
    if (process.env.YT_API_KEY) {
      try {
        candidates = await searchVideoCandidatesFast(query);
      } catch {
        console.log("Fast search failed");
      }
    }

    // 2) Always fallback to yt-dlp helper search if fast search produced no results.
    if (!candidates.length) {
      try {
        console.log("[search] Falling back to yt-dlp (helper)");
        candidates = await searchVideoCandidates(buildQueries(query, "", query));
      } catch {
        console.log("yt-dlp helper fallback failed");
      }
    }

    // 3) Final direct yt-dlp fallback (no extra filtering) to avoid false empty responses.
    if (!candidates.length) {
      try {
        console.log("[search] Falling back to direct yt-dlp");
        const yt = await ytdlp(`ytsearch5:${query}`, {
          dumpSingleJson: true,
          flatPlaylist: true,
          ignoreErrors: true,
          noWarnings: true,
        });

        candidates = (yt?.entries || [])
          .map((entry) => ({
            id: entry?.id,
            title: entry?.title || "",
            thumbnail: entry?.thumbnail || entry?.thumbnails?.[0]?.url || "",
          }))
          .filter((entry) => entry.id);
      } catch {
        console.log("direct yt-dlp fallback failed");
      }
    }

    const topCandidate = candidates[0];
    const topCandidateVideoId = topCandidate?.videoId || topCandidate?.id;
    if (topCandidateVideoId) {
      setTimeout(async () => {
        try {
          const cached = getCachedStreamResult(topCandidateVideoId);
          if (cached) return;

          const audio = await resolveAudioWithFallback(topCandidateVideoId);

          setCachedStreamResult(topCandidateVideoId, audio);
          console.log("[search] preloaded top result:", topCandidate.title || topCandidateVideoId);
        } catch {
          // Warmup is best-effort.
        }
      }, 0);
    }

    const payload = candidates.slice(0, 5).map((candidate) => ({
      title: candidate.title,
      videoId: candidate.videoId || candidate.id,
      thumbnail: candidate.thumbnail || candidate.thumbnails?.[0]?.url || "",
      preResolved: Boolean(getCachedStreamResult(candidate.videoId || candidate.id)),
    }));

    console.log("RESULT COUNT:", payload.length);
    return res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Failed to search videos", details: message });
  }
});

const buildQueries = (title, artist, originalQuery) => {
  const parsed = splitTitleArtist(originalQuery);
  const effectiveTitle = title || parsed?.title || originalQuery;
  const effectiveArtist = artist || parsed?.artist || "";

  return Array.from(new Set([
    `${effectiveTitle} ${effectiveArtist}`.trim(),
    `${effectiveArtist} ${effectiveTitle}`.trim(),
    `${effectiveTitle}`.trim(),
  ].filter(Boolean)));
};

const searchVideoCandidates = async (queries) => {
  console.log("QUERIES:", queries);

  let allCandidates = [];

  for (const q of queries) {
    try {
      const res = await ytdlp(`ytsearch5:${q}`, {
        dumpSingleJson: true,
        flatPlaylist: true,
        ignoreErrors: true,
        noWarnings: true,
      });

      allCandidates.push(...(res.entries || []));
    } catch (error) {
      console.log("SEARCH FAILED:", q);
    }
  }

  const seen = new Set();
  const candidates = allCandidates.filter((candidate) => {
    if (!candidate?.id || seen.has(candidate.id)) return false;
    if (isGarbageCandidate(candidate.title || "")) return false;
    seen.add(candidate.id);
    return true;
  });

  console.log(
    "TOP RESULTS:",
    candidates.slice(0, 5).map((candidate) => candidate.title),
  );

  console.log("TOP 10 RESULTS:");
  candidates.slice(0, 10).forEach((candidate, index) => {
    console.log(index + 1, candidate.title);
  });

  return candidates;
};

const getDurationScore = (videoDuration, expectedDuration) => {
  if (!expectedDuration || !videoDuration) return 0;

  const diff = Math.abs(videoDuration - expectedDuration);

  if (diff < 5) return 8;
  if (diff < 15) return 3;
  return -6;
};

const scoreCandidate = ({
  candidateTitle,
  uploader,
  trackTitle,
  artist,
  videoDuration,
  expectedDuration,
}) => {
  const normTitle = normalizeForMatch(candidateTitle);
  const normArtist = normalizeForMatch(artist);

  let score = 0;

  score += matchScore(candidateTitle, trackTitle, artist);
  score += getDurationScore(videoDuration, expectedDuration);

  if (normArtist && normTitle.includes(normArtist)) score += 5;

  return score;
};

async function resolveAudioFromVideoId(videoId) {
  const info = await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
    dumpSingleJson: true,
    noWarnings: true,
    ignoreErrors: true,
    noCheckCertificates: true,
    preferFreeFormats: true,
    format: "bestaudio[ext=m4a]/bestaudio/best",
  });

  const audioFormat =
    info.formats?.find((f) => f.acodec !== "none" && f.vcodec === "none") ||
    info.formats?.[0];

  const audioUrl = audioFormat?.url || info.url;
  if (!audioUrl) {
    throw new Error("No audio found for cached video");
  }

  return {
    audioUrl,
    title: info.title,
    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || "",
    duration: info.duration,
  };
}

app.get("/stream", async (req, res) => {
  const query = req.query.q;
  const videoId = req.query.videoId;
  const forceRefresh = String(req.query.refresh || "") === "1";

  if (query && String(query).trim().length < 3) {
    return res.json([]);
  }

  if (!query && !videoId) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    if (videoId) {
      const cached = !forceRefresh ? getCachedStreamResult(String(videoId)) : null;

      if (cached) {
        return res.json({
          url: cached.audioUrl,
          title: cached.title,
          image: cached.thumbnail || "",
          provider: "cache",
          duration: cached.duration,
          videoId: String(videoId),
        });
      }

      const resolved = await resolveAudioWithFallback(String(videoId));
      if (!forceRefresh) {
        setCachedStreamResult(String(videoId), resolved);
      }

      return res.json({
        url: resolved.audioUrl,
        title: resolved.title,
        image: resolved.thumbnail || "",
        provider: "yt-optimized",
        duration: resolved.duration,
        videoId: String(videoId),
      });
    }

    const normalizedQuery = normalizeForMatch(String(query));
    const cachedQueryVideoId = queryVideoCache.get(normalizedQuery);

    if (cachedQueryVideoId) {
      try {
        const fromQueryCache = await resolveAudioWithFallback(cachedQueryVideoId);
        console.log("Cache hit (query):", normalizedQuery, "->", cachedQueryVideoId);

        return res.json({
          url: fromQueryCache.audioUrl,
          title: fromQueryCache.title,
          image: fromQueryCache.thumbnail || "",
          provider: "cache",
          duration: fromQueryCache.duration,
          videoId: cachedQueryVideoId,
        });
      } catch {
        queryVideoCache.delete(normalizedQuery);
      }
    }

    const extracted = extractTrackArtist(String(query));

    let trackTitle = extracted?.trackTitle || String(query).trim();
    let artist = "";
    let expectedDuration = 0;

    if (extracted) {
      artist = extracted.artist;
    }

    const intentCacheKey = makeCacheKey(trackTitle, artist);
    if (artist && intentCacheKey) {
      const cachedResolved = readCachedResolvedAudio(intentCacheKey);
      if (cachedResolved) {
        console.log("Cache hit (resolved-intent):", intentCacheKey);
        return res.json({
          url: cachedResolved.audioUrl,
          title: cachedResolved.title,
          image: cachedResolved.thumbnail || "",
          provider: "cache",
          duration: cachedResolved.duration,
        });
      }

      const cachedIntentMatch = getCachedMatch(intentCacheKey);
      if (cachedIntentMatch?.videoId) {
        try {
          const fromCache = await resolveAudioWithFallback(cachedIntentMatch.videoId);
          setCachedMatch(intentCacheKey, {
            ...cachedIntentMatch,
            audioUrl: fromCache.audioUrl,
            title: fromCache.title,
            duration: fromCache.duration,
          });

          return res.json({
            url: fromCache.audioUrl,
            title: fromCache.title,
            image: fromCache.thumbnail || "",
            provider: "cache",
            duration: fromCache.duration,
            videoId: cachedIntentMatch.videoId,
          });
        } catch {
          matchCache.delete(intentCacheKey);
        }
      }
    }

    const shouldSkipMetadata = artist || String(query).trim().includes(" ");

    if (!shouldSkipMetadata) {
      const spotifyTrack = await searchSpotifyTrack(query);
      const itunesTrack = (await searchItunesTracks(query))[0] || null;

      trackTitle = spotifyTrack?.title || itunesTrack?.title || trackTitle;
      artist = spotifyTrack?.artist || itunesTrack?.artist || artist;
      // Prefer iTunes duration since Spotify is often blocked in this setup.
      expectedDuration =
        itunesTrack?.durationSeconds || spotifyTrack?.durationSeconds || 0;
    }

    console.log("Intent track/artist:", { trackTitle, artist });

    const cacheKey = makeCacheKey(trackTitle, artist);

    if (cacheKey) {
      const cachedResolved = readCachedResolvedAudio(cacheKey);
      if (cachedResolved) {
        console.log("Cache hit (resolved):", cacheKey);

        return res.json({
          url: cachedResolved.audioUrl,
          title: cachedResolved.title,
          provider: "cache",
          duration: cachedResolved.duration,
        });
      }

      const cached = getCachedMatch(cacheKey);
      if (cached) {
        try {
          const fromCache = await resolveAudioWithFallback(cached.videoId);
          setCachedMatch(cacheKey, {
            ...cached,
            audioUrl: fromCache.audioUrl,
            title: fromCache.title,
            duration: fromCache.duration,
          });
          console.log("Cache hit:", cacheKey, "->", cached.videoId);

          return res.json({
            url: fromCache.audioUrl,
            title: fromCache.title,
            provider: "spotify+yt+cache",
            duration: fromCache.duration,
            videoId: cached.videoId,
          });
        } catch {
          matchCache.delete(cacheKey);
        }
      }
    }

    try {
      const queries = buildQueries(trackTitle, artist, query);
      const candidates = await searchVideoCandidates(queries);

      const ranked = candidates
        .map((candidate) => ({
          ...candidate,
          score: scoreCandidate({
            candidateTitle: candidate.title || "",
            uploader: candidate.channel || candidate.uploader || "",
            trackTitle,
            artist,
            videoDuration: candidate.duration || 0,
            expectedDuration,
          }),
        }))
        .sort((a, b) => b.score - a.score);

      console.log("bestScore:", ranked[0]?.score ?? 0);
      ranked.slice(0, 5).forEach((rankedCandidate) => {
        console.log({
          title: rankedCandidate.title,
          score: rankedCandidate.score,
          duration: rankedCandidate.duration || 0,
        });
      });

      console.time("resolve");
      const attempts = ranked.slice(0, 1).map(async (rankedCandidate) => {
        try {
          const resolvedVideoId = rankedCandidate.id || rankedCandidate.videoId;
          const resolved = await resolveAudioWithFallback(resolvedVideoId);

          return { resolved, videoId: resolvedVideoId };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(attempts);
      console.timeEnd("resolve");
      const success = results.find(Boolean);

      if (!success) {
        throw new Error("No valid audio found");
      }

      if (cacheKey) {
        setCachedMatch(cacheKey, {
          videoId: success.videoId,
          audioUrl: success.resolved.audioUrl,
          title: success.resolved.title,
          duration: success.resolved.duration,
        });
      }

      queryVideoCache.set(normalizedQuery, success.videoId);
      setCachedStreamResult(success.videoId, success.resolved);

      return res.json({
        url: success.resolved.audioUrl,
        title: success.resolved.title,
        image: success.resolved.thumbnail || "",
        provider: "yt-optimized",
        duration: success.resolved.duration,
        videoId: success.videoId,
      });
    } catch {
      throw new Error("No valid audio found");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("STREAM ERROR:", message);

    return res.status(500).json({
      error: "Failed to fetch audio",
      details: message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
