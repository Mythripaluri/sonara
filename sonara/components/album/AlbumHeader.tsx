import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

export default function AlbumHeader() {
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: 50,
        paddingHorizontal: 16,
      }}
    >
      <Pressable onPress={() => router.back()}>
        <MaterialIcons
          name="keyboard-arrow-left"
          size={34}
          color="#fff"
        />
      </Pressable>
    </View>
  );
}