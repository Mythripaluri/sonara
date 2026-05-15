import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { usePlayer } from "../context/PlayerContext";
import { usePlayerStore } from "../store/playerStore";
import { colors } from "../theme/colors";
import { normalizeTrack } from "../utils/cleanTitle";
// import SwipeableItem from "react-native-swipeable-item";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { normalizeTrackForPlayer } from "../utils/normalizeTrackForPlayer";
import type { Track } from "../constants/catalog";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default function FullPlayer() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);

  const {
    isPlaying,
    trackLoading,
    trackError,
    playSong,
    togglePlayPause,
    position,
    duration,
    seekTo,
    playNext,
    playPrevious,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    toggleRepeatMode,
    toggleLike,
    isLiked,
    retryCurrentTrack,
    removeFromQueue,
  } = usePlayer();

  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const replaceQueue = usePlayerStore((state) => state.replaceQueue);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };
  const closePlayer = () => {
    router.back();
  };

  const openMenu = () => {
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const queueStartIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  const upNextQueue = useMemo(
    () => (currentIndex >= 0 ? queue.slice(queueStartIndex) : queue),
    [currentIndex, queue, queueStartIndex],
  );

  const removeUpNextTrack = (trackId: string) => {
    removeFromQueue(trackId);
  };

const renderRightActions = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#DC2626",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "flex-end",
        paddingRight: 24,
        marginBottom: 8,
      }}
    >
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </View>
  );
};

const renderItem = ({ item, drag, isActive }: any) => {
  return (
    <ScaleDecorator>
      <Swipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderRightActions}
        // onSwipeableOpen={(direction: "left" | "right") => {
        //   if (direction === "right") {
        //     removeUpNextTrack(item.id);
        //   }
        // }}
        onSwipeableWillOpen={() => {
          removeUpNextTrack(item.id);
        }}
      >
        <View
          style={{
            marginBottom: 8,
          }}
        >
          <Pressable
            delayLongPress={150}
            onLongPress={drag}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: isActive
                ? "rgba(30,58,138,0.25)"
                : colors.background,
              borderWidth: 1,
              borderColor: isActive
                ? "#1E3A8A"
                : colors.border,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialIcons
              name="drag-handle"
              size={20}
              color={colors.textMuted}
            />

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: "700",
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  marginTop: 2,
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {item.artist}
              </Text>
            </View>
          </Pressable>
        </View>
      </Swipeable>
    </ScaleDecorator>
  );
};

  const onShareSong = async () => {
    if (!currentSong) return;

    try {
      await Share.share({
        message: `${currentSong.title} - ${currentSong.artist}`,
      });
    } catch {
      // Sharing is best effort.
    } finally {
      closeMenu();
    }
  };

  if (!currentSong) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 56,
          }}
          showsVerticalScrollIndicator={false}
        > */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <TouchableOpacity onPress={closePlayer} style={{ width: 36, alignItems: "flex-start" }}>
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#aaa", fontSize: 12, letterSpacing: 1 }}>
                PLAYING FROM
              </Text>
              <Text style={{ color: "#fff", fontWeight: "600", marginTop: 2, maxWidth: 200 }} numberOfLines={1}>
                {currentSong.album || "Up Next"}
              </Text>
            </View>

              <View style={{ flexDirection: "row", width: 72, justifyContent: "flex-end", gap: 8 }}>
                <TouchableOpacity onPress={() => setQueueVisible(true)} style={{ width: 36, alignItems: "flex-end" }}>
                  <MaterialIcons name="queue-music" size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={openMenu} style={{ width: 36, alignItems: "flex-end" }}>
                  <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
          </View>

          <View style={{ alignItems: "center", marginTop: 10 }}>
            {currentSong.artwork ? (
              <Image
                source={{ uri: currentSong.artwork }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: 16,
                  backgroundColor: "#111",
                }}
              />
            ) : (
              <View
                style={{
                  width: "85%",
                  aspectRatio: 1,
                  borderRadius: 16,
                  backgroundColor: colors.player,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="music-note" size={60} color="#fff" />
              </View>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "600",
                  color: "#fff",
                }}
                numberOfLines={1}
              >
                {normalizeTrack(currentSong.title).title}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: "#aaa",
                  marginTop: 2,
                }}
              >
                {currentSong.artist}
              </Text>
            </View>

            <TouchableOpacity onPress={() => toggleLike(currentSong.id)} style={{ padding: 8, marginLeft: 10 }}>
              <Ionicons
                name={isLiked(currentSong.id) ? "heart" : "heart-outline"}
                size={22}
                color={isLiked(currentSong.id) ? "#FF8C2B" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", marginTop: 16 }}>
            <Slider
              style={{ width: "100%", height: 40, marginTop: 16 }}
              minimumValue={0}
              maximumValue={duration || 1}
              value={position}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#555"
              thumbTintColor="#FFFFFF"
              onSlidingComplete={(value) => seekTo(value)}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginTop: 4,
              }}
            >
              <Text style={{ color: "#aaa", fontSize: 12 }}>
                {formatTime(position)}
              </Text>
              <Text style={{ color: "#aaa", fontSize: 12 }}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Pressable onPress={playPrevious} style={{ padding: 20 }}>
              <Ionicons name="play-skip-back" size={28} color="#fff" />
            </Pressable>

            <Pressable
              onPress={togglePlayPause}
              style={({ pressed }) => ({
                backgroundColor: "#1E3A8A",
                width: 80,
                height: 80,
                borderRadius: 40,
                justifyContent: "center",
                alignItems: "center",
                elevation: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={32}
                color="#fff"
              />
            </Pressable>
            
            <Pressable
              disabled={trackLoading}
              onPress={() => void playNext()}
              style={{ padding: 20 }}
            >
              <Ionicons name="play-skip-forward" size={28} color="#fff" />
            </Pressable>
          </View>

          {trackLoading ? (
            <View style={{ marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Loading track...</Text>
              <Text style={{ color: colors.textMuted, marginTop: 6 }}>
                Resolving a playable audio source.
              </Text>
            </View>
          ) : null}

          {trackError ? (
            <View style={{ marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: "rgba(185, 28, 28, 0.12)", borderWidth: 1, borderColor: "rgba(185, 28, 28, 0.35)" }}>
              <Text style={{ color: "#FCA5A5", fontWeight: "800" }}>Playback failed</Text>
              <Text style={{ color: "#FECACA", marginTop: 6 }}>{trackError}</Text>
              <Pressable onPress={retryCurrentTrack} style={{ marginTop: 12, alignSelf: "flex-start", backgroundColor: "#DC2626", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              paddingHorizontal: 40,
            }}
          >
            <Pressable
              onPress={toggleShuffle}
              style={{
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                backgroundColor: shuffleEnabled ? "rgba(30, 58, 138, 0.2)" : "transparent",
              }}
            >
              <Ionicons name="shuffle" size={28} color={shuffleEnabled ? "#1E3A8A" : "#aaa"} />
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: shuffleEnabled ? "#1E3A8A" : "#aaa",
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                {shuffleEnabled ? "ON" : "OFF"}
              </Text>
            </Pressable>

            <Pressable
              onPress={toggleRepeatMode}
              style={{
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                backgroundColor: repeatMode !== "off" ? "rgba(30, 58, 138, 0.2)" : "transparent",
              }}
            >
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={repeatMode === "one" ? "repeat-outline" : "repeat"}
                  size={28}
                  color={repeatMode === "off" ? "#aaa" : "#1E3A8A"}
                />
                {repeatMode === "one" && (
                  <Text
                    style={{
                      position: "absolute",
                      right: -4,
                      top: -2,
                      fontSize: 12,
                      fontWeight: "800",
                      color: "#1E3A8A",
                    }}
                  >
                    1
                  </Text>
                )}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: repeatMode === "off" ? "#aaa" : "#1E3A8A",
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                {repeatMode === "off" ? "OFF" : repeatMode === "all" ? "ALL" : "ONE"}
              </Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 18 }}>
            <Pressable
              onPress={() => setQueueVisible(true)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Up Next</Text>
            </Pressable>
          </View>
        {/* </ScrollView> */}
        </View>

        <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={closeMenu}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }} onPress={closeMenu}>
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                borderTopWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, marginBottom: 10 }}>
                SONG ACTIONS
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setAddToPlaylistVisible(true);
                  closeMenu();
                }}
                style={{ paddingVertical: 14 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                  Add to Playlist
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={closeMenu} style={{ paddingVertical: 14 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Remove from Playlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  toggleLike(currentSong.id);
                  closeMenu();
                }}
                style={{ paddingVertical: 14 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                  {isLiked(currentSong.id) ? "Unlike Song" : "Like Song"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onShareSong} style={{ paddingVertical: 14 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push(`/player/${currentSong.id}`);
                }}
                style={{ paddingVertical: 14 }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Details</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <AddToPlaylistModal
          visible={addToPlaylistVisible}
          song={currentSong}
          onClose={() => setAddToPlaylistVisible(false)}
        />

{queueVisible && (
  <View
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
      zIndex: 999,
    }}
  >
    {/* BACKDROP */}
    <Pressable
      style={StyleSheet.absoluteFillObject}
      onPress={() => setQueueVisible(false)}
    />

    {/* SHEET */}
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderColor: colors.border,
        maxHeight: "78%",
        paddingTop: 12,
        paddingBottom: 20,
      }}
    >
      {/* HANDLE */}
      <View style={{ alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.border,
          }}
        />
      </View>

      {/* HEADER */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: "800",
          }}
        >
          Up Next
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: 4,
          }}
        >
          Drag to reorder. Swipe left to remove.
        </Text>
      </View>

      {/* NOW PLAYING */}
      {currentSong ? (
        <View
          style={{
            paddingHorizontal: 16,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1,
              }}
            >
              NOW PLAYING
            </Text>

            <Text
              style={{
                color: colors.textPrimary,
                fontWeight: "800",
                marginTop: 6,
              }}
              numberOfLines={1}
            >
              {normalizeTrack(currentSong.title).title}
            </Text>

            <Text
              style={{
                color: colors.textMuted,
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {normalizeTrack(currentSong.title).artist ||
                currentSong.artist}
            </Text>
          </View>
        </View>
      ) : null}

      {/* EMPTY STATE */}
      {upNextQueue.length === 0 ? (
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.background,
            marginHorizontal: 16,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontWeight: "700",
            }}
          >
            Up next is empty
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              marginTop: 6,
            }}
          >
            Play a song from Search or a playlist to build the queue.
          </Text>
        </View>
      ) : (
        <DraggableFlatList
          data={upNextQueue}
            contentContainerStyle={{
              paddingBottom: 160,
            }}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragBegin={(index) => {
            console.log("DRAG BEGIN", index);
          }}
          onRelease={(index) => {
            console.log("RELEASE", index);
          }}
onDragEnd={({ data }) => {
  const newQueue = currentSong
    ? [currentSong, ...data]
    : data;

  replaceQueue(newQueue);
}}
        />
      )}
    </View>
  </View>
)}
      </SafeAreaView>
  );
}