import React from "react";
import { Text, View } from "react-native";

import { colors } from "../../theme/colors";

interface Props {
  title: string;
  artist: string;
  year: string | number;
  description: string;
}

export default function AlbumInfo({
  title,
  artist,
  year,
  description,
}: Props) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        marginTop: 24,
      }}
    >
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 30,
          fontWeight: "900",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          marginTop: 6,
          fontSize: 15,
        }}
      >
        {artist} • {year}
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          marginTop: 12,
          lineHeight: 22,
          fontSize: 14,
        }}
      >
        {description}
      </Text>
    </View>
  );
}