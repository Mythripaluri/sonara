import { albums, tracks } from "../constants/catalog";

export function useAlbum(id: string | string[]) {
  const album = albums.find((item) => item.id === id);

  const albumSongs = album
    ? tracks.filter((song) => song.album === album.title)
    : [];

  return {
    album,
    albumSongs,
  };
}