import { ScrollView, Text, View } from "react-native";
import SongItem from "../../components/SongItem";
import AlbumCard from "../../components/AlbumCard";
import { playlists } from "../../constants/catalog";
import { usePlayer } from "../../context/PlayerContext";
import { colors } from "../../theme/colors";

export default function LibraryScreen() {
  const { likedSongIds, recentlyPlayed, allSongs, playSong, totalPlayTimeSeconds, currentSong } = usePlayer();
  const likedSongs = allSongs.filter((song) => likedSongIds.includes(song.id));
  const totalHours = (totalPlayTimeSeconds / 3600).toFixed(totalPlayTimeSeconds >= 3600 ? 0 : 1);

  const stats = [
    { label: "Saved", value: String(likedSongs.length) },
    { label: "Playlists", value: String(playlists.length) },
    { label: "Hours", value: totalHours },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", paddingHorizontal: 20, paddingTop: 20 }}>
        Library
      </Text>

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 18 }}>
        {stats.map((item) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.player,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.label}</Text>
            <Text style={{ color: colors.player, fontSize: 24, fontWeight: "800", marginTop: 6 }}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
        LIKED SONGS ❤️
      </Text>

      {likedSongs.length === 0 ? (
        <View style={{ marginHorizontal: 20, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No liked songs yet</Text>
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>
            Tap the heart in Now Playing to save tracks here.
          </Text>
        </View>
      ) : (
        likedSongs.map((song) => (
          <SongItem
            key={song.id}
            song={song}
            onPress={(track) => playSong(track, allSongs)}
          />
        ))
      )}

      <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
        RECENTLY PLAYED ⏱
      </Text>

      {recentlyPlayed.length === 0 ? (
        <View style={{ marginHorizontal: 20, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No playback yet</Text>
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>
            Play a track to build your recent history.
          </Text>
        </View>
      ) : (
        recentlyPlayed.map((song) => (
          <SongItem
            key={`recent-${song.id}`}
            song={song}
            onPress={(track) => playSong(track, allSongs)}
          />
        ))
      )}

      <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
        PLAYLISTS 📁
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {playlists.map((playlist) => (
          <AlbumCard
            key={playlist.id}
            item={playlist}
            onOpen={() => {}}
            onPlay={() => {}}
          />
        ))}
      </ScrollView>

      {currentSong ? (
        <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 16, padding: 16, borderRadius: 18, backgroundColor: "rgba(30, 58, 138, 0.10)", borderWidth: 1, borderColor: colors.player }}>
          <Text style={{ color: colors.player, fontSize: 12, fontWeight: "700" }}>ACTIVE TRACK</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: "800", marginTop: 6 }}>{currentSong.title}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>{currentSong.artist}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
