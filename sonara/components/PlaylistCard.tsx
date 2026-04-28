import React from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import { colors } from "../theme/colors";
import type { Playlist } from "../store/playlistStore";

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
          backgroundColor: pressed ? colors.surface : colors.background,
          borderRadius: 8,
          padding: 12,
          marginVertical: 6,
          marginHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Playlist Icon */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 4,
          backgroundColor: colors.surface,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <MaterialIcons name="playlist-play" size={28} color={colors.active} />
      </View>

      {/* Playlist Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          {playlist.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
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
