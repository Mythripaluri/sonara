import { ImageBackground, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

export default function AlbumCard({ item, onOpen, onPlay }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onOpen ?? onPlay}
      style={{
        width: 160,
        height: 160,
        marginRight: 10,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <ImageBackground
        source={{ uri: item.artwork }}
        style={{ flex: 1, justifyContent: "flex-end" }}
        imageStyle={{ borderRadius: 16 }}
      >
        {onPlay ? (
          <Pressable
            onPress={onPlay}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
            }}
          >
            <Ionicons name="play" size={14} color="#fff" />
          </Pressable>
        ) : null}

        <View
          style={{
            padding: 10,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
            {item.title}
          </Text>
          <Text style={{ color: "#E5E7EB", marginTop: 2, fontSize: 10 }}>
            {item.artist || item.subtitle}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}
