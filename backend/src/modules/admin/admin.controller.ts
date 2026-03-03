import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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

class UpdateAgencyDto {
  displayName?: string;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Users ─────────────────────────────────────────────────────────────────

  @Get("users")
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Patch("users/:id/role")
  async changeRole(@Param("id") id: string, @Body() dto: ChangeRoleDto) {
    if (!Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException("Invalid role");
    }
    const user = await this.prisma.user.update({ where: { id }, data: { role: dto.role } });
    if (dto.role === UserRole.AGENCY) {
      await this.prisma.agency.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id }
      });
    }
    if (dto.role === UserRole.ARTIST) {
      await this.prisma.artist.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id }
      });
    }
    return user;
  }

  // ─── Agencies ──────────────────────────────────────────────────────────────

  @Get("agencies")
  async listAgencies() {
    return this.prisma.agency.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, createdAt: true }
        },
        _count: { select: { artists: true, invitations: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get("agencies/:id")
  async getAgency(@Param("id") id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        artists: {
          include: {
            artist: {
              include: {
                user: { select: { email: true } },
                _count: { select: { releases: true, dubpacks: true, followers: true } }
              }
            }
          }
        },
        invitations: {
          where: { accepted: false },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!agency) throw new NotFoundException("Agency not found");
    return agency;
  }

  @Patch("agencies/:id")
  async updateAgency(@Param("id") id: string, @Body() dto: UpdateAgencyDto) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) throw new NotFoundException("Agency not found");
    return this.prisma.agency.update({ where: { id }, data: { displayName: dto.displayName } });
  }

  @Delete("agencies/:id")
  async deleteAgency(@Param("id") id: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) throw new NotFoundException("Agency not found");
    await this.prisma.user.update({
      where: { id: agency.userId },
      data: { role: UserRole.CLIENT }
    });
    return this.prisma.agency.delete({ where: { id } });
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  @Get("invoices")
  async listInvoices() {
    return this.prisma.artistRevenue.findMany({
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Patch("invoices/:id/paid")
  async markInvoicePaid(@Param("id") id: string) {
    return this.prisma.artistRevenue.update({ where: { id }, data: { status: "PAID" } });
  }
}
