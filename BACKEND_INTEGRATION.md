# Backend Audio Streaming Integration

## ✅ Completed

### Backend /stream Endpoint
- **Location**: `sonara-backend/index.js`
- **Format**: GET `http://localhost:3000/stream?q=<search_query>`
- **Returns**: `{ url, title, provider }`

**Features:**
- Primary resolver: yt-dlp-exec with format `bestaudio[ext=m4a]/bestaudio`
- Fallback: Python subprocess (for restricted environments)
- Handles YouTube search results (ytsearch1: protocol)
- Smart URL extraction:
  ```
  1. Try: info.url (direct video)
  2. Try: first format with acodec (audio track)
  3. Try: first format in array (fallback)
  ```
- Handles search result container with entries array

### App Integration
- **File**: `services/audioService.ts`
- **Changes**: 
  - Attempts backend /stream first
  - Falls back to track's original URL if backend fails
  - Logs provider info (yt-dlp-exec, python-yt_dlp, or fallback)

- **Config**: `app.json` 
  - Added `extra.audioBackendUrl` for flexibility
  - Default: `http://localhost:3000`

### Testing
- Backend tested: ✅ Returns valid Google VideoPlay URLs
- URL extraction: ✅ Successfully finds audio from search results
- Response structure: ✅ `{ url, title, provider }`

## 🚀 Setup Instructions

### Start Backend Server
```bash
cd sonara-backend
node index.js
# Output: "Server running on http://localhost:3000"
```

### Run App with Backend
```bash
cd sonara
npx expo start
# Press 'i' for iOS, 'a' for Android
```

## ⚠️ Important Notes

### Localhost Access
- **Emulator/Simulator**: Works with `http://localhost:3000`
- **Physical Device**: Update `app.json`:
  ```json
  "extra": {
    "audioBackendUrl": "http://YOUR_MACHINE_IP:3000"
  }
  ```
  Example: `"http://192.168.1.100:3000"`

### URL Expiration
- YouTube audio URLs expire after ~6 hours
- Solution: App automatically re-resolves on next play if URL fails

### URL Format
- Returns `googlevideo.com` URLs (streaming, not downloadable)
- Safe for temporary playback
- Proper User-Agent headers included

## 🔍 Debugging

### Server Logs
The backend logs extraction steps:
```
=== yt-dlp response structure ===
Type: object
Keys: [...list of top-level keys...]
info.url: undefined (or url value)
info.formats: NOT ARRAY (or array(n))
info.entries: array(1) (search result)
Using first entry from search results
Entry has url: true
Entry has formats: true
final audioUrl: ✓ found
```

### App Logs
Check console for:
```
[AudioService] Resolved from yt-dlp-exec: Track Title
[AudioService] Backend resolver failed: Connection refused
```

## 📝 Next Steps

1. ✅ Backend resolves audio URLs from YouTube
2. ✅ App calls backend for unresolved tracks
3. Next: Test end-to-end playback
   - Select song in app
   - Tap play
   - Verify audio plays through player
   - Check repeat/shuffle/progress work

## 🐛 Troubleshooting

**Backend not reachable:**
- Ensure backend is running: `node sonara-backend/index.js`
- Verify port 3000 is not blocked
- Check `app.json` audioBackendUrl is correct

**URL extraction fails:**
- Check backend console for "final audioUrl: ✗ not found"
- Verify yt-dlp binary is installed: `yt-dlp --version`
- Try query with simpler artist name

**Audio doesn't play:**
- URL might be expired (>6 hours old)
- Check `PlayerContext.tsx` track loading state
- Verify URL is valid by opening in browser
