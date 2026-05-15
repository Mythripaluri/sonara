import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AddToPlaylistModal } from "../../components/AddToPlaylistModal";
import { usePlayer } from "../../context/PlayerContext";
import { colors } from "../../theme/colors";
import { Image } from "expo-image";
import { normalizeTrack } from "../../utils/cleanTitle";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";

export default function PlayerScreen() {
  const { id } = useLocalSearchParams();
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);
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
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1.1 }}>
        TRACK DETAIL
      </Text>

      {song ? (
        <>
          <Image
            source={{ uri: song.artwork }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            style={{ width: 240, height: 240, borderRadius: 20, marginTop: 12, backgroundColor: "#111" }}
          />

          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 14 }}>
            {normalizeTrack(song.title).title}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 6 }}>
            {normalizeTrack(song.title).artist || song.artist} · {song.album}
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <Pressable
              onPress={() => playSong(normalizeTrackForPlayer(song), (queue.length > 0 ? queue : allSongs).map((item) => normalizeTrackForPlayer(item)))}
              style={{ flex: 1, backgroundColor: colors.player, paddingVertical: 16, borderRadius: 18, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {isPlaying && currentSong?.id === song.id ? "Pause" : "Play"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAddToPlaylistVisible(true)}
              style={{ width: 56, backgroundColor: colors.surface, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 20 }}>
                +
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
                {isLiked(song.id) ? "Unlike song" : "Like song"}
              </Text>
            </Pressable>
          </View>

          <AddToPlaylistModal
            visible={addToPlaylistVisible}
            song={song}
            onClose={() => setAddToPlaylistVisible(false)}
          />
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
