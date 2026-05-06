import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { usePlayer } from "../context/PlayerContext";
import { colors } from "../theme/colors";
import type { Track } from "../constants/catalog";
import { decodeHtmlEntities, normalizeTrack} from "../utils/cleanTitle";

export type SongMenuAction = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

type SongItemProps = {
  song: Track;
  onPress: (song: Track) => void;
  onLongPress?: (song: Track) => void;
  highlightQuery?: string;
  onAddToPlaylist?: ((song: Track) => void) | null;
  menuActions?: SongMenuAction[] | null;
};

export default function SongItem({
  song,
  onPress,
  onLongPress,
  highlightQuery = "",
  onAddToPlaylist = null,
  menuActions = null,
}: SongItemProps) {
  const { currentSong, isPlaying, pause, resume, isBuffering } = usePlayer();
  const [menuVisible, setMenuVisible] = useState(false);
  const lastTapAtRef = useRef(0);

  const isCurrent = currentSong?.id === song.id;
  const lowerQuery = highlightQuery.trim().toLowerCase();
  const normalized = normalizeTrack(
    decodeHtmlEntities(song.title)
  );

  const displayTitle = normalized.title;
  const displayArtist = normalized.artist || song.artist;

  const shouldIgnoreTap = () => {
    const now = Date.now();

    if (now - lastTapAtRef.current < 300) {
      return true;
    }

    lastTapAtRef.current = now;
    return false;
  };

  const renderHighlightedTitle = (title: string) => {
    if (!lowerQuery) return title;

    const index = title.toLowerCase().indexOf(lowerQuery);
    if (index === -1) return title;

    const before = title.slice(0, index);
    const match = title.slice(index, index + lowerQuery.length);
    const after = title.slice(index + lowerQuery.length);

    return (
      <Text>
        {before}
        <Text style={{ color: colors.player }}>{match}</Text>
        {after}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      onPress={() => {
        if (shouldIgnoreTap()) return;
        onPress(song);
      }}
      onLongPress={onLongPress ? () => onLongPress(song) : undefined}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isCurrent ? "rgba(30, 58, 138, 0.16)" : "transparent",
      }}
    >
      {/* menu button is rendered on the right side to keep artwork/title aligned left */}

      {/* Artwork */}
      <Image
        source={{ uri: song.artwork }}
        style={{
          width: 50,
          height: 50,
          borderRadius: 8,
          backgroundColor: "#333",
          marginRight: 12,
        }}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
          {renderHighlightedTitle(displayTitle)}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
          {displayArtist}
        </Text>
      </View>

      <TouchableOpacity
        onPress={async () => {
          if (shouldIgnoreTap()) return;

          if (!isCurrent) {
            onPress(song);
            return;
          }

          if (isPlaying) {
            await pause();
          } else {
            await resume();
          }
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isCurrent ? colors.player : colors.surface,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: isCurrent ? "transparent" : colors.border,
        }}
      >
        {isCurrent && isBuffering ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name={isCurrent && isPlaying ? "pause" : "play"} size={18} color="#fff" />
        )}
      </TouchableOpacity>

      {onAddToPlaylist && (
        <TouchableOpacity
          onPress={() => onAddToPlaylist(song)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            marginLeft: 8,
          }}
        >
          <MaterialIcons name="add" size={18} color={colors.active} />
        </TouchableOpacity>
      )}

      {menuActions && menuActions.length > 0 ? (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={{
            marginLeft: 8,
            width: 34,
            height: 34,
            borderRadius: 17,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialIcons name="more-vert" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : null}

      {menuActions && menuActions.length > 0 ? (
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable
            onPress={() => setMenuVisible(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
              padding: 16,
            }}
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
                  {displayTitle}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>

              {menuActions.map((action) => (
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
                  <MaterialIcons
                    name={action.icon}
                    size={20}
                    color={action.destructive ? "#F87171" : colors.active}
                  />
                  <Text
                    style={{
                      color: action.destructive ? "#FCA5A5" : colors.textPrimary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </TouchableOpacity>
  );
}
