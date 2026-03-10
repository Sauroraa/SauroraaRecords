import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MobileArtist } from "@/lib/mock-data";
import { palette } from "@/lib/theme";

export function ArtistListCard({ artist }: { artist: MobileArtist }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        {artist.avatarUrl ? (
          <Image source={{ uri: artist.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <Text style={styles.avatarText}>{artist.initials}</Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{artist.name}</Text>
          {artist.verified ? <Text style={styles.verified}>✓</Text> : null}
        </View>
        <Text style={styles.meta}>{artist.genre}</Text>
        <Text style={styles.meta}>{artist.followers} followers</Text>
      </View>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Follow</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceRaised,
    overflow: "hidden"
  },
  avatarImage: {
    width: "100%",
    height: "100%"
  },
  avatarText: {
    color: palette.accentSoft,
    fontSize: 16,
    fontWeight: "800"
  },
  body: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  name: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  },
  verified: {
    color: palette.accentSoft,
    fontSize: 14,
    fontWeight: "900"
  },
  meta: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(124,58,237,0.12)"
  },
  buttonText: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "700"
  }
});
