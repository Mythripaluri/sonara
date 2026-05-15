import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, FlatList, Text, View } from "react-native";
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

      <FlatList<any>
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 16,
          paddingTop: 20,
        }}
        data={tab === "playlists" ? playlists : likedSongs}
        keyExtractor={(item) => (item as any).id}
        ListHeaderComponent={
          <>
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

            {tab === "playlists" ? <View style={{ marginTop: 18 }} /> : null}
          </>
        }
        renderItem={({ item }) =>
          tab === "playlists" ? (
            <Pressable
              onPress={() => router.push({ pathname: "/library/playlist/[id]", params: { id: (item as any).id } } as any)}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <View>
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>{(item as any).name}</Text>
                <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
                  {(item as any).songs.length} {(item as any).songs.length === 1 ? "song" : "songs"}
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
            </Pressable>
          ) : (
            <SongItem
              song={item as any}
              onPress={(track) => playSong(normalizeTrackForPlayer(track), allSongs.map((item) => normalizeTrackForPlayer(item)))}
            />
          )
        }
        ListEmptyComponent={
          tab === "songs" ? (
            <View style={{ marginTop: 18, padding: 20, borderRadius: 16, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No liked songs yet</Text>
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>
                Tap the heart in the player to save songs.
              </Text>
            </View>
          ) : null
        }
        scrollIndicatorInsets={{ right: 1 }}
      />
    </>
  );
}