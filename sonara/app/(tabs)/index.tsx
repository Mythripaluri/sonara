import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Seo from "../../components/Seo";
import SongItem from "../../components/SongItem";
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
  const rows: ({ type: "section"; id: string; title: string } | { type: "song"; id: string; song: Track; queue: Track[] } | { type: "empty"; id: string })[] = [
    { type: "section", id: "trending-title", title: "Trending now" },
    ...trending.map((song) => ({ type: "song" as const, id: `trend-${song.id}`, song, queue: trending })),
    { type: "section", id: "recent-title", title: "Recently played" },
    ...(recent.length === 0
      ? [{ type: "empty" as const, id: "recent-empty" }]
      : recent.map((song) => ({ type: "song" as const, id: `recent-${song.id}`, song, queue: recent }))),
  ];

  const handlePlay = (song: Track, queue: Track[]) => {
    const normalizedQueue = queue.map((item) => normalizeTrackForPlayer(item));
    void playSong(normalizeTrackForPlayer(song), normalizedQueue);
    router.push(`/player/${song.id}`);
  };

  const renderHeader = () => (
    <>
      <Seo
        title="Home"
        description="Discover quick picks, made-for-you mixes, trending tracks, and your recent listens in Sonara."
      />

      <LinearGradient
        colors={["#13263D", "#07111F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginBottom: 16,
          padding: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {greeting}
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 3, lineHeight: 34 }}>
          sonara
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13, lineHeight: 18 }}>
          Jump back into playlists, recent tracks, and the music you were already moving through.
        </Text>
      </LinearGradient>

      <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginBottom: 10 }}>
        Quick picks
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {quick.map((playlist, index) => {
          const grad = cardGradients[index % cardGradients.length];
          return (
            <Pressable
              key={playlist.id}
              onPress={() => (router as any).push({ pathname: "/library/playlist/[id]", params: { id: playlist.id } })}
              style={{ width: "48.5%", marginBottom: 8 }}
            >
              <View
                style={{
                  borderRadius: 14,
                  backgroundColor: colors.glass,
                  overflow: "hidden",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingRight: 10,
                  minHeight: 58,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <LinearGradient
                  colors={[...grad]}
                  style={{ width: 52, height: 58 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12, marginLeft: 9, flex: 1 }} numberOfLines={1}>
                  {playlist.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 18, marginBottom: 10 }}>
        Made for you
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
        {playlists.map((playlist, index) => {
          const grad = cardGradients[index % cardGradients.length];
          return (
            <Pressable
              key={`made-${playlist.id}`}
              onPress={() => (router as any).push({ pathname: "/library/playlist/[id]", params: { id: playlist.id } })}
              style={{ width: 148, marginRight: 11 }}
            >
              <LinearGradient
                colors={[...grad]}
                style={{ height: 148, borderRadius: 16 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 13, marginTop: 8 }} numberOfLines={1}>
                {playlist.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {playlist.description || `${playlist.songs.length} songs`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <FlashList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 16, paddingTop: 18 }}
      showsVerticalScrollIndicator={false}
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => {
        if (item.type === "section") {
          return (
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 22, marginBottom: 8 }}>
              {item.title}
            </Text>
          );
        }

        if (item.type === "empty") {
          return (
            <View style={{ marginHorizontal: 4, padding: 14, borderRadius: 14, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textMuted }}>Start listening to see recent tracks.</Text>
            </View>
          );
        }

        return (
          <SongItem
            song={item.song}
            onPress={(track) => handlePlay(track, item.queue)}
          />
        );
      }}
    />
  );
}
