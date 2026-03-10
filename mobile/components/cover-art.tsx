import { Image, StyleSheet, Text, View } from "react-native";
import { palette } from "@/lib/theme";

type CoverArtProps = {
  title: string;
  subtitle?: string;
  colors: [string, string];
  size?: number;
  rounded?: number;
  imageUri?: string | null;
};

export function CoverArt({ title, subtitle, colors, size = 96, rounded = 24, imageUri }: CoverArtProps) {
  return (
    <View
      style={[
        styles.card,
        {
          width: size,
          height: size,
          borderRadius: rounded,
          backgroundColor: colors[0]
        }
      ]}
    >
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : null}
      <View style={[styles.glow, { backgroundColor: colors[1] }]} />
      <View style={styles.lines}>
        <View style={styles.lineLg} />
        <View style={styles.lineMd} />
        <View style={styles.lineSm} />
      </View>
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: "space-between"
  },
  image: {
    ...StyleSheet.absoluteFillObject
  },
  glow: {
    position: "absolute",
    width: "70%",
    height: "70%",
    borderRadius: 999,
    right: -18,
    top: -18,
    opacity: 0.65
  },
  lines: {
    padding: 14,
    gap: 8
  },
  lineLg: {
    width: "56%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)"
  },
  lineMd: {
    width: "32%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)"
  },
  lineSm: {
    width: "22%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  footer: {
    padding: 12,
    backgroundColor: "rgba(8,8,12,0.28)"
  },
  title: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700"
  },
  subtitle: {
    color: "rgba(245,243,239,0.62)",
    fontSize: 10,
    marginTop: 2
  }
});
