import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class LedgerQueryDto {
  @IsOptional()
  @IsString()
  month?: string;
}

@Controller("ledger")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LedgerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me/entries")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async myEntries(
    @Req() req: Request & { user?: { userId: string; role: UserRole } },
    @Query() query: LedgerQueryDto
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true }
    });
    if (!artist) return [];

    const month = query.month?.trim();
    let dateRange: { gte: Date; lt: Date } | undefined;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearText, monthText] = month.split("-");
      const year = Number(yearText);
      const monthIndex = Number(monthText) - 1;
      const gte = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
      const lt = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
      dateRange = { gte, lt };
    }

    return this.prisma.ledgerEntry.findMany({
      where: {
        artistId: artist.id,
        ...(dateRange ? { eventDate: dateRange } : {})
      },
      orderBy: { eventDate: "desc" }
    });
  }

  @Get("me/summary")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async mySummary(@Req() req: Request & { user?: { userId: string; role: UserRole } }) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true }
    });
    if (!artist) return { gross: 0, commission: 0, net: 0 };

    const entries = await this.prisma.ledgerEntry.findMany({
      where: { artistId: artist.id },
      select: { entryType: true, amount: true }
    });

    const gross = entries
      .filter((e) => e.entryType === "SALE_GROSS")
      .reduce((acc, row) => acc + Number(row.amount), 0);
    const commission = entries
      .filter((e) => e.entryType === "PLATFORM_COMMISSION")
      .reduce((acc, row) => acc + Number(row.amount), 0);
    const net = entries
      .filter((e) => e.entryType === "ARTIST_NET")
      .reduce((acc, row) => acc + Number(row.amount), 0);

    return {
      gross: Number(gross.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      net: Number(net.toFixed(2))
    };
  }
}
