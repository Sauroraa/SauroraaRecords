import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma.service";
import { createHmac, timingSafeEqual } from "node:crypto";

type StreamScope = "PREVIEW" | "FULL";

type StreamClaims = {
  exp: number;
  releaseId: string;
  scope: StreamScope;
  ip: string;
};

@Injectable()
export class StreamService {
  private readonly signingSecret = process.env.STREAM_SIGNING_SECRET || "change_me_stream_signing_secret";
  private readonly tokenTtlSec = Number(process.env.STREAM_TOKEN_TTL_SECONDS || 30);
  private readonly jwt = new JwtService({
    secret: process.env.JWT_SECRET || "change_me_jwt"
  });

  constructor(private readonly prisma: PrismaService) {}

  async issuePlayback(releaseId: string, ipAddress: string, accessToken?: string, userAgent?: string) {
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        previewDuration: true,
        hlsPreviewPath: true,
        hlsFullPath: true,
        type: true,
        isPaid: true
      }
    });
    if (!release || !release.published) throw new UnauthorizedException("Release unavailable");

    const userId = this.extractUserId(accessToken);
    const entitled = userId ? await this.isEntitled(userId, releaseId, release.type === "FREE" || !release.isPaid) : false;
    const scope: StreamScope = entitled ? "FULL" : "PREVIEW";

    const playlistPath = scope === "FULL" ? (release.hlsFullPath ?? "") : (release.hlsPreviewPath ?? "");
    if (!playlistPath) throw new UnauthorizedException("Stream is not ready");

    const token = this.signToken({
      exp: Math.floor(Date.now() / 1000) + this.tokenTtlSec,
      releaseId,
      scope,
      ip: ipAddress
    });

    await this.prisma.streamEvent.create({
      data: {
        userId: userId ?? null,
        releaseId,
        scope,
        playlistPath,
        ipAddress,
        userAgent: userAgent ?? null
      }
    });

    return {
      releaseId: release.id,
      releaseSlug: release.slug,
      title: release.title,
      entitled,
      scope,
      previewDuration: release.previewDuration,
      token,
      expiresIn: this.tokenTtlSec,
      streamUrl: `/hls/${release.id}/${scope.toLowerCase()}/index.m3u8?token=${encodeURIComponent(token)}`
    };
  }

  verifySignedToken(token: string, ipAddress: string, releaseId: string, scope: "preview" | "full") {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const expectedSig = this.base64Url(
      createHmac("sha256", this.signingSecret).update(payloadB64).digest("base64")
    );
    if (!this.safeEqual(signature, expectedSig)) return false;

    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as StreamClaims;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp < now) return false;
    if (parsed.ip !== ipAddress) return false;
    if (parsed.releaseId !== releaseId) return false;
    if (parsed.scope !== scope.toUpperCase()) return false;
    return true;
  }

  private async isEntitled(userId: string, releaseId: string, isFree: boolean) {
    if (isFree) return true;
    const paid = await this.prisma.orderItem.findFirst({
      where: {
        releaseId,
        order: {
          userId,
          status: "completed"
        }
      },
      select: { id: true }
    });
    return Boolean(paid);
  }

  private extractUserId(accessToken?: string): string | null {
    if (!accessToken) return null;
    const token = accessToken.replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;
    try {
      const payload = this.jwt.verify<{ sub: string }>(token);
      return payload.sub;
    } catch {
      return null;
    }
  }

  private signToken(claims: StreamClaims) {
    const payloadB64 = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const signature = this.base64Url(
      createHmac("sha256", this.signingSecret).update(payloadB64).digest("base64")
    );
    return `${payloadB64}.${signature}`;
  }

  private base64Url(input: string) {
    return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  private safeEqual(a: string, b: string) {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }
}
