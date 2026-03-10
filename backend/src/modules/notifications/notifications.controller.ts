import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@Req() req: Request & { user?: { userId: string } }) {
    return this.notifications.listForUser(req.user!.userId);
  }

  @Get("unread-count")
  async unreadCount(@Req() req: Request & { user?: { userId: string } }) {
    const unreadCount = await this.notifications.unreadCount(req.user!.userId);
    return { unreadCount };
  }

  @Patch(":id/read")
  async markRead(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    return this.notifications.markRead(req.user!.userId, id);
  }

  @Patch("read-all/all")
  async markAllRead(@Req() req: Request & { user?: { userId: string } }) {
    return this.notifications.markAllRead(req.user!.userId);
  }
}
