import { Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppMessageBanner from "../components/AppMessageBanner";
import MiniPlayer from "../components/MiniPlayer";
import { AppMessageProvider } from "../context/AppMessageContext";
import { PlayerProvider } from "../context/PlayerContext";
import { colors } from "../theme/colors";

export default function Layout() {
  const pathname = usePathname();
  const hideMiniPlayer = pathname === "/onboarding" || pathname === "/full-player";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PlayerProvider>
        <AppMessageProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  gestureEnabled: false,
                }}
              />
              {hideMiniPlayer ? null : <AppMessageBanner />}
              {hideMiniPlayer ? null : <MiniPlayer />}
            </View>
          </SafeAreaView>
        </AppMessageProvider>
      </PlayerProvider>
    </GestureHandlerRootView>
  );
}
