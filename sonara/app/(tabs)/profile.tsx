import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { libraryStats } from "../../constants/catalog";
import { colors } from "../../theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const [highQuality, setHighQuality] = useState(true);
  const [newReleaseOnly, setNewReleaseOnly] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "800", paddingHorizontal: 20, paddingTop: 20 }}>
        Profile
      </Text>

      <View style={{ marginHorizontal: 20, marginTop: 18, padding: 20, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1 }}>LISTENER</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 8 }}>
          Sonara Demo User
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 8, lineHeight: 20 }}>
          A lightweight profile area for playback, favorites, and release discovery.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 18 }}>
        {libraryStats.map((item) => (
          <View key={item.label} style={{ flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.label}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 6 }}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 1.1, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
        SETTINGS
      </Text>

      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Playback quality</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>High</Text>
          </View>
          <Switch value={highQuality} onValueChange={setHighQuality} trackColor={{ false: colors.border, true: colors.player }} thumbColor="#fff" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Notifications</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>New releases only</Text>
          </View>
          <Switch value={newReleaseOnly} onValueChange={setNewReleaseOnly} trackColor={{ false: colors.border, true: colors.player }} thumbColor="#fff" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Download over Wi-Fi</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>Enabled only on Wi-Fi</Text>
          </View>
          <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ false: colors.border, true: colors.player }} thumbColor="#fff" />
        </View>

        <Pressable onPress={() => router.replace("/(auth)/onboarding")} style={{ marginTop: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 14, alignItems: "center" }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Reset demo session</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
