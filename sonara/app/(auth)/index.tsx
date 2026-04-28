import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme/colors";

export default function OnboardingScreen() {
  const router = useRouter(); // 👈 MUST have this

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B0B0B",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 22 }}>Welcome to Sonara 🎵</Text>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")} // 👈 ADD HERE
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
