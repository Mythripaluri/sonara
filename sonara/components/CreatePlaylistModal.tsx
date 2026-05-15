import React, { useRef, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, description?: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  onCreatePlaylist,
}) => {
  const [playlistName, setPlaylistName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  const handleCreate = async () => {
    const trimmedName = playlistName.trim();

    if (!trimmedName) {
      Alert.alert("Error", "Please enter a playlist name");
      return;
    }

    if (trimmedName.length > 100) {
      Alert.alert("Error", "Playlist name must be less than 100 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      onCreatePlaylist(trimmedName, description.trim() || undefined);
      setPlaylistName("");
      setDescription("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "85%",
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          <View style={{ alignItems: "center", paddingHorizontal: 16, marginBottom: 18 }}>
            <View style={{ width: 132, height: 132, borderRadius: 20, marginBottom: 0, backgroundColor: "#111" }}>
              <Image
                source={{ uri: "https://picsum.photos/seed/sonara-playlist-cover/800/800" }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
                style={{ width: 132, height: 132, borderRadius: 20 }}
              />
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.24)",
                  borderRadius: 20,
                }}
              >
                <MaterialIcons name="image" size={36} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 8 }}>
                  Cover placeholder
                </Text>
              </View>
            </View>
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
            >
              Create Playlist
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <MaterialIcons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Playlist Name Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                Playlist Name
              </Text>
              <TextInput
                ref={nameInputRef}
                placeholder="My awesome playlist"
                placeholderTextColor={colors.textSecondary}
                value={playlistName}
                onChangeText={setPlaylistName}
                maxLength={100}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {playlistName.length}/100
              </Text>
            </View>

            {/* Description Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                Description (Optional)
              </Text>
              <TextInput
                placeholder="Add a description for this playlist"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                maxLength={200}
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                  textAlignVertical: "top",
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                {description.length}/200
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              paddingHorizontal: 16,
              marginTop: 24,
            }}
          >
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                backgroundColor: colors.surface,
                borderRadius: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  textAlign: "center",
                }}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCreate}
              disabled={isSubmitting || !playlistName.trim()}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                backgroundColor: !playlistName.trim() ? colors.surface : colors.active,
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: !playlistName.trim() ? colors.textSecondary : colors.background,
                  textAlign: "center",
                }}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
