import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  BadRequestException,
  UseGuards
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/roles.guard";
import { Roles } from "../../common/roles.decorator";

class ChangeRoleDto {
  role!: UserRole;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("users")
  async listUsers() {
    // include order count for display
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } }
    });
  }

  @Patch("users/:id/role")
  async changeRole(@Param("id") id: string, @Body() dto: ChangeRoleDto) {
    if (!Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException("Invalid role");
    }
    const user = await this.prisma.user.update({ where: { id }, data: { role: dto.role } });
    // if promoting to agency, ensure Agency record exists
    if (dto.role === UserRole.AGENCY) {
      await this.prisma.agency.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id }
      });
    }
    return user;
  }

  @Get("invoices")
  async listInvoices() {
    // reuse ArtistRevenue for invoices, join artist name
    return this.prisma.artistRevenue.findMany({
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Patch("invoices/:id/paid")
  async markInvoicePaid(@Param("id") id: string) {
    return this.prisma.artistRevenue.update({ where: { id }, data: { status: "PAID" } });
  }
}
