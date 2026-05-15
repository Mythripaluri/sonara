import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

export default function ArtistItem({ item, onPress }) {
	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={onPress}
			style={{ width: 84, marginRight: 10 }}
		>
			<View
			style={{
				width: 84,
				height: 84,
				borderRadius: 42,
				backgroundColor: "#222",
			}}
			>
				<Image
					source={{ uri: item.artwork }}
					contentFit="cover"
					cachePolicy="memory-disk"
					transition={150}
					style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: "#111" }}
				/>
			</View>
			<Text
				numberOfLines={1}
				style={{ color: "#fff", marginTop: 8, fontWeight: "700", fontSize: 13 }}
			>
				{item.name}
			</Text>
			<Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 11 }}>
				{item.genre}
			</Text>
		</TouchableOpacity>
	);
}
