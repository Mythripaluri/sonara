# 🎧 Sonara — Smart Music Search & Streaming Engine

Sonara is a modern music streaming backend + mobile app that intelligently resolves songs using metadata and YouTube audio extraction, without relying on paid APIs.

---

## 🚀 Features

* 🔍 Smart multi-query search (title + artist aware)
* 🎯 Intelligent ranking (token match + duration + signals)
* 🌍 Works with multilingual & regional songs
* ⚡ Fast playback using caching + preloading
* 🔁 Automatic fallback when APIs fail
* 📱 React Native (Expo) mobile app
* 🧠 Backend-driven audio resolution using yt-dlp

---

## 🧩 Tech Stack

### Frontend

* React Native (Expo)
* TypeScript
* Custom audio service

### Backend

* Node.js + Express
* yt-dlp (YouTube extraction)
* In-memory caching

---

## ⚙️ How It Works

1. User searches for a song
2. Backend generates optimized queries
3. yt-dlp fetches candidate videos
4. Ranking algorithm selects best match
5. Audio stream URL is resolved
6. Frontend plays audio instantly

---

## 📦 Installation

### 1. Clone repo

```bash
git clone https://github.com/YOUR_USERNAME/sonara.git
cd sonara
```

---

### 2. Backend setup

```bash
cd sonara-backend
npm install
node index.js
```

Runs on:

```
http://localhost:3000
```

---

### 3. Frontend setup

```bash
cd ../sonara
npm install
npx expo start -c
```

---

## 🌐 Network Setup (Important)

Make sure your phone and PC are on the same WiFi.

Update API base URL:

```ts
const BASE_URL = "http://YOUR_LOCAL_IP:3000";
```

---

## 🧠 Key Optimizations

* Debounced search (reduces API spam)
* Query normalization (handles symbols & casing)
* Preloading top results
* Cache-based instant playback
* Parallel candidate resolution

---

## ⚠️ Known Limitations

* yt-dlp resolve time: ~3–6 seconds
* YouTube URLs are temporary (may expire)
* Requires stable internet connection

---

## 🛣 Future Improvements

* Persistent caching (Redis)
* Streaming proxy instead of direct URLs
* Offline playback support
* Playlist & user system

---

## 📸 Screenshots

(Add your app screenshots here)

---

## 🤝 Contributing

Pull requests are welcome!

---

## 📜 License

MIT License
