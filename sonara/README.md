# Sonara

Sonara is an Expo music app focused on a stable playback core, searchable catalog data, and a clean player experience.

## Tech Stack

- Expo Router
- React Native
- expo-av for audio playback
- AsyncStorage for persistence
- Vitest for core logic tests

## Architecture

Track -> musicService -> PlayerContext -> expo-av -> UI

More specifically:

- `musicService` fetches and caches track catalog data.
- `PlayerContext` owns queue, playback state, shuffle, repeat, likes, recents, and persistence.
- `audioService` resolves a playable audio URL before playback starts.
- Screens read state from the player context and render UI from that single source of truth.

## Playback Flow

1. A track is selected from Home, Search, Album, Artist, Playlist, or Player screens.
2. `PlayerContext` resolves the track into the active queue.
3. `audioService.getAudioUrl(track)` returns a playable URL.
4. `expo-av` loads the URL and starts playback.
5. Playback status updates are handled in the player context.
6. When a track finishes, `didJustFinish` routes into repeat and shuffle logic.

### Track End Behavior

- Repeat `one` replays the same track.
- Shuffle `on` picks a different random track when possible.
- Repeat `all` loops back to the first track after the queue ends.
- Repeat `off` stops playback at the end of the queue.

## Audio Resolution

The app uses a two-step audio strategy:

- `audioService.getAudioUrl(track)` first tries to resolve a playable URL.
- If no resolver endpoint is configured, the app falls back to the track URL already stored in the catalog.
- If loading fails, the full player shows an error message and a retry button.

## Available Scripts

- `npm run start` - start the Expo app
- `npm run android` - open on Android
- `npm run ios` - open on iOS
- `npm run web` - open in web
- `npm run lint` - run Expo lint
- `npm run test` - run the playback helper tests

## Development Notes

- The app no longer uses legacy static data files in runtime flow.
- Shared catalog data lives in `constants/catalog.ts`.
- Playback logic helpers live in `utils/playback.ts` and are covered by tests.
- The player UI includes loading and error feedback for track resolution and playback.
