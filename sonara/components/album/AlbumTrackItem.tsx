import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "../../theme/colors";

interface Props {
  index: number;
  title: string;
  genre: string;
  onPress: () => void;
}

export default function AlbumTrackItem({
  index,
  title,
  genre,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.35)",
          width: 26,
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        {index}
      </Text>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontWeight: "700",
            fontSize: 16,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: 4,
            fontSize: 13,
          }}
        >
          {genre}
        </Text>
      </View>

      <MaterialIcons
        name="play-arrow"
        size={24}
        color={colors.textMuted}
      />
    </Pressable>
  );
}