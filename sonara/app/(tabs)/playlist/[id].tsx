import React, { useMemo, useState } from "react";
import {
  ImageBackground,
  Modal,
  View,
  Text,
  Pressable,
  Alert,
  Share,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { colors } from "../../../theme/colors";
import { usePlaylist } from "../../../hooks/usePlaylist";
import SongItem from "../../../components/SongItem";
import type { Track } from "../../../constants/catalog";
import { normalizeTrack } from "../../../utils/cleanTitle";
import { normalizeTrackForPlayer } from "../../../utils/normalizeTrackForPlayer";
import { AddToPlaylistModal } from "../../../components/AddToPlaylistModal";
import { usePlayer } from "../../../context/PlayerContext";
import { useAppMessage } from "../../../context/AppMessageContext";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    playlists,
    getPlaylist,
    removeSong,
    deletePlaylist,
    renamePlaylist,
    replacePlaylistSongs,
  } = usePlaylist();
  const { playSong, enqueueSong, enqueueNext } = usePlayer();
  const { showMessage } = useAppMessage();

  const playlist = useMemo(() => {
    return id ? getPlaylist(id) : undefined;
  }, [id, playlists]);

  const totalDurationSeconds = useMemo(
    () => playlist?.songs.reduce((total, song) => total + (song.durationSeconds || 0), 0) || 0,
    [playlist],
  );

  const [isRenamingPlaylist, setIsRenamingPlaylist] = useState(false);
  const [newName, setNewName] = useState(playlist?.name || "");
  const [selectedSong, setSelectedSong] = useState<Track | null>(null);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const shufflePlay = () => {
    if (!playlist) return;
    const songs = playlist.songs.map((song) => normalizeTrackForPlayer(song));
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    if (songs.length === 0) return;
    playSong(normalizeTrackForPlayer(songs[0]), songs);
  };

  if (!playlist) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.textPrimary }}>Playlist not found</Text>
      </View>
    );
  }

  const handleRemoveSong = (song: Track) => {
    removeSong(playlist.id, song.id);
    showMessage(`Removed from ${playlist.name}`);
  };

  const openAddToPlaylist = (song: Track) => {
    setSelectedSong(song);
    setAddToPlaylistVisible(true);
  };

  const sharePlaylist = async () => {
    try {
      await Share.share({
        message: `${playlist.name} · ${playlist.songs.length} ${playlist.songs.length === 1 ? "song" : "songs"} · ${formatDuration(totalDurationSeconds)}`,
      });
    } catch {
      // Sharing is best effort.
    } finally {
      setMenuVisible(false);
    }
  };

  const downloadPlaylist = () => {
    showMessage(`Downloads for ${playlist.name} are coming soon`);
    setMenuVisible(false);
  };

  const requestDeletePlaylist = () => {
    setMenuVisible(false);
    Alert.alert(
      "Delete Playlist",
      `Delete "${playlist.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePlaylist(playlist.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleRenamePlaylist = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Playlist name cannot be empty");
      return;
    }
    if (trimmedName === playlist.name) {
      setIsRenamingPlaylist(false);
      return;
    }
    renamePlaylist(playlist.id, trimmedName);
    setIsRenamingPlaylist(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 18,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => {
              setIsRenamingPlaylist(true);
              setNewName(playlist.name);
            }}
            style={{ flex: 1 }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {playlist.name}
            </Text>
            {playlist.description && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
                numberOfLines={1}
              >
                {playlist.description}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialIcons name="more-vert" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16, alignItems: "center" }}>
          <ImageBackground
            source={{ uri: playlist.artwork }}
            imageStyle={{ borderRadius: 20 }}
            style={{ width: 92, height: 92, borderRadius: 20, overflow: "hidden" }}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.24)", justifyContent: "center", alignItems: "center" }}>
              <MaterialIcons name="playlist-play" size={32} color="#fff" />
            </View>
          </ImageBackground>

          <View style={{ flex: 1, gap: 8 }}>
            {isRenamingPlaylist ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    fontSize: 16,
                    fontWeight: "bold",
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                  }}
                  autoFocus
                />
                <Pressable onPress={handleRenamePlaylist} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
                  <MaterialIcons name="check" size={24} color={colors.active} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsRenamingPlaylist(false);
                    setNewName(playlist.name);
                  }}
                  style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
                >
                  <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>
                {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"} • {formatDuration(totalDurationSeconds)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
              <Pressable
                onPress={() => {
                  if (playlist.songs[0]) {
                    const normalizedSongs = playlist.songs.map((song) => normalizeTrackForPlayer(song));
                    playSong(normalizeTrackForPlayer(playlist.songs[0]), normalizedSongs);
                  }
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: colors.player,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <MaterialIcons name="play-arrow" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>Play</Text>
              </Pressable>

              <Pressable
                onPress={shufflePlay}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <MaterialIcons name="shuffle" size={18} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Shuffle</Text>
              </Pressable>

              <Pressable
                onPress={sharePlaylist}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <MaterialIcons name="share" size={18} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Share</Text>
              </Pressable>

              <Pressable
                onPress={downloadPlaylist}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <MaterialIcons name="download" size={18} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Download</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Song List */}
      {playlist.songs.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <MaterialIcons
            name="music-note"
            size={64}
            color={colors.textSecondary}
            style={{ marginBottom: 16 }}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            No Songs Yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            Add songs from Search to this playlist
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          data={playlist.songs.map((song) => normalizeTrackForPlayer(song))}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => replacePlaylistSongs(playlist.id, data.map((song) => normalizeTrackForPlayer(song)))}
          activationDistance={12}
          renderItem={({ item, drag, isActive }: RenderItemParams<Track>) => (
            <View style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: isActive ? 0.85 : 1,
                }}
              >
                <SongItem
                  song={item}
                  onPress={() => playSong(normalizeTrackForPlayer(item), playlist.songs.map((song) => normalizeTrackForPlayer(song)))}
                  menuActions={[
                    {
                      label: "Play now",
                      icon: "play-arrow",
                      onPress: () => playSong(normalizeTrackForPlayer(item), playlist.songs.map((song) => normalizeTrackForPlayer(song))),
                    },
                    {
                      label: "Queue song",
                      icon: "queue-music",
                      onPress: () => enqueueSong(normalizeTrackForPlayer(item)),
                    },
                    {
                      label: "Queue next",
                      icon: "queue",
                      onPress: () => enqueueNext(normalizeTrackForPlayer(item)),
                    },
                    {
                      label: "Add to playlist",
                      icon: "playlist-add",
                      onPress: () => openAddToPlaylist(item),
                    },
                    {
                      label: "Remove from playlist",
                      icon: "delete-outline",
                      onPress: () => handleRemoveSong(item),
                      destructive: true,
                    },
                  ]}
                  onLongPress={() => {}} // Removed long-press delete action
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingBottom: 12,
                  }}
                >
                  <Pressable
                    onLongPress={drag}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: colors.player,
                    }}
                  >
                    <MaterialIcons name="drag-handle" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          renderPlaceholder={() => (
            <View
              style={{
                height: 6,
                marginHorizontal: 12,
                borderRadius: 999,
                backgroundColor: colors.player,
              }}
            />
          )}
          contentContainerStyle={{
            paddingVertical: 8,
            paddingBottom: 220,
          }}
        />
      )}

      <AddToPlaylistModal
        visible={addToPlaylistVisible}
        song={selectedSong}
        onClose={() => {
          setAddToPlaylistVisible(false);
          setSelectedSong(null);
        }}
      />

      {/* Info Footer */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          onPress={() => setMenuVisible(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end", padding: 16 }}
        >
          <View style={{ backgroundColor: colors.background, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
                {playlist.name}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }} numberOfLines={1}>
                {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"} • {formatDuration(totalDurationSeconds)}
              </Text>
            </View>

            <Pressable onPress={() => { setMenuVisible(false); setIsRenamingPlaylist(true); setNewName(playlist.name); }} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Rename playlist</Text>
            </Pressable>
            <Pressable onPress={sharePlaylist} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Share playlist</Text>
            </Pressable>
            <Pressable onPress={downloadPlaylist} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Download playlist</Text>
            </Pressable>
            <Pressable onPress={requestDeletePlaylist} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ color: "#FCA5A5", fontSize: 16, fontWeight: "700" }}>Delete playlist</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"} • {formatDuration(totalDurationSeconds)} • Long press to remove
        </Text>
      </View>
    </View>
  );
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
