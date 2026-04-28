import { Image, Text, TouchableOpacity, View } from "react-native";

export default function ArtistItem({ item, onPress }) {
	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={onPress}
			style={{ width: 96, marginRight: 14 }}
		>
			<View
				style={{
					width: 96,
					height: 96,
					borderRadius: 48,
					overflow: "hidden",
					backgroundColor: "#222",
				}}
			>
				<Image
					source={{ uri: item.artwork }}
					style={{ width: 96, height: 96 }}
				/>
			</View>
			<Text
				numberOfLines={1}
				style={{ color: "#fff", marginTop: 10, fontWeight: "700" }}
			>
				{item.name}
			</Text>
			<Text numberOfLines={1} style={{ color: "#94A3B8", fontSize: 12 }}>
				{item.genre}
			</Text>
		</TouchableOpacity>
	);
}
