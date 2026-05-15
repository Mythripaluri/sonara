import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import AlbumArtwork from "../../components/album/AlbumArtwork";
import AlbumBackground from "../../components/album/AlbumBackground";
import AlbumHeader from "../../components/album/AlbumHeader";
import AlbumInfo from "../../components/album/AlbumInfo";
import AlbumTrackItem from "../../components/album/AlbumTrackItem";

import { useAlbum } from "../../hooks/useAlbum";
import { usePlayer } from "../../context/PlayerContext";
import { normalizeTrackForPlayer } from "../../utils/normalizeTrackForPlayer";
import { colors } from "../../theme/colors";

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams();

  const { playSong } = usePlayer();

  const { album, albumSongs } = useAlbum(id);

  if (!album) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: "#fff" }}>Album not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AlbumBackground artwork={album.artwork} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <AlbumHeader />

        <AlbumArtwork artwork={album.artwork} />

        <AlbumInfo
          title={album.title}
          artist={album.artist}
          year={album.year}
          description={album.description}
        />

        <View
          style={{
            paddingHorizontal: 20,
            marginTop: 30,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 14,
            }}
          >
            Tracks
          </Text>

          {albumSongs.map((song, index) => (
            <AlbumTrackItem
              key={song.id}
              index={index + 1}
              title={song.title}
              genre={song.genre}
              onPress={() =>
                playSong(
                  normalizeTrackForPlayer(song),
                  albumSongs.map((item) =>
                    normalizeTrackForPlayer(item)
                  )
                )
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}