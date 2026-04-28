# 🏗 Sonara Architecture

This document explains the full system architecture of Sonara from user interaction to audio playback.

---

# 🔄 High-Level Flow

```
User Input → Frontend → Backend (/search)
                        ↓
                 Candidate Retrieval
                        ↓
                 Ranking Engine
                        ↓
                 /stream (on click)
                        ↓
                yt-dlp Audio Resolve
                        ↓
                 Audio Playback
```

---

# 🧩 System Components

---

## 1. Frontend (React Native - Expo)

### Responsibilities:

* Capture user input
* Debounce search queries
* Display search results
* Trigger playback

### Flow:

```
User types → debounce → /search API
User clicks → /stream API → play audio
```

---

## 2. Backend (Node.js + Express)

### Core Endpoints:

### 🔍 `/search`

* Accepts query
* Generates multiple search variations
* Fetches YouTube candidates via yt-dlp
* Returns list of video results

---

### 🎵 `/stream`

* Accepts videoId or query
* Resolves best audio stream
* Returns playable audio URL

---

# 🔍 Search Pipeline

---

## Step 1: Query Normalization

Input:

```
LOVE, MONEY, FAME
```

Becomes:

```
love money fame
```

Handled by:

* Lowercasing
* Removing symbols
* Unicode normalization

---

## Step 2: Query Expansion

```
[
  "title artist",
  "artist title",
  "title"
]
```

---

## Step 3: Candidate Retrieval

Using yt-dlp:

```
ytsearch5:<query>
```

Returns:

* videoId
* title
* duration
* uploader

---

## Step 4: Deduplication

Removes duplicate videos using:

```
Map(videoId → video)
```

---

## Step 5: Ranking Algorithm

Score based on:

### 🎯 Positive Signals

* Title token match
* Artist match
* Duration similarity
* "official" keyword

### ⚠️ Negative Signals

* live
* remix
* cover
* slowed/reverb

---

## Step 6: Top Candidate Selection

```
Top 1–3 videos selected
```

---

# 🎧 Audio Resolution Pipeline

---

## Step 1: Resolve via yt-dlp

```
https://youtube.com/watch?v=<id>
```

Extract:

* audio formats
* best audio URL

---

## Step 2: Format Selection

```
bestaudio[ext=m4a]
```

Fallback:

```
bestaudio
```

---

## Step 3: Return Stream URL

Response:

```
{
  url: "...",
  title: "...",
  provider: "yt"
}
```

---

# ⚡ Performance Optimizations

---

## 1. Debouncing

Prevents excessive API calls during typing.

---

## 2. Caching

Stores:

```
videoId → resolved audio URL
```

Reduces repeated yt-dlp calls.

---

## 3. Preloading

Top results are resolved in advance.

---

## 4. Parallel Resolution

Multiple candidates resolved simultaneously:

```
Promise.all()
```

---

# 🌍 Multilingual Support

Handles:

* Chinese / Korean / Japanese characters
* English transliteration
* Mixed-language queries

---

# ⚠️ Limitations

---

## 1. yt-dlp Latency

```
3–6 seconds per resolve
```

---

## 2. Expiring URLs

YouTube URLs are temporary and must be refreshed.

---

## 3. No Official Music API

System relies on heuristic matching.

---

# 🔮 Future Architecture Enhancements

---

## 1. Streaming Proxy Layer

Backend streams audio instead of exposing URL.

---

## 2. Persistent Cache

Redis / DB storage for faster retrieval.

---

## 3. ML-based Ranking

Replace heuristic scoring with learned model.

---

## 4. CDN Integration

Cache audio closer to users.

---

# 🏁 Summary

Sonara is a **metadata-driven music resolver** that converts user intent into playable audio through:

* intelligent search
* heuristic ranking
* dynamic audio extraction

---

## Key Insight

> The system does not store music — it *resolves it in real time*

---
