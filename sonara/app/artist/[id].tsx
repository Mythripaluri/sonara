import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { artists } from "../../constants/catalog";
import { usePlayer } from "../../context/PlayerContext";
import { colors } from "../../theme/colors";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";

export default function ArtistDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { playSong, allSongs } = usePlayer();

  const artist = artists.find((item) => item.id === id);
  const artistName = typeof name === "string" ? name : artist?.name;
  const artistSongs = artistName
    ? allSongs.filter((song) => song.artist === artistName)
    : [];

  if (!artist && !artistName) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800" }}>Artist not found</Text>
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

      <Image source={{ uri: artist?.artwork || artistSongs[0]?.artwork }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={{ width: 180, height: 180, borderRadius: 90, marginTop: 18, alignSelf: "center", backgroundColor: "#111" }} />
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 18, textAlign: "center" }}>{artistName}</Text>
      <Text style={{ color: colors.textMuted, marginTop: 6, textAlign: "center" }}>{artist?.genre || "Artist"}</Text>

      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12 }}>Popular songs</Text>
      {artistSongs.map((song) => (
        <Pressable key={song.id} onPress={() => playSong(normalizeTrackForPlayer(song), artistSongs.map((item) => normalizeTrackForPlayer(item)))} style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{song.title}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>{song.album}</Text>
        </Pressable>
      ))}

      {artistSongs.length === 0 ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No songs found for this artist</Text>
        </View>
      ) : null}
    </View>
  );
}