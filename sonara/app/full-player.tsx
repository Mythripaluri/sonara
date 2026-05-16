import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Image as RNImage, Modal, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { usePlayer } from "../context/PlayerContext";
import { usePlayerStore } from "../store/playerStore";
import { colors } from "../theme/colors";
import { normalizeTrack } from "../utils/cleanTitle";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SpringButton({ children, onPress, style, disabled }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      style={[style, animatedStyle, disabled ? { opacity: 0.45 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder < 10 ? "0" : ""}${remainder}`;
}

export default function FullPlayer() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);

  const {
    isPlaying,
    trackLoading,
    trackError,
    togglePlayPause,
    position,
    duration,
    seekTo,
    playNext,
    playPrevious,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    toggleRepeatMode,
    toggleLike,
    isLiked,
    retryCurrentTrack,
    removeFromQueue,
  } = usePlayer();

  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const replaceQueue = usePlayerStore((state) => state.replaceQueue);

  const pulse = useSharedValue(0);
  const artScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  useEffect(() => {
    artScale.value = withSpring(isPlaying ? 1.025 : 1, { damping: 18, stiffness: 90 });
  }, [artScale, isPlaying]);

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + pulse.value * 0.16,
    transform: [{ scale: 1.02 + pulse.value * 0.04 }],
  }));

  const albumArtStyle = useAnimatedStyle(() => ({
    transform: [{ scale: artScale.value }],
  }));

  const upNextQueue = useMemo(
    () => (currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue),
    [currentIndex, queue],
  );
  const historyQueue = useMemo(
    () => (currentIndex > 0 ? queue.slice(0, currentIndex).reverse().slice(0, 8) : []),
    [currentIndex, queue],
  );

  const progress = duration > 0 ? position / duration : 0;

  const onShareSong = async () => {
    if (!currentSong) return;
    try {
      await Share.share({ message: `${currentSong.title} - ${currentSong.artist}` });
    } finally {
      setMenuVisible(false);
    }
  };

  const renderRightActions = () => (
    <View style={styles.swipeRemove}>
      <Ionicons name="trash-outline" size={22} color="#fff" />
    </View>
  );

  const renderQueueItem = ({ item, drag, isActive }: any) => (
    <ScaleDecorator>
      <Swipeable
        friction={2}
        rightThreshold={42}
        overshootRight={false}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() => removeFromQueue(item.id)}
      >
        <Pressable
          delayLongPress={120}
          onLongPress={drag}
          style={[
            styles.queueTrack,
            isActive ? styles.queueTrackActive : null,
          ]}
        >
          <MaterialIcons name="drag-handle" size={20} color={colors.textMuted} />
          <ExpoImage source={{ uri: item.artwork }} style={styles.queueArtwork} contentFit="cover" cachePolicy="memory-disk" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.queueTitle} numberOfLines={1}>{normalizeTrack(item.title).title}</Text>
            <Text style={styles.queueArtist} numberOfLines={1}>{normalizeTrack(item.title).artist || item.artist}</Text>
          </View>
          <MaterialIcons name="playlist-add" size={20} color={colors.textMuted} />
        </Pressable>
      </Swipeable>
    </ScaleDecorator>
  );

  if (!currentSong) return null;

  const title = normalizeTrack(currentSong.title).title;
  const artist = normalizeTrack(currentSong.title).artist || currentSong.artist;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <LinearGradient colors={["#06101E", "#0B1B30", "#07111F"]} style={StyleSheet.absoluteFillObject} />
      {currentSong.artwork ? (
        <Animated.View style={[styles.ambientArtworkWrap, ambientStyle]}>
          <RNImage source={{ uri: currentSong.artwork }} blurRadius={34} resizeMode="cover" style={styles.ambientArtwork} />
        </Animated.View>
      ) : null}

      <View style={styles.content}>
        <View style={styles.topBar}>
          <SpringButton onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
          </SpringButton>

          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.eyebrow}>PLAYING FROM</Text>
            <Text style={styles.sourceText} numberOfLines={1}>{currentSong.album || "Up Next"}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <SpringButton onPress={() => setQueueVisible(true)} style={styles.iconButton}>
              <MaterialIcons name="queue-music" size={21} color={colors.textPrimary} />
            </SpringButton>
            <SpringButton onPress={() => setMenuVisible(true)} style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
            </SpringButton>
          </View>
        </View>

        <View style={styles.artStage}>
          <BlurView intensity={26} tint="dark" style={styles.artHalo}>
            <Animated.View style={albumArtStyle}>
              <ExpoImage
                source={{ uri: currentSong.artwork }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={180}
                style={styles.albumArt}
              />
            </Animated.View>
          </BlurView>
        </View>

        <View style={styles.metaRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
          </View>
          <SpringButton onPress={() => toggleLike(currentSong.id)} style={styles.likeButton}>
            <Ionicons
              name={isLiked(currentSong.id) ? "heart" : "heart-outline"}
              size={24}
              color={isLiked(currentSong.id) ? "#A78BFA" : colors.textPrimary}
            />
          </SpringButton>
        </View>

        <View style={styles.progressWrap}>
          <LinearGradient
            colors={["rgba(125, 211, 252, 0.95)", "rgba(167, 139, 250, 0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressGlow, { width: `${Math.max(progress * 100, 1)}%` }]}
          />
          <Slider
            value={position}
            minimumValue={0}
            maximumValue={Math.max(duration, 1)}
            onSlidingComplete={(value) => seekTo(value)}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="rgba(255,255,255,0.14)"
            thumbTintColor={colors.active}
            style={styles.slider}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <SpringButton onPress={toggleShuffle} style={[styles.secondaryControl, shuffleEnabled ? styles.controlActive : null]}>
            <Ionicons name="shuffle" size={22} color={shuffleEnabled ? colors.active : colors.textMuted} />
          </SpringButton>
          <SpringButton onPress={playPrevious} style={styles.primarySideControl}>
            <Ionicons name="play-skip-back" size={26} color={colors.textPrimary} />
          </SpringButton>
          <SpringButton onPress={togglePlayPause} style={styles.playButton}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={34} color="#06101E" />
          </SpringButton>
          <SpringButton disabled={trackLoading} onPress={() => void playNext()} style={styles.primarySideControl}>
            <Ionicons name="play-skip-forward" size={26} color={colors.textPrimary} />
          </SpringButton>
          <SpringButton onPress={toggleRepeatMode} style={[styles.secondaryControl, repeatMode !== "off" ? styles.controlActive : null]}>
            <Ionicons name={repeatMode === "one" ? "repeat-outline" : "repeat"} size={22} color={repeatMode === "off" ? colors.textMuted : colors.active} />
          </SpringButton>
        </View>

        {trackLoading ? (
          <View style={styles.statePanel}>
            <Text style={styles.stateTitle}>Loading track...</Text>
            <Text style={styles.stateText}>Resolving a playable audio source.</Text>
          </View>
        ) : null}

        {trackError ? (
          <View style={[styles.statePanel, styles.errorPanel]}>
            <Text style={[styles.stateTitle, { color: "#FCA5A5" }]}>Playback failed</Text>
            <Text style={[styles.stateText, { color: "#FECACA" }]}>{trackError}</Text>
            <Pressable onPress={retryCurrentTrack} style={styles.retryButton}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuSheet}>
            {[
              { label: "Add to Playlist", onPress: () => setAddToPlaylistVisible(true) },
              { label: isLiked(currentSong.id) ? "Unlike Song" : "Like Song", onPress: () => toggleLike(currentSong.id) },
              { label: "Share", onPress: onShareSong },
              { label: "Details", onPress: () => router.push(`/player/${currentSong.id}`) },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  setMenuVisible(false);
                  item.onPress();
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <AddToPlaylistModal
        visible={addToPlaylistVisible}
        song={currentSong}
        onClose={() => setAddToPlaylistVisible(false)}
      />

      {queueVisible ? (
        <Animated.View entering={FadeIn.duration(140)} style={styles.queueOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setQueueVisible(false)} />
          <Animated.View entering={SlideInDown.springify().damping(18).stiffness(140)} style={styles.queueSheet}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>
            <Text style={styles.sheetTitle}>Queue</Text>
            <Text style={styles.sheetSubtitle}>Drag upcoming tracks. Swipe left to remove.</Text>

            <View style={styles.nowPlayingCard}>
              <Text style={styles.eyebrow}>NOW PLAYING</Text>
              <Text style={styles.queueTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.queueArtist} numberOfLines={1}>{artist}</Text>
            </View>

            {historyQueue.length > 0 ? (
              <View style={styles.historyBlock}>
                <Text style={styles.queueSectionTitle}>HISTORY</Text>
                {historyQueue.map((track) => (
                  <Text key={track.id} style={styles.historyText} numberOfLines={1}>
                    {normalizeTrack(track.title).title}
                  </Text>
                ))}
              </View>
            ) : null}

            <Text style={styles.queueSectionTitle}>UPCOMING</Text>
            {upNextQueue.length === 0 ? (
              <View style={styles.emptyQueue}>
                <Text style={styles.queueTitle}>Up next is empty</Text>
                <Text style={styles.queueArtist}>Play a song from Search or a playlist to build the queue.</Text>
              </View>
            ) : (
              <DraggableFlatList
                data={upNextQueue}
                keyExtractor={(item) => item.id}
                renderItem={renderQueueItem}
                contentContainerStyle={{ paddingBottom: 40 }}
                onDragEnd={({ data }) => replaceQueue(currentSong ? [currentSong, ...data] : data)}
              />
            )}
          </Animated.View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  ambientArtworkWrap: { ...StyleSheet.absoluteFillObject },
  ambientArtwork: { width: "100%", height: "58%" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.1, fontWeight: "800" },
  sourceText: { color: colors.textPrimary, fontWeight: "700", marginTop: 3, maxWidth: 210, fontSize: 12 },
  artStage: { alignItems: "center", justifyContent: "center", minHeight: 310 },
  artHalo: {
    width: 292,
    height: 292,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },
  albumArt: { width: 260, height: 260, borderRadius: 24, backgroundColor: colors.surface },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: "800" },
  artist: { color: colors.textSecondary, fontSize: 14, marginTop: 3 },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressWrap: { marginTop: 18 },
  progressGlow: {
    position: "absolute",
    left: 0,
    top: 15,
    height: 6,
    borderRadius: 999,
    shadowColor: colors.glow,
    shadowOpacity: 0.75,
    shadowRadius: 12,
  },
  slider: { width: "100%", height: 36 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  timeText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22 },
  secondaryControl: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  primarySideControl: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  controlActive: { backgroundColor: "rgba(125, 211, 252, 0.14)" },
  playButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.active,
    shadowColor: colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  statePanel: { marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  stateTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: 13 },
  stateText: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  errorPanel: { backgroundColor: "rgba(185, 28, 28, 0.14)", borderColor: "rgba(248, 113, 113, 0.35)" },
  retryButton: { marginTop: 10, alignSelf: "flex-start", backgroundColor: "#DC2626", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.54)", justifyContent: "flex-end" },
  menuSheet: {
    margin: 14,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: { paddingHorizontal: 16, paddingVertical: 15, borderTopWidth: 1, borderTopColor: colors.border },
  menuText: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  queueOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)", justifyContent: "flex-end", zIndex: 20 },
  queueSheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: "#091525",
    borderWidth: 1,
    borderColor: colors.border,
  },
  handleWrap: { alignItems: "center", marginBottom: 12 },
  handle: { width: 44, height: 4, borderRadius: 999, backgroundColor: colors.border },
  sheetTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "800" },
  sheetSubtitle: { color: colors.textMuted, marginTop: 4, marginBottom: 12, fontSize: 12 },
  nowPlayingCard: { padding: 12, borderRadius: 14, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  historyBlock: { marginBottom: 12 },
  queueSectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginBottom: 8 },
  historyText: { color: colors.textSecondary, fontSize: 12, paddingVertical: 3 },
  queueTrack: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queueTrackActive: { backgroundColor: "rgba(125, 211, 252, 0.16)", borderColor: colors.active },
  queueArtwork: { width: 38, height: 38, borderRadius: 8, marginLeft: 8, backgroundColor: colors.surface },
  queueTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: 13 },
  queueArtist: { color: colors.textMuted, marginTop: 3, fontSize: 11 },
  swipeRemove: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 22,
    marginBottom: 8,
  },
  emptyQueue: { padding: 16, borderRadius: 14, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
});
