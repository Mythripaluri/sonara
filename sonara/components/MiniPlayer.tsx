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
          bottom: 66,
          width: "100%",
          backgroundColor: "rgba(18, 18, 18, 0.98)",
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
      {/* 🔵 Progress Bar */}
      <View
        style={{
          height: 3,
          width: "100%",
          backgroundColor: colors.border,
        }}
      >
        <View
          style={{
            width: `${progress}%`,
            height: 3,
            backgroundColor: colors.player,
          }}
        />
      </View>

      {/* 🎵 Content */}
      <TouchableOpacity
        onPress={() => router.push("/full-player")}
        activeOpacity={0.9}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 8,
          minHeight: 69,
        }}
      >
        {/* Artwork */}
        <Image
          source={{ uri: currentSong.artwork }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            marginRight: 12,
            backgroundColor: "#333",
          }}
        />

        {/* Song Info */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.textPrimary,
              fontWeight: "600",
                fontSize: 13,
            }}
          >
            {normalizeTrack(currentSong.title).title}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              color: colors.textMuted,
              fontSize: 11,
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
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <Ionicons name="chevron-up" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Play Button */}
        <TouchableOpacity
          onPress={async () => {
            if (isPlaying) {
              await pause();
            } else {
              await resume();
            }
          }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.player,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}
