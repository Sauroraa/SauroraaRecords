import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("revenue")
export class RevenueController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("artist/:artistId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  byArtist(@Param("artistId") artistId: string) {
    return this.prisma.artistRevenue.findMany({
      where: { artistId },
      orderBy: { month: "desc" }
    });
  }

  @Get("label/summary")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async labelSummary() {
    const rows = await this.prisma.artistRevenue.findMany();
    const totalSales = rows.reduce((sum, row) => sum + Number(row.totalSales), 0);
    const commission = rows.reduce((sum, row) => sum + Number(row.commission), 0);
    const netDue = rows.reduce((sum, row) => sum + Number(row.netDue), 0);
    return { totalSales, commission, netDue };
  }
}
