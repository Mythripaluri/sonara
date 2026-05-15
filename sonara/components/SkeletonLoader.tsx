import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "../theme/colors";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  shimmer?: boolean;
}

export const SkeletonLoader = ({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style = {},
  shimmer = true,
}: SkeletonLoaderProps) => {
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (shimmer) {
      shimmerOpacity.value = withRepeat(
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [shimmer, shimmerOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceElevated,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SongItemSkeleton = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 8,
      marginVertical: 2,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
    }}
  >
    <SkeletonLoader
      width={54}
      height={54}
      borderRadius={10}
      style={{ marginRight: 8 }}
    />
    <View style={{ flex: 1 }}>
      <SkeletonLoader width="80%" height={14} borderRadius={6} />
      <SkeletonLoader
        width="60%"
        height={11}
        borderRadius={5}
        style={{ marginTop: 6 }}
      />
    </View>
  </View>
);

export const PlaylistCardSkeleton = () => (
  <View
    style={{
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      padding: 10,
      marginVertical: 2,
      marginHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <SkeletonLoader
      width={68}
      height={68}
      borderRadius={12}
      style={{ marginRight: 10 }}
    />
    <View style={{ flex: 1 }}>
      <SkeletonLoader width="70%" height={14} borderRadius={6} />
      <SkeletonLoader
        width="50%"
        height={11}
        borderRadius={5}
        style={{ marginTop: 6 }}
      />
    </View>
  </View>
);

export const AlbumCardSkeleton = () => (
  <View style={{ width: 160, marginRight: 10 }}>
    <SkeletonLoader width="100%" height={160} borderRadius={16} />
    <SkeletonLoader
      width="90%"
      height={13}
      borderRadius={6}
      style={{ marginTop: 8 }}
    />
    <SkeletonLoader
      width="70%"
      height={10}
      borderRadius={5}
      style={{ marginTop: 4 }}
    />
  </View>
);
