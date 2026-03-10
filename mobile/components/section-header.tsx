import { StyleSheet, Text, View } from "react-native";
import { palette } from "@/lib/theme";

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800"
  },
  action: {
    color: palette.accentSoft,
    fontSize: 13,
    fontWeight: "700"
  }
});
