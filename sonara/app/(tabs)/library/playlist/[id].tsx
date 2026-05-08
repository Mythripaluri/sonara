import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { AddToPlaylistModal } from "../../../../components/AddToPlaylistModal";
import SongItem from "../../../../components/SongItem";
import { useAppMessage } from "../../../../context/AppMessageContext";
import { usePlayer } from "../../../../context/PlayerContext";
import { usePlaylist } from "../../../../hooks/usePlaylist";
import type { Track } from "../../../../constants/catalog";
import { colors } from "../../../../theme/colors";
import { normalizeTrackForPlayer } from "../../../../utils/normalizeTrackForPlayer";
import { Platform } from "react-native";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlaylist, playlists, removeSong, deletePlaylist, renamePlaylist } = usePlaylist();
  const { playSong, enqueueLast, enqueueNext } = usePlayer();
  const { showMessage } = useAppMessage();

  const playlist = useMemo(() => (id ? getPlaylist(id) : undefined), [id, getPlaylist, playlists]);
  const totalDurationSeconds = useMemo(
    () => playlist?.songs.reduce((total, song) => total + (song.durationSeconds || 0), 0) || 0,
    [playlist],
  );

  const [newName, setNewName] = useState(playlist?.name || "");
  const [editingName, setEditingName] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Track | null>(null);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);
  const Colors = {
    light: {
      text: "#F5F7FA",
      background: "#0B1F2A",
      tint: "#4DA3FF",
      icon: "#9FB3C8",
      tabIconDefault: "#6E8093",
      tabIconSelected: "#4DA3FF",
      surface: "#102836",
      surfaceElevated: "#17384A",
      border: "#1F455A",
    },

    dark: {
      text: "#F5F7FA",
      background: "#0B1F2A",
      tint: "#4DA3FF",
      icon: "#9FB3C8",
      tabIconDefault: "#6E8093",
      tabIconSelected: "#4DA3FF",
      surface: "#102836",
      surfaceElevated: "#17384A",
      border: "#1F455A",
    },
  };

  const Fonts = Platform.select({
    ios: {
      sans: "system-ui",
      serif: "ui-serif",
      rounded: "ui-rounded",
      mono: "ui-monospace",
    },

    default: {
      sans: "normal",
      serif: "serif",
      rounded: "normal",
      mono: "monospace",
    },

    web: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      rounded:
        "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
      mono:
        "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  });

  useEffect(() => {
    if (playlist?.name) {
      setNewName(playlist.name);
    }
  }, [playlist?.name]);

  const playPlaylist = () => {
    if (!playlist || playlist.songs.length === 0) return;
    const queue = playlist.songs.map((song) => normalizeTrackForPlayer(song));
    playSong(queue[0], queue);
  };

  const shufflePlay = () => {
    if (!playlist || playlist.songs.length === 0) return;
    const queue = playlist.songs.map((song) => normalizeTrackForPlayer(song));
    const shuffled = [...queue];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    playSong(shuffled[0], shuffled);
  };

  const handleRename = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Playlist name cannot be empty");
      return;
    }

    if (trimmed !== playlist?.name && playlist) {
      renamePlaylist(playlist.id, trimmed);
      showMessage(`Renamed to ${trimmed}`);
    }

    setEditingName(false);
  };

  const handleRemoveSong = (song: Track) => {
    if (!playlist) return;
    removeSong(playlist.id, song.id);
    showMessage(`Removed from ${playlist.name}`);
  };

  const sharePlaylist = async () => {
    if (!playlist) return;
    try {
      await Share.share({
        message: `${playlist.name} - ${playlist.songs.length} ${playlist.songs.length === 1 ? "song" : "songs"}`,
      });
    } finally {
      setMenuVisible(false);
    }
  };

  const requestDeletePlaylist = () => {
    if (!playlist) return;
    setMenuVisible(false);
    Alert.alert("Delete Playlist", `Delete \"${playlist.name}\"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deletePlaylist(playlist.id);
          router.back();
        },
      },
    ]);
  };

  if (!playlist) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>Playlist not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => {
              router.back();
            }}
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.65 : 1 })}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={{ flex: 1 }}>
            {editingName ? (
              <TextInput
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={handleRename}
                autoFocus
                style={{
                  color: colors.textPrimary,
                  fontSize: 24,
                  fontWeight: "800",
                  paddingVertical: 4,
                }}
              />
            ) : (
              <Pressable onPress={() => setEditingName(true)}>
                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800" }} numberOfLines={1}>
                  {playlist.name}
                </Text>
              </Pressable>
            )}
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
              {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"} - {formatDuration(totalDurationSeconds)}
            </Text>
          </View>

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
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <MaterialIcons name="more-vert" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {playlist.description ? (
          <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 18 }} numberOfLines={2}>
            {playlist.description}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Pressable
            onPress={playPlaylist}
            style={{ backgroundColor: colors.active, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 }}
          >
            <Text style={{ color: "#1B3C53", fontWeight: "800" }}>Play</Text>
          </Pressable>
          <Pressable
            onPress={shufflePlay}
            style={{ backgroundColor: colors.surfaceElevated, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Shuffle</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1.1 }}>TRACKS</Text>
        </View>

        {playlist.songs.length === 0 ? (
          <View style={{ margin: 16, padding: 20, borderRadius: 18, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>No songs yet</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Add tracks from Search to build this playlist.</Text>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            {playlist.songs.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                onPress={(track) => playSong(normalizeTrackForPlayer(track), playlist.songs.map((item) => normalizeTrackForPlayer(item)))}
                onLongPress={() => handleRemoveSong(song)}
                onAddToPlaylist={(track) => {
                  setSelectedSong(track);
                  setAddToPlaylistVisible(true);
                }}
                menuActions={[
                  { label: "Play next", icon: "skip-next", onPress: () => enqueueNext(normalizeTrackForPlayer(song)) },
                  { label: "Add to queue", icon: "queue-music", onPress: () => enqueueLast(normalizeTrackForPlayer(song)) },
                  { label: "Remove", icon: "delete-outline", destructive: true, onPress: () => handleRemoveSong(song) },
                ]}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {menuVisible ? (
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable
            onPress={() => setMenuVisible(false)}
            style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end", padding: 16 }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }} numberOfLines={1}>
                  {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
                </Text>
              </View>

              {(() => {
                const actions: Array<{
                  label: string;
                  icon: keyof typeof MaterialIcons.glyphMap;
                  destructive?: boolean;
                  onPress: () => void;
                }> = [
                  { label: "Play playlist", icon: "play-arrow", onPress: playPlaylist },
                  { label: "Share", icon: "share", onPress: sharePlaylist },
                  { label: "Rename playlist", icon: "edit", onPress: () => { setMenuVisible(false); setEditingName(true); } },
                  { label: "Delete playlist", icon: "delete-outline", destructive: true, onPress: requestDeletePlaylist },
                ];

                return actions.map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={() => {
                      setMenuVisible(false);
                      action.onPress();
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: pressed ? colors.surface : colors.background,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    })}
                  >
                    <MaterialIcons name={action.icon} size={20} color={action.destructive ? "#F87171" : colors.active} />
                    <Text style={{ color: action.destructive ? "#FCA5A5" : colors.textPrimary, fontSize: 14, fontWeight: "600" }}>{action.label}</Text>
                  </Pressable>
                ));
              })()}
            </View>
          </Pressable>
        </Modal>
      ) : null}

      <AddToPlaylistModal
        visible={addToPlaylistVisible}
        song={selectedSong}
        onClose={() => {
          setAddToPlaylistVisible(false);
          setSelectedSong(null);
        }}
      />
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}