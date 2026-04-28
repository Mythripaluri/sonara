import { Redirect, useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Seo from "../components/Seo";
import { colors } from "../theme/colors";

function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Seo
        title="Sonara"
        description="Sonara is a focused music app for browsing, searching, and playing tracks with a clean mobile-first listening experience."
      />

      <View style={styles.hero}>
        <Text style={styles.kicker}>Music, organized for listening</Text>
        <Text style={styles.title}>Find a track, start playback, and keep your queue moving.</Text>
        <Text style={styles.subtitle}>
          Sonara brings search, library, and playback together in a compact app that works cleanly on mobile and web.
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push("/(auth)/onboarding")}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Open app</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What Sonara does</Text>
        <Text style={styles.sectionText}>
          Browse curated tracks, search by artist or album, and jump into playback without leaving the flow.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Search first</Text>
          <Text style={styles.cardText}>Fast lookup across songs, artists, albums, and genres.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Built for playback</Text>
          <Text style={styles.cardText}>Queue management, recents, and persistent player state.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crawlable content</Text>
          <Text style={styles.cardText}>Static routes and metadata make the web export easier to index.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function Index() {
  if (Platform.OS !== "web") {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <LandingPage />;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 72,
    paddingBottom: 88,
    gap: 20,
  },
  hero: {
    gap: 16,
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: {
    color: colors.player,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: colors.player,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionText: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 26,
  },
  grid: {
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
