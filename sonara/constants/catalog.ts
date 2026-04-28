const artwork = (seed: number | string): string => `https://picsum.photos/seed/sonara-${seed}/800/800`;

export type TrackSource = "local" | "itunes" | "resolved";

export type Track = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string;
  source: TrackSource;
  resolvedAudioUrl?: string;
  album?: string;
  genre?: string;
  durationSeconds?: number;
  videoId?: string;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  year: string;
  artwork: string;
  description: string;
};

export type Artist = {
  id: string;
  name: string;
  genre: string;
  artwork: string;
};

export type Playlist = {
  id: string;
  title: string;
  subtitle: string;
  artwork: string;
};

export const tracks: Track[] = [
  {
    id: "song-1",
    title: "Neon Skyline",
    artist: "Ari Vale",
    album: "Midnight Drive",
    genre: "Synthwave",
    artwork: artwork(1),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    source: "local",
    durationSeconds: 205,
  },
  {
    id: "song-2",
    title: "City Lights",
    artist: "Mira North",
    album: "After Hours",
    genre: "Alt Pop",
    artwork: artwork(2),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    source: "local",
    durationSeconds: 192,
  },
  {
    id: "song-3",
    title: "Golden Hour",
    artist: "Luna Wave",
    album: "Soft Motion",
    genre: "Indie",
    artwork: artwork(3),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    source: "local",
    durationSeconds: 221,
  },
  {
    id: "song-4",
    title: "Runway",
    artist: "Atlas Bloom",
    album: "Velocity",
    genre: "Electro",
    artwork: artwork(4),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    source: "local",
    durationSeconds: 198,
  },
  {
    id: "song-5",
    title: "Low Tide",
    artist: "Nova Fields",
    album: "Afterglow",
    genre: "Downtempo",
    artwork: artwork(5),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    source: "local",
    durationSeconds: 184,
  },
  {
    id: "song-6",
    title: "Satellite Heart",
    artist: "Echo Bloom",
    album: "Orbit",
    genre: "Dream Pop",
    artwork: artwork(6),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    source: "local",
    durationSeconds: 210,
  },
  {
    id: "song-7",
    title: "Glass Horizon",
    artist: "Iris Lane",
    album: "Blue Static",
    genre: "Electronic",
    artwork: artwork(7),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    source: "local",
    durationSeconds: 364,
  },
  {
    id: "song-8",
    title: "Midnight Carousel",
    artist: "Vera Echo",
    album: "Night Bloom",
    genre: "Indie Pop",
    artwork: artwork(8),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    source: "local",
    durationSeconds: 351,
  },
  {
    id: "song-9",
    title: "Northbound",
    artist: "Astra June",
    album: "Transit",
    genre: "Alt",
    artwork: artwork(9),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    source: "local",
    durationSeconds: 329,
  },
  {
    id: "song-10",
    title: "Soft Voltage",
    artist: "Noa Finch",
    album: "Current",
    genre: "Synthpop",
    artwork: artwork(10),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    source: "local",
    durationSeconds: 402,
  },
];

export const recent = tracks.slice(0, 4);

export const albums: Album[] = [
  {
    id: "album-1",
    title: "Midnight Drive",
    artist: "Ari Vale",
    year: "2026",
    artwork: artwork(11),
    description: "Warm synths, heavy bass, and late-night energy.",
  },
  {
    id: "album-2",
    title: "After Hours",
    artist: "Mira North",
    year: "2025",
    artwork: artwork(12),
    description: "A sharp pop record built for replay value.",
  },
  {
    id: "album-3",
    title: "Soft Motion",
    artist: "Luna Wave",
    year: "2024",
    artwork: artwork(13),
    description: "Loose, melodic tracks with a hazy edge.",
  },
];

export const artists: Artist[] = [
  {
    id: "artist-1",
    name: "Ari Vale",
    genre: "Synthwave",
    artwork: artwork(21),
  },
  {
    id: "artist-2",
    name: "Mira North",
    genre: "Alt Pop",
    artwork: artwork(22),
  },
  {
    id: "artist-3",
    name: "Luna Wave",
    genre: "Indie",
    artwork: artwork(23),
  },
  {
    id: "artist-4",
    name: "Atlas Bloom",
    genre: "Electronic",
    artwork: artwork(24),
  },
];

export const playlists: Playlist[] = [
  {
    id: "playlist-1",
    title: "Focused Flow",
    subtitle: "12 tracks",
    artwork: artwork(31),
  },
  {
    id: "playlist-2",
    title: "Night Commute",
    subtitle: "18 tracks",
    artwork: artwork(32),
  },
  {
    id: "playlist-3",
    title: "Soft Reset",
    subtitle: "9 tracks",
    artwork: artwork(33),
  },
];

export const libraryStats = [
  { label: "Saved", value: "24" },
  { label: "Playlists", value: "8" },
  { label: "Hours", value: "42" },
];