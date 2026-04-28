import { useLocalSearchParams } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { usePlayer } from "../../context/PlayerContext";
import { colors } from "../../theme/colors";

export default function PlayerScreen() {
  const { id } = useLocalSearchParams();
  const {
    currentSong,
    playSong,
    togglePlayPause,
    isPlaying,
    toggleLike,
    isLiked,
    allSongs,
    queue,
  } = usePlayer();

  const songId = typeof id === "string" ? id : "";
  const song = allSongs.find((item) => item.id === songId) || currentSong;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1 }}>
        TRACK DETAIL
      </Text>

      {song ? (
        <>
          <Image
            source={{ uri: song.artwork }}
            style={{ width: "100%", height: 280, borderRadius: 28, marginTop: 16, backgroundColor: colors.surface }}
          />

          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 18 }}>
            {song.title}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 6 }}>
            {song.artist} · {song.album}
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <Pressable
              onPress={() => playSong(song, queue.length > 0 ? queue : allSongs)}
              style={{ flex: 1, backgroundColor: colors.player, paddingVertical: 16, borderRadius: 18, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {isPlaying && currentSong?.id === song.id ? "Pause" : "Play"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleLike(song.id)}
              style={{ width: 56, backgroundColor: colors.surface, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: isLiked(song.id) ? colors.player : colors.textPrimary, fontSize: 20 }}>
                {isLiked(song.id) ? "❤" : "+"}
              </Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => togglePlayPause()}
              style={{ flex: 1, backgroundColor: colors.surface, paddingVertical: 16, borderRadius: 18, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
                {isPlaying && currentSong?.id === song.id ? "Pause" : "Resume"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => toggleLike(song.id)}
              style={{ flex: 1, backgroundColor: colors.surface, paddingVertical: 16, borderRadius: 18, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
                Add to playlist
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={{ marginTop: 24, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Track not found</Text>
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>Pick a song from Home or Search to start playback.</Text>
        </View>
      )}
    </ScrollView>
  );
}
