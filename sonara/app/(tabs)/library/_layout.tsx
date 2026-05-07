// import { Stack } from "expo-router";

// export default function LibraryLayout() {
//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false,
//         gestureEnabled: false,
//         animation: "none",
//         contentStyle: { backgroundColor: "#0B1F2A" },
//       }}
//     />
//   );
// }


import { Stack } from "expo-router";

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,

        animation: "none",

        presentation: "card",

        contentStyle: {
          backgroundColor: "#0B1F2A",
        },
      }}
    />
  );
}