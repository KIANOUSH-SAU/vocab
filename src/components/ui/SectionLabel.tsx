import { View, Text, StyleSheet } from "react-native";
import { colors, radii, fonts } from "@constants/theme";

export function SectionLabel({ title }: { title: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        <Text style={styles.slash}>/ </Text>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginBottom: 4,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  slash: {
    color: colors.inkLight,
  },
});
