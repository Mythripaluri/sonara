
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Seo from "../components/Seo";
import { colors } from "../theme/colors";

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Seo
        title="Quick actions"
        description="Jump back to playback, search, or your library from one place in Sonara."
      />
      <MaterialIcons name="music-note" size={42} color="#fff" />
      <Text style={styles.title}>Quick actions</Text>
      <Text style={styles.text}>Jump back to playback, search, or your library from one place.</Text>

      <Pressable onPress={() => router.replace("/(tabs)")} style={styles.button}>
        <Text style={styles.buttonText}>Go to app</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 16,
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  button: {
    marginTop: 22,
    backgroundColor: colors.player,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
