import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { usePlaylist } from "../hooks/usePlaylist";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { useAppMessage } from "../context/AppMessageContext";
import type { Track } from "../constants/catalog";

interface AddToPlaylistModalProps {
  visible: boolean;
  song: Track | null;
  onClose: () => void;
  onSuccess?: (playlistName: string) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  visible,
  song,
  onClose,
  onSuccess,
}) => {
  const { playlists, addSong, createPlaylist } = usePlaylist();
  const { showMessage } = useAppMessage();
  const [createPlaylistVisible, setCreatePlaylistVisible] = React.useState(false);

  const handleAddToPlaylist = (playlistId: string) => {
    if (!song) return;

    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    // Check if song already in playlist
    if (playlist.songs.some((s) => s.id === song.id)) {
      showMessage(`Song is already in ${playlist.name}`);
      return;
    }

    addSong(playlistId, song);
    showMessage(`Added to ${playlist.name}`);
    onSuccess?.(playlist.name);
    onClose();
  };

  const handleCreateAndAdd = () => {
    if (!song) return;
    setCreatePlaylistVisible(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "85%",
            paddingTop: 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
            >
              Add to Playlist
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <MaterialIcons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Create New Playlist Button */}
          <Pressable
            onPress={handleCreateAndAdd}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginBottom: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.active,
              borderRadius: 8,
              opacity: pressed ? 0.8 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            })}
          >
            <MaterialIcons name="add" size={20} color={colors.background} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.background,
              }}
            >
              Create New Playlist
            </Text>
          </Pressable>

          {/* Existing Playlists */}
          {playlists.length === 0 ? (
            <View
              style={{
                paddingVertical: 32,
                paddingHorizontal: 32,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                No playlists yet. Create one to get started!
              </Text>
            </View>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAddToPlaylist(item.id)}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: pressed ? colors.surface : "transparent",
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {item.songs.length} {item.songs.length === 1 ? "song" : "songs"}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="add-circle-outline"
                      size={24}
                      color={colors.active}
                    />
                  </View>
                </Pressable>
              )}
              scrollIndicatorInsets={{ right: 1 }}
              nestedScrollEnabled
            />
          )}
        </View>
      </View>

      <CreatePlaylistModal
        visible={createPlaylistVisible}
        onClose={() => setCreatePlaylistVisible(false)}
        onCreatePlaylist={(name, description) => {
          if (!song) return;

          const newPlaylist = createPlaylist(name, description);
          addSong(newPlaylist.id, song);
          showMessage(`Created playlist and added to ${name}`);
          onSuccess?.(name);
          setCreatePlaylistVisible(false);
          onClose();
        }}
      />
    </Modal>
  );
};
