import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { libraryStats } from "../../constants/catalog";
import { colors, heroGradient } from "../../theme/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen() {
  const router = useRouter();
  const [highQuality, setHighQuality] = useState(true);
  const [newReleaseOnly, setNewReleaseOnly] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 20 }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 34, fontWeight: "800" }}>
        Profile
      </Text>

      <View style={{ alignItems: "center", marginTop: 20 }}>
        <LinearGradient
          colors={[...heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>S</Text>
        </LinearGradient>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 12 }}>
          Sample Listener
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          @sonara.user
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        {libraryStats.map((item) => (
          <View key={item.label} style={{ flex: 1, backgroundColor: colors.surfaceElevated, padding: 14, borderRadius: 14, alignItems: "center" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "800" }}>{item.value}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1.1, marginTop: 24, marginBottom: 12 }}>
        SETTINGS
      </Text>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceElevated, padding: 16, borderRadius: 14 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Playback quality</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>High</Text>
          </View>
          <Switch value={highQuality} onValueChange={setHighQuality} trackColor={{ false: colors.border, true: colors.player }} thumbColor="#fff" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceElevated, padding: 16, borderRadius: 14 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Notifications</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>New releases only</Text>
          </View>
          <Switch value={newReleaseOnly} onValueChange={setNewReleaseOnly} trackColor={{ false: colors.border, true: colors.player }} thumbColor="#fff" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceElevated, padding: 16, borderRadius: 14 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Download over Wi-Fi</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>Enabled only on Wi-Fi</Text>
          </View>
          <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ false: colors.border, true: colors.player }} thumbColor="#fff" />
        </View>

        <Pressable onPress={() => router.replace("/(auth)/onboarding")} style={{ marginTop: 4, backgroundColor: colors.surfaceElevated, paddingVertical: 12, borderRadius: 14, alignItems: "center" }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Reset demo session</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
