import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import SongItem from "../../../components/SongItem";
import { usePlayer } from "../../../context/PlayerContext";
import { usePlaylist } from "../../../hooks/usePlaylist";
import { colors } from "../../../theme/colors";
import { normalizeTrackForPlayer } from "../../../utils/normalizeTrackForPlayer";
import { Stack } from "expo-router";

export default function LibraryScreen() {
  const router = useRouter();
  const { likedSongIds, allSongs, playSong, totalPlayTimeSeconds } = usePlayer();
  const { playlists } = usePlaylist();
  const [tab, setTab] = useState<"playlists" | "songs">("playlists");
  const likedSongs = allSongs.filter((song) => likedSongIds.includes(song.id));
  const totalHours = (totalPlayTimeSeconds / 3600).toFixed(totalPlayTimeSeconds >= 3600 ? 0 : 1);

  const stats = [
    { label: "Saved", value: String(likedSongs.length) },
    { label: "Playlists", value: String(playlists.length) },
    { label: "Hours", value: totalHours },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: true,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 16,
          paddingTop: 20,
        }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 34, fontWeight: "800" }}>
          Your Library
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          {(["playlists", "songs"] as const).map((item) => {
            const active = tab === item;
            return (
              <Pressable
                key={item}
                onPress={() => setTab(item)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? colors.active : colors.surfaceElevated,
                }}
              >
                <Text style={{ color: active ? "#1B3C53" : colors.textPrimary, fontWeight: "700", textTransform: "capitalize" }}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          {stats.map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                backgroundColor: colors.surfaceElevated,
                padding: 14,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.label}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 6 }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {tab === "playlists" ? (
          <View style={{ marginTop: 18, gap: 8 }}>
            {playlists.map((playlist) => (
              <Pressable
                key={playlist.id}
                onPress={() => router.push({ pathname: "/library/playlist/[id]", params: { id: playlist.id } } as any)}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>{playlist.name}</Text>
                  <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
                    {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : likedSongs.length === 0 ? (
          <View style={{ marginTop: 18, padding: 20, borderRadius: 16, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No liked songs yet</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>
              Tap the heart in the player to save songs.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 2 }}>
            {likedSongs.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                onPress={(track) => playSong(normalizeTrackForPlayer(track), allSongs.map((item) => normalizeTrackForPlayer(item)))}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}