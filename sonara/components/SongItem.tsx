import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { usePlayer } from "../context/PlayerContext";
import { colors } from "../theme/colors";

export default function SongItem({ song, onPress, highlightQuery = "", onAddToPlaylist = null }) {
  const { currentSong, isPlaying, pause, resume } = usePlayer();

  const isCurrent = currentSong?.id === song.id;
  const lowerQuery = highlightQuery.trim().toLowerCase();

  const formatDuration = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return null;

    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const renderHighlightedTitle = (title) => {
    if (!lowerQuery) return title;

    const index = title.toLowerCase().indexOf(lowerQuery);
    if (index === -1) return title;

    const before = title.slice(0, index);
    const match = title.slice(index, index + lowerQuery.length);
    const after = title.slice(index + lowerQuery.length);

    return (
      <Text>
        {before}
        <Text style={{ color: colors.player }}>{match}</Text>
        {after}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(song)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: isCurrent ? "rgba(30, 58, 138, 0.16)" : "transparent",
      }}
    >
      {/* Artwork */}
      <Image
        source={{ uri: song.artwork }}
        style={{
          width: 50,
          height: 50,
          borderRadius: 8,
          backgroundColor: "#333",
          marginRight: 12,
        }}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
          {renderHighlightedTitle(song.title)}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {song.artist}
          {song.genre ? ` · ${song.genre}` : ""}
          {song.durationSeconds ? ` · ${formatDuration(song.durationSeconds)}` : ""}
        </Text>
      </View>

      <TouchableOpacity
        onPress={async () => {
          if (!isCurrent) {
            onPress(song);
            return;
          }

          if (isPlaying) {
            await pause();
          } else {
            await resume();
          }
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isCurrent ? colors.player : colors.surface,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: isCurrent ? "transparent" : colors.border,
        }}
      >
        <Ionicons name={isCurrent && isPlaying ? "pause" : "play"} size={18} color="#fff" />
      </TouchableOpacity>

      {onAddToPlaylist && (
        <TouchableOpacity
          onPress={() => onAddToPlaylist(song)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            marginLeft: 8,
          }}
        >
          <MaterialIcons name="add" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
