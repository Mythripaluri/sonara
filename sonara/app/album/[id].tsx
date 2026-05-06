import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { albums, tracks } from "../../constants/catalog";
import { usePlayer } from "../../context/PlayerContext";
import { colors } from "../../theme/colors";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { playSong } = usePlayer();

  const album = albums.find((item) => item.id === id);
  const albumSongs = album ? tracks.filter((song) => song.album === album.title) : [];

  if (!album) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800" }}>Album not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: colors.player, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <MaterialIcons name="keyboard-arrow-left" size={32} color="#fff" />
      </Pressable>

      <Image source={{ uri: album.artwork }} style={{ width: "100%", height: 280, borderRadius: 28, marginTop: 14 }} />
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 18 }}>{album.title}</Text>
      <Text style={{ color: colors.textMuted, marginTop: 6 }}>{album.artist} · {album.year}</Text>
      <Text style={{ color: colors.textMuted, marginTop: 10, lineHeight: 20 }}>{album.description}</Text>

      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12 }}>Tracks</Text>
      {albumSongs.map((song) => (
        <Pressable key={song.id} onPress={() => playSong(normalizeTrackForPlayer(song), tracks.map((item) => normalizeTrackForPlayer(item)))} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{song.title}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>{song.genre}</Text>
        </Pressable>
      ))}
    </View>
  );
}