import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../../theme/colors";
import { usePlaylist } from "../../../hooks/usePlaylist";
import { SongItem } from "../../../components/SongItem";
import type { Track } from "../../../constants/catalog";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    playlists,
    getPlaylist,
    removeSong,
    renamePlaylist,
  } = usePlaylist();

  const playlist = useMemo(() => {
    return id ? getPlaylist(id) : undefined;
  }, [id, playlists]);

  const [isRenamingPlaylist, setIsRenamingPlaylist] = useState(false);
  const [newName, setNewName] = useState(playlist?.name || "");

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
    Alert.alert(
      "Remove Song",
      `Remove "${song.title}" from this playlist?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => removeSong(playlist.id, song.id),
          style: "destructive",
        },
      ]
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
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            padding: 8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        {isRenamingPlaylist ? (
          <View style={{ flex: 1, flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                fontSize: 16,
                fontWeight: "bold",
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              }}
              autoFocus
            />
            <Pressable
              onPress={handleRenamePlaylist}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <MaterialIcons name="check" size={24} color={colors.active} />
            </Pressable>
            <Pressable
              onPress={() => {
                setIsRenamingPlaylist(false);
                setNewName(playlist.name);
              }}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setIsRenamingPlaylist(true);
              setNewName(playlist.name);
            }}
            style={{ flex: 1 }}
          >
            <Text
              style={{
                fontSize: 20,
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
        )}
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
        <FlatList
          data={playlist.songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => handleRemoveSong(item)}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <SongItem
                song={item}
                onPress={() => {
                  // Play song from playlist
                  console.log("Play song from playlist:", item.title);
                }}
              />
            </Pressable>
          )}
          contentContainerStyle={{
            paddingVertical: 8,
          }}
        />
      )}

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
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"} • Long
          press to remove
        </Text>
      </View>
    </View>
  );
}
