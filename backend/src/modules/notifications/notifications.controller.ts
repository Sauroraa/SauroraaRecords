import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 50
    });
  }

  @Patch(":id/read")
  async markRead(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    await this.prisma.notification.updateMany({
      where: { id, userId: req.user!.userId },
      data: { isRead: true }
    });
    return { success: true };
  }

  @Patch("read-all/all")
  async markAllRead(@Req() req: Request & { user?: { userId: string } }) {
    await this.prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true }
    });
    return { success: true };
  }
}
