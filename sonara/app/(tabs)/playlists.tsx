import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";
import { usePlaylist } from "../../hooks/usePlaylist";
import { PlaylistCard } from "../../components/PlaylistCard";
import { CreatePlaylistModal } from "../../components/CreatePlaylistModal";
import type { Playlist } from "../../store/playlistStore";

export default function PlaylistsScreen() {
  const router = useRouter();
  const {
    playlists,
    isLoaded,
    createPlaylist,
    deletePlaylist,
  } = usePlaylist();

  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleCreatePlaylist = (name: string, description?: string) => {
    createPlaylist(name, description);
    setCreateModalVisible(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"? This cannot be undone.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => deletePlaylist(playlist.id),
          style: "destructive",
        },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

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
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: colors.textPrimary,
            }}
          >
            Playlists
          </Text>
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <MaterialIcons name="add-circle-outline" size={28} color={colors.active} />
          </Pressable>
        </View>
      </View>

      {/* Playlists List */}
      {playlists.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <MaterialIcons
            name="playlist-play"
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
            No Playlists Yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Create your first playlist to start organizing your music
          </Text>
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={({ pressed }) => ({
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: colors.active,
              borderRadius: 8,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.background,
              }}
            >
              Create First Playlist
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              onPress={() => {
                router.push({
                  pathname: "/playlist/[id]",
                  params: { id: item.id },
                });
              }}
              onLongPress={() => handleDeletePlaylist(item)}
            />
          )}
          contentContainerStyle={{
            paddingVertical: 8,
            paddingBottom: 120,
          }}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreatePlaylist={handleCreatePlaylist}
      />
    </View>
  );
}
