import { ImageBackground, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AlbumCard({ item, onOpen, onPlay }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onOpen ?? onPlay}
      style={{
        width: 170,
        height: 200,
        marginRight: 12,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <ImageBackground
        source={{ uri: item.artwork }}
        style={{ flex: 1, justifyContent: "flex-end" }}
        imageStyle={{ borderRadius: 20 }}
      >
        {onPlay ? (
          <Pressable
            onPress={onPlay}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
            }}
          >
            <Ionicons name="play" size={16} color="#fff" />
          </Pressable>
        ) : null}

        <View
          style={{
            padding: 14,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
            {item.title}
          </Text>
          <Text style={{ color: "#E5E7EB", marginTop: 4, fontSize: 12 }}>
            {item.artist || item.subtitle}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}
