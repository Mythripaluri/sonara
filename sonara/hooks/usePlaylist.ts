import { useCallback } from "react";
import { usePlaylistStore, type Playlist } from "../store/playlistStore";
import type { Track } from "../constants/catalog";

export const usePlaylist = () => {
  const store = usePlaylistStore();

  const createPlaylist = useCallback(
    (name: string, description?: string): Playlist => {
      return store.createPlaylist(name, description);
    },
    [store]
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      store.deletePlaylist(playlistId);
    },
    [store]
  );

  const renamePlaylist = useCallback(
    (playlistId: string, newName: string) => {
      store.renamePlaylist(playlistId, newName);
    },
    [store]
  );

  const updateDescription = useCallback(
    (playlistId: string, description: string) => {
      store.updatePlaylistDescription(playlistId, description);
    },
    [store]
  );

  const addSong = useCallback(
    (playlistId: string, song: Track) => {
      store.addSongToPlaylist(playlistId, song);
    },
    [store]
  );

  const removeSong = useCallback(
    (playlistId: string, songId: string) => {
      store.removeSongFromPlaylist(playlistId, songId);
    },
    [store]
  );

  const reorderSongs = useCallback(
    (playlistId: string, fromIndex: number, toIndex: number) => {
      store.reorderSongsInPlaylist(playlistId, fromIndex, toIndex);
    },
    [store]
  );

  const getPlaylist = useCallback(
    (playlistId: string) => {
      return store.getPlaylist(playlistId);
    },
    [store]
  );

  return {
    playlists: store.playlists,
    isLoaded: store.isLoaded,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    updateDescription,
    addSong,
    removeSong,
    reorderSongs,
    getPlaylist,
  };
};
