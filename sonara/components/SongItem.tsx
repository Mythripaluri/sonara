import { MaterialIcons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Modal, Pressable, Text, View, Share } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { usePlayer } from "../context/PlayerContext";
import { colors } from "../theme/colors";
import type { Track } from "../constants/catalog";
import { decodeHtmlEntities, normalizeTrack} from "../utils/cleanTitle";
import { Image } from "expo-image";

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
  imageSize?: number;
  imageBorderRadius?: number;
};

function SongItem({
  song,
  onPress,
  onLongPress,
  highlightQuery = "",
  onAddToPlaylist = null,
  menuActions = null,
  imageSize = 48,
  imageBorderRadius = 9,
}: SongItemProps) {
  const { currentSong } = usePlayer();
  const [menuVisible, setMenuVisible] = useState(false);
  const scale = useSharedValue(1);

  const isCurrent = currentSong?.id === song.id;
  const lowerQuery = highlightQuery.trim().toLowerCase();
  const normalized = normalizeTrack(
    decodeHtmlEntities(song.title)
  );

  const displayTitle = normalized.title;
  const displayArtist = normalized.artist || song.artist;

  

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

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedRowStyle}>
    <Pressable
      onPress={() => onPress(song)}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 16, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}
      onLongPress={onLongPress ? () => onLongPress(song) : undefined}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 4,
        marginVertical: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: isCurrent ? "rgba(125, 211, 252, 0.13)" : "transparent",
        borderWidth: isCurrent ? 1 : 0,
        borderColor: "rgba(125, 211, 252, 0.22)",
      }}
    >
      {/* menu button is rendered on the right side to keep artwork/title aligned left */}

      {/* Artwork */}
      <Image
        source={{ uri: song.artwork }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: imageBorderRadius,
          backgroundColor: colors.surface,
          marginRight: 9,
        }}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 13 }} numberOfLines={1}>
          {renderHighlightedTitle(displayTitle)}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {displayArtist}
        </Text>
      </View>

      {/* play/pause button removed: entire row plays the song on press */}

      {onAddToPlaylist && (
        <Pressable
          onPress={() => onAddToPlaylist(song)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.glass,
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 8,
          }}
        >
          <MaterialIcons name="add" size={18} color={colors.active} />
        </Pressable>
      )}

      {menuActions && menuActions.length > 0 ? (
        <Pressable
          onPress={() => setMenuVisible(true)}
          style={{
            marginLeft: 8,
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.glass,
          }}
        >
          <MaterialIcons name="more-vert" size={18} color={colors.textPrimary} />
        </Pressable>
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

              {(() => {
                const fullActions: SongMenuAction[] = [
                  {
                    label: "Play song",
                    icon: "play-arrow",
                    onPress: () => onPress(song),
                  },
                  {
                    label: "Share",
                    icon: "share",
                    onPress: () => {
                      Share.share({ message: `${song.title} - ${song.artist}` });
                    },
                  },
                  ...(menuActions || []),
                ];

                return fullActions.map((action) => (
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
                ));
              })()}
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}

export default memo(SongItem);
