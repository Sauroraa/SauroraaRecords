import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

type NotificationInput = {
  userId: string;
  type: string;
  body: string;
  releaseId?: string | null;
  dubpackId?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: NotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        body: input.body,
        releaseId: input.releaseId ?? null,
        dubpackId: input.dubpackId ?? null
      }
    });
  }

  async listForUser(userId: string) {
    const [notifications, broadcasts] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
        take: 100
      }),
      this.prisma.artistBroadcastRecipient.findMany({
        where: { userId },
        include: {
          broadcast: {
            include: {
              artist: { select: { id: true, displayName: true, slug: true } }
            }
          }
        },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        take: 50
      })
    ]);

    const normalizedNotifications = notifications.map((item) => ({
      id: item.id,
      type: item.type,
      body: item.body,
      isRead: item.isRead,
      createdAt: item.createdAt,
      releaseId: item.releaseId,
      dubpackId: item.dubpackId,
      sourceType: "notification" as const,
      link:
        item.releaseId ? `/release/${item.releaseId}` :
        item.dubpackId ? `/dubpack/${item.dubpackId}` :
        "/notifications"
    }));

    const normalizedBroadcasts = broadcasts.map((item) => ({
      id: item.id,
      type: "ARTIST_BROADCAST",
      body: item.broadcast.title ? `${item.broadcast.title} — ${item.broadcast.body}` : item.broadcast.body,
      isRead: Boolean(item.readAt),
      createdAt: item.createdAt,
      releaseId: null,
      dubpackId: null,
      sourceType: "broadcast" as const,
      link: item.broadcast.artist.slug ? `/artist/${item.broadcast.artist.slug}` : "/notifications"
    }));

    return [...normalizedNotifications, ...normalizedBroadcasts]
      .sort((a, b) => {
        if (a.isRead !== b.isRead) return Number(a.isRead) - Number(b.isRead);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 100);
  }

  async unreadCount(userId: string) {
    const [notifications, broadcasts] = await Promise.all([
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.artistBroadcastRecipient.count({ where: { userId, readAt: null } })
    ]);

    return notifications + broadcasts;
  }

  async markRead(userId: string, id: string) {
    const [notificationResult, broadcastResult] = await Promise.all([
      this.prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true }
      }),
      this.prisma.artistBroadcastRecipient.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() }
      })
    ]);

    return { success: notificationResult.count > 0 || broadcastResult.count > 0 };
  }

  async markAllRead(userId: string) {
    await Promise.all([
      this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      }),
      this.prisma.artistBroadcastRecipient.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() }
      })
    ]);

    return { success: true };
  }
}
