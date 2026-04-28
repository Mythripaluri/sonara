import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Track } from "../constants/catalog";

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  songs: Track[];
  createdAt: number;
  updatedAt: number;
};

export type PlaylistState = {
  playlists: Playlist[];
  isLoaded: boolean;

  // CRUD operations
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;
  updatePlaylistDescription: (playlistId: string, description: string) => void;

  // Song management
  addSongToPlaylist: (playlistId: string, song: Track) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderSongsInPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;

  // Getters
  getPlaylist: (playlistId: string) => Playlist | undefined;
  getPlaylistByName: (name: string) => Playlist | undefined;
};

const generateId = () => `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      isLoaded: false,

      createPlaylist: (name: string, description?: string) => {
        const newPlaylist: Playlist = {
          id: generateId(),
          name,
          description,
          songs: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));

        return newPlaylist;
      },

      deletePlaylist: (playlistId: string) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
      },

      renamePlaylist: (playlistId: string, newName: string) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  name: newName,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      updatePlaylistDescription: (playlistId: string, description: string) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  description,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      addSongToPlaylist: (playlistId: string, song: Track) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              // Avoid duplicates
              const songExists = p.songs.some((s) => s.id === song.id);
              if (songExists) return p;

              return {
                ...p,
                songs: [...p.songs, song],
                updatedAt: Date.now(),
              };
            }
            return p;
          }),
        }));
      },

      removeSongFromPlaylist: (playlistId: string, songId: string) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  songs: p.songs.filter((s) => s.id !== songId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      reorderSongsInPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              const newSongs = [...p.songs];
              const [removed] = newSongs.splice(fromIndex, 1);
              newSongs.splice(toIndex, 0, removed);

              return {
                ...p,
                songs: newSongs,
                updatedAt: Date.now(),
              };
            }
            return p;
          }),
        }));
      },

      getPlaylist: (playlistId: string) => {
        return get().playlists.find((p) => p.id === playlistId);
      },

      getPlaylistByName: (name: string) => {
        return get().playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
      },
    }),
    {
      name: "playlist-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Mark as loaded after rehydration
        if (state) {
          state.isLoaded = true;
        }
      },
    }
  )
);
