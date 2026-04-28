import { Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MiniPlayer from "../components/MiniPlayer";
import { PlayerProvider } from "../context/PlayerContext";
import { colors } from "../theme/colors";

export default function Layout() {
  const pathname = usePathname();
  const hideMiniPlayer = pathname === "/onboarding" || pathname === "/full-player";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PlayerProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
            {hideMiniPlayer ? null : <MiniPlayer />}
          </View>
        </SafeAreaView>
      </PlayerProvider>
    </GestureHandlerRootView>
  );
}
