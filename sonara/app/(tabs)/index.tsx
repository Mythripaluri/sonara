import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Seo from "../../components/Seo";
import SongItem from "../../components/SongItem";
import { SongItemSkeleton, AlbumCardSkeleton } from "../../components/SkeletonLoader";
import { usePlayer } from "../../context/PlayerContext";
import { usePlaylist } from "../../hooks/usePlaylist";
import { useMusicCatalog } from "../../hooks/useMusicCatalog";
import { colors, gradients } from "../../theme/colors";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";
import type { Track } from "../../constants/catalog";
import { LinearGradient } from "expo-linear-gradient";

const cardGradients = gradients;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { playSong, recentlyPlayed } = usePlayer();
  const { tracks } = useMusicCatalog();
  const { playlists } = usePlaylist();

  const greeting = getGreeting();
  const trending = tracks.slice(0, 8);
  const recent = recentlyPlayed.slice(0, 8);
  const quick = playlists.slice(0, 4);

  const handlePlay = (song: Track, queue: Track[]) => {
    const normalizedQueue = queue.map((item) => normalizeTrackForPlayer(item));
    void playSong(normalizeTrackForPlayer(song), normalizedQueue);
    router.push(`/player/${song.id}`);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 16, paddingTop: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <Seo
        title="Home"
        description="Discover quick picks, made-for-you mixes, trending tracks, and your recent listens in Sonara."
      />

      <LinearGradient
        colors={["#234C6A", "#1B3C53"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginBottom: 18,
          padding: 18,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.9 }}>
          {greeting}
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 34, fontWeight: "800", marginTop: 4, lineHeight: 38 }}>
          sonara
        </Text>
        <Text style={{ color: colors.textPrimary, opacity: 0.82, marginTop: 8, fontSize: 13, lineHeight: 18 }}>
          Jump back into playlists, recently played tracks, and the music you were already moving through.
        </Text>
      </LinearGradient>

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 10 }}>
        Quick picks
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {quick.map((playlist, index) => {
          const grad = cardGradients[index % cardGradients.length];
          return (
            <Pressable
              key={playlist.id}
              onPress={() => (router as any).push({ pathname: "/library/playlist/[id]", params: { id: playlist.id } })}
              style={{ width: "48.5%", marginBottom: 10 }}
            >
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: colors.surfaceElevated,
                  overflow: "hidden",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingRight: 12,
                  minHeight: 66,
                }}
              >
                <LinearGradient
                  colors={[...grad]}
                  style={{ width: 58, height: 66 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12, marginLeft: 10, flex: 1 }} numberOfLines={1}>
                  {playlist.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 22, marginBottom: 10 }}>
        Made for you
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
        {playlists.map((playlist, index) => {
          const grad = cardGradients[index % cardGradients.length];
          return (
            <Pressable
              key={`made-${playlist.id}`}
              onPress={() => (router as any).push({ pathname: "/library/playlist/[id]", params: { id: playlist.id } })}
              style={{ width: 170, marginRight: 12 }}
            >
              <LinearGradient
                colors={[...grad]}
                style={{ height: 170, borderRadius: 18 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14, marginTop: 10 }} numberOfLines={1}>
                {playlist.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {playlist.description || `${playlist.songs.length} songs`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 24, marginBottom: 8 }}>
        Trending now
      </Text>

      <View style={{ gap: 2 }}>
        {trending.map((song) => (
          <SongItem
            key={`trend-${song.id}`}
            song={song}
            onPress={(track) => handlePlay(track, trending)}
          />
        ))}
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 24, marginBottom: 8 }}>
        Recently played
      </Text>

      {recent.length === 0 ? (
        <View style={{ marginHorizontal: 8, padding: 16, borderRadius: 14, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textMuted }}>Start listening to see recent tracks.</Text>
        </View>
      ) : (
        <View style={{ gap: 2 }}>
          {recent.map((song) => (
            <SongItem
              key={`recent-${song.id}`}
              song={song}
              onPress={(track) => handlePlay(track, recent)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}