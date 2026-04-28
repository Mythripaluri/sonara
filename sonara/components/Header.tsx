import { Text, View } from "react-native";

export default function Header({ title, subtitle, avatarUri }) {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "flex-start",
				paddingHorizontal: 20,
				paddingTop: 16,
			}}
		>
			<View style={{ flex: 1, paddingRight: 12 }}>
				<Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>
					{title}
				</Text>
				{subtitle ? (
					<Text style={{ color: "#94A3B8", marginTop: 4, fontSize: 13 }}>
						{subtitle}
					</Text>
				) : null}
			</View>
		</View>
	);
}
