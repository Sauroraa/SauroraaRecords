import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CoverArt } from "@/components/cover-art";
import {
  createComment,
  fetchFavoriteStatus,
  removeFavorite,
  saveFavorite,
  shareRelease,
  toggleCommentLike
} from "@/lib/api";
import { loadMobileReleaseDetail } from "@/lib/mobile-data";
import { MobileArtist, MobileRelease, mobileArtists, mobileReleases } from "@/lib/mock-data";
import { useAppState } from "@/providers/app-provider";
import { PlayerTrack, usePlayer } from "@/providers/player-provider";
import { palette } from "@/lib/theme";
import type { MobileComment, MobileEngagement } from "@/lib/mobile-data";

export default function ReleaseScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { session } = useAppState();
  const player = usePlayer();
  const fallbackRelease = mobileReleases.find((item) => item.slug === slug) ?? mobileReleases[0];
  const fallbackArtist = mobileArtists.find((item) => item.id === fallbackRelease.artistId) ?? mobileArtists[0];
  const [release, setRelease] = useState<MobileRelease>(fallbackRelease);
  const [artist, setArtist] = useState<MobileArtist>(fallbackArtist);
  const [comments, setComments] = useState<MobileComment[]>([]);
  const [related, setRelated] = useState<MobileRelease[]>(mobileReleases.slice(1, 4));
  const [engagement, setEngagement] = useState<MobileEngagement>({
    views: 0,
    comments: 0,
    shares: 0,
    uniqueListeners: 0,
    liked: false
  });
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    loadMobileReleaseDetail(slug).then((detail) => {
      if (!mounted) return;
      setRelease(detail.release);
      setArtist(detail.artist);
      setComments(detail.comments);
      setRelated(detail.related);
      setEngagement(detail.engagement);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!release.id || !session.accessToken) return;
    let mounted = true;
    fetchFavoriteStatus(release.id, session.accessToken)
      .then((result) => {
        if (!mounted) return;
        setEngagement((current) => ({ ...current, liked: result.saved }));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [release.id, session.accessToken]);

  const playerTrack: PlayerTrack = {
    id: release.id,
    slug: release.slug,
    title: release.title,
    artist: release.artist,
    audioUrl: release.audioUrl ?? null,
    coverUrl: release.coverUrl,
    colors: [release.colorA, release.colorB]
  };

  async function handleToggleFavorite() {
    if (!session.accessToken) {
      Alert.alert("SauroraaMusic", "Connecte-toi pour sauvegarder une release.");
      return;
    }

    try {
      setSavingFavorite(true);
      if (engagement.liked) {
        await removeFavorite(release.id, session.accessToken);
        setEngagement((current) => ({ ...current, liked: false }));
      } else {
        await saveFavorite(release.id, session.accessToken);
        setEngagement((current) => ({ ...current, liked: true }));
      }
    } finally {
      setSavingFavorite(false);
    }
  }

  async function handleShare() {
    if (session.accessToken) {
      await shareRelease(release.id, session.accessToken, `Shared from mobile: ${release.title}`).catch(() => {});
      setEngagement((current) => ({ ...current, shares: current.shares + 1 }));
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: release.title,
        text: `${release.title} by ${release.artist}`,
        url: `https://sauroraarecords.be/release/${release.slug}`
      }).catch(() => {});
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`https://sauroraarecords.be/release/${release.slug}`).catch(() => {});
      Alert.alert("SauroraaMusic", "Lien copie.");
    }
  }

  async function handleSubmitComment() {
    if (!session.accessToken) {
      Alert.alert("SauroraaMusic", "Connecte-toi pour commenter.");
      return;
    }
    if (!commentBody.trim()) return;

    try {
      setSubmittingComment(true);
      const created = await createComment({ releaseId: release.id, body: commentBody.trim() }, session.accessToken);
      setComments((current) => [
        {
          id: String(created.id),
          author: String((created.user as { firstName?: string; email?: string; artist?: { displayName?: string } } | undefined)?.artist?.displayName ??
            (created.user as { firstName?: string } | undefined)?.firstName ??
            (created.user as { email?: string } | undefined)?.email?.split("@")[0] ??
            "You"),
          body: String(created.body ?? commentBody.trim()),
          time: "Now",
          likesCount: Number(created.likesCount ?? 0),
          verified: Boolean(created.isVerifiedPurchase)
        },
        ...current
      ]);
      setCommentBody("");
      setEngagement((current) => ({ ...current, comments: current.comments + 1 }));
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleToggleCommentLike(commentId: string) {
    if (!session.accessToken) {
      Alert.alert("SauroraaMusic", "Connecte-toi pour liker un commentaire.");
      return;
    }

    const result = await toggleCommentLike(commentId, session.accessToken).catch(() => null);
    if (!result) return;
    setComments((current) =>
      current.map((item) =>
        item.id === commentId
          ? { ...item, likesCount: Math.max(0, item.likesCount + (result.liked ? 1 : -1)) }
          : item
      )
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <CoverArt
          title={release.title}
          subtitle={release.artist}
          colors={[release.colorA, release.colorB]}
          size={220}
          rounded={30}
          imageUri={release.coverUrl}
        />

        <View style={styles.heroBody}>
          <View style={styles.row}>
            <Text style={styles.genrePill}>{release.genre}</Text>
            <Text style={styles.score}>{release.trendScore} pts</Text>
          </View>

          <Text style={styles.title}>{release.title}</Text>
          <Text style={styles.artist}>{release.artist}</Text>
          <Text style={styles.body}>{release.description}</Text>

          <View style={styles.metaGrid}>
            <MetaTile label="Tempo" value={`${release.bpm} BPM`} />
            <MetaTile label="Key" value={release.key} />
            <MetaTile label="Length" value={release.duration} />
            <MetaTile label="Access" value={release.priceLabel} />
          </View>

          <View style={styles.wave}>
            {Array.from({ length: 32 }).map((_, index) => (
              <View key={index} style={[styles.waveBar, { height: 14 + ((index * 11) % 54) }]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => player.playTrack(playerTrack)}>
              <Text style={styles.primaryButtonText}>
                {player.currentTrack?.id === release.id && player.playing ? "Pause active" : "Play preview"}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void handleToggleFavorite()}>
              <Text style={styles.secondaryButtonText}>
                {savingFavorite ? "..." : engagement.liked ? "Saved" : "Save"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.metricsRow}>
            <MetaTile label="Views" value={`${engagement.views}`} />
            <MetaTile label="Comments" value={`${engagement.comments}`} />
            <MetaTile label="Shares" value={`${engagement.shares}`} />
            <MetaTile label="Listeners" value={`${engagement.uniqueListeners}`} />
          </View>
          <View style={styles.inlineActions}>
            <Pressable style={styles.inlineAction} onPress={() => void handleShare()}>
              <Text style={styles.inlineActionText}>Share</Text>
            </Pressable>
            <Pressable style={styles.inlineAction} onPress={() => player.togglePlayback()}>
              <Text style={styles.inlineActionText}>Toggle</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Artist card</Text>
        <View style={styles.artistCard}>
          <View style={styles.artistAvatar}>
            {artist.avatarUrl ? (
              <Image source={{ uri: artist.avatarUrl }} style={styles.artistAvatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.artistAvatarText}>{artist.initials}</Text>
            )}
          </View>
          <View style={styles.artistBody}>
            <View style={styles.artistRow}>
              <Text style={styles.artistName}>{artist.name}</Text>
              {artist.verified ? <Text style={styles.artistVerified}>✓</Text> : null}
            </View>
            <Text style={styles.artistMeta}>{artist.genre}</Text>
            <Text style={styles.artistMeta}>{artist.followers} followers</Text>
          </View>
          <Pressable onPress={() => router.push("/")} style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Comment flow</Text>
        <View style={styles.commentComposer}>
          <TextInput
            placeholder="Write a comment"
            placeholderTextColor={palette.dim}
            style={styles.commentInput}
            value={commentBody}
            onChangeText={setCommentBody}
          />
          <Pressable style={styles.commentButton} onPress={() => void handleSubmitComment()}>
            <Text style={styles.commentButtonText}>{submittingComment ? "..." : "Send"}</Text>
          </Pressable>
        </View>
        {comments.map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.author} • {comment.time}</Text>
              {comment.verified ? <Text style={styles.verifiedBadge}>Verified</Text> : null}
            </View>
            <Text style={styles.commentText}>{comment.body}</Text>
            <Pressable style={styles.commentLike} onPress={() => void handleToggleCommentLike(comment.id)}>
              <Text style={styles.commentLikeText}>Like • {comment.likesCount}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>More from catalogue</Text>
        <View style={styles.relatedList}>
          {related.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/releases/${item.slug}`)} style={styles.relatedItem}>
              <CoverArt
                title={item.title}
                subtitle={item.artist}
                colors={[item.colorA, item.colorB]}
                size={62}
                rounded={18}
                imageUri={item.coverUrl}
              />
              <View style={styles.relatedBody}>
                <Text numberOfLines={1} style={styles.relatedTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.relatedMeta}>{item.artist} • {item.genre}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaTile}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: palette.bg
  },
  hero: {
    gap: 18
  },
  heroBody: {
    gap: 12
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  genrePill: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  score: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800"
  },
  artist: {
    color: palette.accentSoft,
    fontSize: 15,
    fontWeight: "700"
  },
  body: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metaTile: {
    width: "47%",
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  metaLabel: {
    color: palette.dim,
    fontSize: 11
  },
  metaValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 5
  },
  wave: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 74,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: palette.surface
  },
  waveBar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: palette.accentSoft
  },
  actions: {
    flexDirection: "row",
    gap: 10
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: palette.accent
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: "700"
  },
  inlineActions: {
    flexDirection: "row",
    gap: 10
  },
  inlineAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  inlineActionText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700"
  },
  panel: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 18,
    gap: 12
  },
  panelTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800"
  },
  artistCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  artistAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceRaised,
    overflow: "hidden"
  },
  artistAvatarImage: {
    width: "100%",
    height: "100%"
  },
  artistAvatarText: {
    color: palette.accentSoft,
    fontSize: 16,
    fontWeight: "800"
  },
  artistBody: {
    flex: 1
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  artistName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  },
  artistVerified: {
    color: palette.accentSoft,
    fontWeight: "800"
  },
  artistMeta: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(124,58,237,0.12)"
  },
  followButtonText: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "700"
  },
  comment: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  commentComposer: {
    flexDirection: "row",
    gap: 10
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
    backgroundColor: palette.bgSoft
  },
  commentButton: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: palette.accent
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center"
  },
  commentAuthor: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  verifiedBadge: {
    color: palette.success,
    fontSize: 11,
    fontWeight: "700"
  },
  commentText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20
  },
  commentLike: {
    marginTop: 10
  },
  commentLikeText: {
    color: palette.dim,
    fontSize: 12,
    fontWeight: "700"
  },
  relatedList: {
    gap: 12
  },
  relatedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  relatedBody: {
    flex: 1,
    gap: 4
  },
  relatedTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700"
  },
  relatedMeta: {
    color: palette.muted,
    fontSize: 12
  }
});
