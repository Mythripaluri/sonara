import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Seo from "../../components/Seo";
import { colors } from "../../theme/colors";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B0B0B",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Seo
        title="Welcome"
        description="Start using Sonara to search music, build a listening queue, and continue playback across sessions."
      />
      <Text style={{ color: "#fff", fontSize: 22 }}>Welcome to Sonara 🎵</Text>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        style={{
          marginTop: 20,
          backgroundColor: colors.player,
          padding: 12,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff" }}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}
