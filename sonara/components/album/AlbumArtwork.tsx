import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

interface Props {
  artwork: string;
}

export default function AlbumArtwork({ artwork }: Props) {
  return (
    <View
      style={{
        alignItems: "center",
        marginTop: 20,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          padding: 10,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.45,
          shadowRadius: 20,
          elevation: 24,
        }}
      >
        <Image
          source={{ uri: artwork }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          style={{
            width: 280,
            height: 280,
            borderRadius: 24,
            backgroundColor: "#111",
          }}
        />
      </View>
    </View>
  );
}
