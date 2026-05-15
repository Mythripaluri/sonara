import React from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import type { Playlist } from "../store/playlistStore";
import { Image } from "expo-image";

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onLongPress?: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onPress,
  onLongPress,
}) => {
  const songCount = playlist.songs.length;
  const timeAgo = formatTimeAgo(playlist.createdAt);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 14,
          padding: 12,
          marginVertical: 4,
          marginHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ width: 76, height: 76, borderRadius: 16, marginRight: 12, backgroundColor: "#111" }}>
        <Image
          source={{ uri: playlist.artwork }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          style={{ width: 76, height: 76, borderRadius: 16 }}
        />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.28)", justifyContent: "center", alignItems: "center", borderRadius: 16 }}>
          <MaterialIcons name="playlist-play" size={28} color="#fff" />
        </View>
      </View>

      {/* Playlist Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          {playlist.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            marginTop: 2,
          }}
        >
          {songCount} {songCount === 1 ? "song" : "songs"} • {timeAgo}
        </Text>
      </View>

      {/* Chevron */}
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={colors.textSecondary}
      />
    </Pressable>
  );
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;

  return "long ago";
}
