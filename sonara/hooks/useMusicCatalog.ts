import { useEffect, useState } from "react";
import { type Track } from "../constants/catalog";
import { usePlayer } from "../context/PlayerContext";
import { getFeaturedTracks, searchMusic } from "../services/musicService";

export function useMusicCatalog(query = "") {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerCatalogTracks } = usePlayer();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = query.trim() ? await searchMusic(query) : await getFeaturedTracks();

        if (!cancelled) {
          setTracks(result);
          registerCatalogTracks(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load tracks");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [query, registerCatalogTracks]);

  return { tracks, loading, error };
}