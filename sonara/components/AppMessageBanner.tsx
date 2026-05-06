import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useAppMessage } from "../context/AppMessageContext";
import { colors } from "../theme/colors";

export default function AppMessageBanner() {
  const { message } = useAppMessage();

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 140,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: "rgba(18, 18, 18, 0.96)",
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <MaterialIcons name="check-circle" size={18} color={colors.active} />
        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>
          {message}
        </Text>
      </View>
    </View>
  );
}
