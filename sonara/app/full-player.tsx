import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayer } from "../context/PlayerContext";
import { colors } from "../theme/colors";

export default function FullPlayer() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const {
    currentSong,
    isPlaying,
    trackLoading,
    trackError,
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
  } = usePlayer();

  const formatTime = (millis) => {
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

  const closeGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY > 60) {
      runOnJS(closePlayer)();
    }
  });

  if (!currentSong) return null;

  return (
    <GestureDetector gesture={closeGesture}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 56,
          }}
          showsVerticalScrollIndicator={false}
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
                {currentSong.album || "My Playlist"}
              </Text>
            </View>

            <TouchableOpacity onPress={openMenu} style={{ width: 36, alignItems: "flex-end" }}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", marginTop: 10 }}>
            {currentSong.artwork ? (
              <Image
                source={{ uri: currentSong.artwork }}
                style={{ width: "85%", aspectRatio: 1, borderRadius: 16 }}
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
                {currentSong.title}
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

            <Pressable onPress={playNext} style={{ padding: 20 }}>
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
        </ScrollView>

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

              <TouchableOpacity onPress={closeMenu} style={{ paddingVertical: 14 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Add to Playlist</Text>
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
      </SafeAreaView>
    </GestureDetector>
  );
}
