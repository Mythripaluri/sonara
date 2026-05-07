// app/(tabs)/_layout.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../theme/colors";

export default function TabLayout() {
  return (
  <Tabs
    detachInactiveScreens={false}
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "rgba(27, 60, 83, 0.96)",
        borderTopColor: colors.border,
        height: 70,
        paddingTop: 10,
      },
      tabBarActiveTintColor: colors.active,
      tabBarInactiveTintColor: colors.inactive,
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: "600",
        marginBottom: 8,
      },
    }}
  >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="library-music" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
