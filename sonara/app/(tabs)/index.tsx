// import { FlatList, ScrollView, Text, View } from "react-native";
// import AlbumCard from "../../components/AlbumCard";
// import MiniPlayer from "../../components/MiniPlayer";
// import SongItem from "../../components/SongItem";
// import { usePlayer } from "../../context/PlayerContext";
// import { colors } from "../../theme/colors";
// import { LinearGradient } from "expo-linear-gradient";

// <LinearGradient
//   colors={["#0F172A", "#121212"]}
//   style={{ flex: 1 }}

// export default function HomeScreen() {
//   const { playSong, currentSong, position, duration } = usePlayer();

//   const safeRecent = recent || [];
//   const safeSongs = songs || [];

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.background }}>
//       <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
//         {/* HEADER */}
//         <View style={{ paddingHorizontal: 20, paddingTop: 48 }}>
//           <Text
//             style={{
//               color: colors.textPrimary,
//               fontSize: 26,
//               fontWeight: "700",
//             }}
//           >
//             Good Evening
//           </Text>
//         </View>

//         {/* RECENTLY PLAYED */}
//         <View style={{ marginTop: 28 }}>
//           <Text
//             style={{
//               color: colors.textMuted,
//               fontSize: 13,
//               letterSpacing: 1,
//               paddingHorizontal: 20,
//               marginBottom: 8,
//             }}
//           >
//             RECENTLY PLAYED
//           </Text>
//           {safeRecent.length === 0 ? (
//             <Text
//               style={{
//                 color: colors.textMuted,
//                 paddingHorizontal: 20,
//                 marginTop: 12,
//               }}
//             >
//               Start playing songs to see them here
//             </Text>
//           ) : (
//             <FlatList
//               horizontal
//               data={safeRecent}
//               keyExtractor={(item) => item.id}
//               renderItem={({ item }) => <AlbumCard item={item} />}
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={{
//                 paddingHorizontal: 20,
//                 gap: 12,
//               }}
//             />
//           )}
//         </View>

//         {/* TRENDING */}
//         <View style={{ marginTop: 32 }}>
//           <Text
//             style={{
//               color: colors.textPrimary,
//               fontSize: 20,
//               fontWeight: "700",
//               paddingHorizontal: 20,
//               marginBottom: 12,
//             }}
//           >
//             Trending Now
//           </Text>

//           <View style={{ gap: 4 }}>
//             {safeSongs.map((song) => (
//               <SongItem key={song.id} song={song} onPress={playSong} />
//             ))}
//           </View>
//         </View>
//       </ScrollView>

//       {/* MINI PLAYER */}
//       {currentSong && (
//         <View>
//           {/* progress */}
//           <View
//             style={{
//               height: 2,
//               backgroundColor: colors.border,
//             }}
//           >
//             <View
//               style={{
//                 width: `${duration ? (position / duration) * 100 : 0}%`,
//                 height: 2,
//                 backgroundColor: colors.player,
//               }}
//             />
//           </View>

//           <MiniPlayer />
//         </View>
//       )}
//     </View>
//   );
// }

// </LinearGradient>

import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import AlbumCard from "../../components/AlbumCard";
import ArtistItem from "../../components/ArtistItem";
import Header from "../../components/Header";
import Seo from "../../components/Seo";
import SongItem from "../../components/SongItem";
import { usePlayer } from "../../context/PlayerContext";
import { useMusicCatalog } from "../../hooks/useMusicCatalog";
import { colors } from "../../theme/colors";
import { normalizeTrack } from "../../utils/cleanTitle";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";
import type { Track } from "../../constants/catalog";

export default function HomeScreen() {
  const router = useRouter();
  const { playSong, recentlyPlayed, currentSong, isPlaying } = usePlayer();
  const { tracks, loading } = useMusicCatalog();

  const recentTracks = recentlyPlayed.slice(0, 6);
  const featuredAlbums = Array.from(
    new Map(
      tracks
        .filter((track) => track.album)
        .map((track) => [track.album, track]),
    ).values(),
  ).slice(0, 4);
  const featuredArtists = Array.from(
    new Map(tracks.map((track) => [track.artist, track])).values(),
  ).slice(0, 6);

  const handlePlay = (song: Track) => {
    playSong(normalizeTrackForPlayer(song), tracks.map((item) => normalizeTrackForPlayer(item)));
    router.push(`/player/${song.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Seo
        title="Home"
        description="Sonara home surfaces recent listening, trending tracks, featured playlists, and popular artists."
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Header title="Good evening" subtitle="Pick up where you left off" />

        {currentSong ? (
          <View style={{ marginHorizontal: 20, marginTop: 18, borderRadius: 24, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ padding: 18, backgroundColor: "rgba(30, 58, 138, 0.16)" }}>
              <Text style={{ color: colors.player, fontSize: 12, letterSpacing: 1.2, fontWeight: "700" }}>
                NOW PLAYING
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 8 }}>
                {normalizeTrack(currentSong.title).title}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 6 }}>
                {normalizeTrack(currentSong.title).artist || currentSong.artist} · {isPlaying ? "Playing" : "Paused"}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 18,
              padding: 18,
              borderRadius: 24,
              backgroundColor: "#171717",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.player, fontSize: 12, letterSpacing: 1.2, fontWeight: "700" }}>
              READY TO PLAY
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 8 }}>
              Start a track to fill this card.
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 8, lineHeight: 20 }}>
              Search, save, and jump into playback from anywhere in the app.
            </Text>
          </View>
        )}

        <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.2, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
          RECENTLY PLAYED
        </Text>

        {loading && recentTracks.length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={{ width: 170, height: 200, marginRight: 12, borderRadius: 20, backgroundColor: colors.surface, opacity: 0.7 }} />
            ))}
          </ScrollView>
        ) : recentTracks.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              marginHorizontal: 20,
              padding: 20,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.textMuted }}>
              🎵 Start listening to see songs here
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {recentTracks.map((item) => (
              <AlbumCard
                key={item.id}
                item={item}
                onOpen={() => router.push(`/player/${item.id}`)}
                onPlay={() => handlePlay(item)}
              />
            ))}
          </ScrollView>
        )}

        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700", paddingHorizontal: 20, marginTop: 30, marginBottom: 14 }}>
          Trending now
        </Text>

        {tracks.map((song) => (
          <SongItem key={song.id} song={song} onPress={handlePlay} />
        ))}

        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700", paddingHorizontal: 20, marginTop: 28, marginBottom: 14 }}>
          Featured playlists
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {featuredAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              item={{ ...album, title: album.album, artist: album.artist }}
              onOpen={() => router.push(`/player/${album.id}`)}
              onPlay={() => handlePlay(album)}
            />
          ))}
        </ScrollView>

        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700", paddingHorizontal: 20, marginTop: 28, marginBottom: 14 }}>
          Popular artists
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {featuredArtists.map((artist) => (
            <ArtistItem
              key={artist.artist}
              item={{ id: artist.id, name: artist.artist, genre: artist.genre, artwork: artist.artwork }}
              onPress={() =>
                router.push({
                  pathname: "/artist/[id]",
                  params: { id: artist.id, name: artist.artist },
                })
              }
            />
          ))}
        </ScrollView>
      </ScrollView>

    </View>
  );
}
