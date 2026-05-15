import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";

interface Props {
  artwork: string;
}

export default function AlbumBackground({ artwork }: Props) {
  return (
    <>
      <Image
        source={{ uri: artwork }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />

      <LinearGradient
        colors={[
          "rgba(0,0,0,0.35)",
          "rgba(0,0,0,0.7)",
          "#000",
        ]}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );
}