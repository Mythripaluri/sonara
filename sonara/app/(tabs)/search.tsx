import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import ArtistItem from "../../components/ArtistItem";
import Seo from "../../components/Seo";
import SongItem from "../../components/SongItem";
import { AddToPlaylistModal } from "../../components/AddToPlaylistModal";
import { useDebounce } from "../../hooks/useDebounce";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { usePlayer } from "../../context/PlayerContext";
import { useMusicCatalog } from "../../hooks/useMusicCatalog";
import { buildTrackFromSearchResult, searchVideos, type SearchResult } from "../../services/videoSearchService";
import { colors } from "../../theme/colors";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";

import type { Track } from "../../constants/catalog";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const lastQueryRef = useRef("");
  const { playSong, enqueueSong, enqueueNext } = usePlayer();
  const { tracks: featuredTracks } = useMusicCatalog();
  const { recentSearches, recordSearch } = useRecentSearches();
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addToPlaylistModalVisible, setAddToPlaylistModalVisible] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const cleaned = debouncedQuery.trim();

      if (!cleaned || cleaned.length < 3) {
        lastQueryRef.current = cleaned;
        setResults([]);
        setSearchLoading(false);
        setSearchError(null);
        return;
      }

      if (cleaned === lastQueryRef.current) {
        return;
      }

      lastQueryRef.current = cleaned;

      setSearchLoading(true);
      setSearchError(null);

      try {
        const nextResults = await searchVideos(cleaned);
        if (!cancelled) {
          setResults(nextResults);
          recordSearch(cleaned);
        }
      } catch (error) {
        if (!cancelled) {
          setResults([]);
          setSearchError(error instanceof Error ? error.message : "Search failed");
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const filteredSongs = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    if (!lowerQuery) return featuredTracks;

    return featuredTracks.filter((song) =>
      [song.title, song.artist, song.album, song.genre]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(lowerQuery)),
    );
  }, [featuredTracks, query]);

  const artistSuggestions = Array.from(
    new Map(featuredTracks.map((track) => [track.artist, track])).values(),
  ).slice(0, 6);

  const resultTracks = useMemo(
    () => results.map(buildTrackFromSearchResult),
    [results],
  );

  const playResolvedResult = async (result: SearchResult) => {
    const track = buildTrackFromSearchResult(result);
    const normalizedTrack = normalizeTrackForPlayer(track);
    const normalizedQueue = (resultTracks.length > 0 ? resultTracks : [track]).map((item) => normalizeTrackForPlayer(item));
    await playSong(normalizedTrack, normalizedQueue);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Seo
        title="Search"
        description="Search Sonara's catalog by song, artist, album, or genre to discover playable tracks faster."
      />
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800", paddingHorizontal: 20 }}>
        Search
      </Text>

      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          paddingHorizontal: 16,
          height: 54,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: "center",
        }}
      >
        <TextInput
          placeholder="Search songs, artists, albums"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            color: colors.textPrimary,
            fontSize: 15,
            borderWidth: 1,
            borderColor: isFocused ? colors.player : colors.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: isFocused ? "rgba(30, 58, 138, 0.08)" : colors.surface,
          }}
        />
      </View>

      {query.trim().length === 0 ? (
        <>
          <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
            POPULAR ARTISTS
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {artistSuggestions.map((artist) => (
              <ArtistItem
                key={artist.artist}
                item={{ id: artist.id, name: artist.artist, genre: artist.genre, artwork: artist.artwork }}
                onPress={() => router.push(`/artist/${artist.id}?name=${encodeURIComponent(artist.artist)}`)}
              />
            ))}
          </ScrollView>

          {recentSearches.length > 0 ? (
            <>
              <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 28, marginBottom: 12 }}>
                RECENT SEARCHES
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                {recentSearches.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setQuery(item)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}
        </>
      ) : null}

      <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
        RESULTS
      </Text>

        {searchLoading ? (
          <View style={{ marginHorizontal: 20, marginTop: 10, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Loading music...</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Searching for the best video matches.</Text>
          </View>
        ) : query.trim().length >= 3 ? (
          results.length === 0 ? (
            <View style={{ marginHorizontal: 20, marginTop: 10, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No matches found</Text>
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>
                Try a different song, artist, or album name.
              </Text>
              {searchError ? (
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>
                  {searchError}
                </Text>
              ) : null}
            </View>
          ) : (
            resultTracks.map((track, index) => {
              const sourceResult = results[index];

              return (
                <SongItem
                  key={track.id}
                  song={track}
                  onPress={(song: Track) => playSong(normalizeTrackForPlayer(song), resultTracks.map((item) => normalizeTrackForPlayer(item)))}
                  menuActions={[
                    {
                      label: "Play now",
                      icon: "play-arrow",
                      onPress: () => void playResolvedResult(sourceResult),
                    },
                    {
                      label: "Queue song",
                      icon: "queue-music",
                      onPress: () => enqueueSong(normalizeTrackForPlayer(track)),
                    },
                    {
                      label: "Queue next",
                      icon: "queue",
                      onPress: () => enqueueNext(normalizeTrackForPlayer(track)),
                    },
                    {
                      label: "Add to playlist",
                      icon: "playlist-add",
                      onPress: () => {
                        setSelectedSongForPlaylist(track);
                        setAddToPlaylistModalVisible(true);
                      },
                    },
                  ]}
                />
              );
            })
          )
        ) : filteredSongs.length === 0 ? (
          <View style={{ marginHorizontal: 20, marginTop: 10, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No matches found</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>
              Try a different song, artist, or album name.
            </Text>
          </View>
        ) : (
          filteredSongs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              onPress={(track: Track) => playSong(normalizeTrackForPlayer(track), featuredTracks.map((item) => normalizeTrackForPlayer(item)))}
              onLongPress={(track: Track) => {
                setSelectedSongForPlaylist(track);
                setAddToPlaylistModalVisible(true);
              }}
              highlightQuery={query}
              onAddToPlaylist={(track: Track) => {
                setSelectedSongForPlaylist(track);
                setAddToPlaylistModalVisible(true);
              }}
            />
          ))
        )}

        <AddToPlaylistModal
          visible={addToPlaylistModalVisible}
          song={selectedSongForPlaylist}
          onClose={() => {
            setAddToPlaylistModalVisible(false);
            setSelectedSongForPlaylist(null);
          }}
        />
    </ScrollView>
  );
}
