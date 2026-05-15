import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated";
import { usePlayer } from "../context/PlayerContext";
import { colors } from "../theme/colors";
import { normalizeTrack } from "../utils/cleanTitle";

export default function MiniPlayer() {
  const router = useRouter();

  const { currentSong, isPlaying, pause, resume, position, duration } =
    usePlayer();

  const openFullPlayer = () => {
    router.push("/full-player");
  };

  const swipeUpGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY < -45) {
      runOnJS(openFullPlayer)();
    }
  });

  if (!currentSong) return null;

  const progress = duration ? (position / duration) * 100 : 0;

  return (
    <GestureDetector gesture={swipeUpGesture}>
      <Animated.View
        style={{
          position: "absolute",
          bottom: 72,
          width: "100%",
          paddingHorizontal: 8,
        }}
      >
      <View
        style={{
          borderRadius: 18,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 2,
            width: "100%",
            backgroundColor: colors.border,
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: 2,
              backgroundColor: colors.player,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/full-player")}
          activeOpacity={0.9}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 6,
            minHeight: 56,
          }}
        >
          <Image
            source={{ uri: currentSong.artwork }}
            resizeMode="cover"
            fadeDuration={0}
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              marginRight: 8,
              backgroundColor: "#111",
            }}
          />

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {normalizeTrack(currentSong.title).title}
            </Text>

            <Text
              numberOfLines={1}
              style={{
                color: colors.textMuted,
                fontSize: 11,
                marginTop: 1,
              }}
            >
              {normalizeTrack(currentSong.title).artist || currentSong.artist}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/full-player")}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 4,
            }}
          >
            <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (isPlaying) {
                await pause();
              } else {
                await resume();
              }
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
      </Animated.View>
    </GestureDetector>
  );
}
