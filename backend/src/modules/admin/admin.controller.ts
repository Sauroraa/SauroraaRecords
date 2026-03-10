import {
  Body, Controller, Delete, Get, NotFoundException,
  Patch, Param, BadRequestException, Query, UseGuards
} from "@nestjs/common";
import { IsEnum } from "class-validator";
import { SubscriptionPlan } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/roles.guard";
import { Roles } from "../../common/roles.decorator";

class ChangeRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
class UpdateAgencyDto { displayName?: string; }
class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  hasSociete?: boolean;
  societeName?: string;
  vatNumber?: string;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Users ─────────────────────────────────────────────────────────────────

  @Get("users")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listUsers(@Query("search") search?: string) {
    const normalized = search?.trim();
    return this.prisma.user.findMany({
      where: normalized
        ? {
            OR: [
              { email: { contains: normalized } },
              { firstName: { contains: normalized } },
              { lastName: { contains: normalized } }
            ]
          }
        : undefined,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isStaff: true, createdAt: true, country: true,
        warningCount: true, strikeCount: true, suspended: true,
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: "desc" },
      take: normalized ? 25 : undefined
    });
  }

  @Get("users/:id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getUser(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, createdAt: true, dateOfBirth: true,
        warningCount: true, strikeCount: true, suspended: true, suspensionReason: true,
        addressLine1: true, addressLine2: true, postalCode: true,
        city: true, country: true, hasSociete: true,
        societeName: true, vatNumber: true, billingAddress: true,
        artist: {
          select: {
            id: true, displayName: true, bio: true, avatar: true,
            isVerified: true, verifiedAt: true, instagramUrl: true,
            soundcloudUrl: true, discordUrl: true, websiteUrl: true,
            _count: { select: { releases: true, followers: true } },
            agencyLinks: { include: { agency: { select: { displayName: true } } }, take: 1 }
          }
        },
        agency: { select: { id: true, displayName: true, _count: { select: { artists: true } } } },
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: { include: { release: { select: { title: true } }, dubpack: { select: { title: true } } } } }
        }
      }
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  @Patch("users/:id")
  @Roles(UserRole.ADMIN)
  async updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    if (dto.role && !Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException("Invalid role");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country,
        hasSociete: dto.hasSociete,
        societeName: dto.societeName,
        vatNumber: dto.vatNumber
      }
    });

    // Auto-create artist/agency profile if needed
    if (dto.role === UserRole.AGENCY) {
      await this.prisma.agency.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
    }
    if (dto.role === UserRole.ARTIST) {
      await this.prisma.artist.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
    }

    return updated;
  }

  @Patch("users/:id/role")
  @Roles(UserRole.ADMIN)
  async changeRole(@Param("id") id: string, @Body() dto: ChangeRoleDto) {
    if (!Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException("Invalid role");
    }
    const user = await this.prisma.user.update({ where: { id }, data: { role: dto.role } });
    if (dto.role === UserRole.AGENCY) {
      await this.prisma.agency.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
    }
    if (dto.role === UserRole.ARTIST) {
      await this.prisma.artist.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
    }
    return user;
  }

  @Patch("users/:id/staff")
  @Roles(UserRole.ADMIN)
  async toggleStaff(@Param("id") id: string, @Body() dto: { isStaff: boolean }) {
    const user = await this.prisma.user.update({ where: { id }, data: { isStaff: dto.isStaff } });
    return { id: user.id, email: user.email, role: user.role, isStaff: user.isStaff };
  }

  @Delete("users/:id")
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) throw new BadRequestException("Cannot delete an admin");
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  // ─── Artists ───────────────────────────────────────────────────────────────

  @Get("artists")
  @Roles(UserRole.ADMIN)
  async listArtists() {
    return this.prisma.artist.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true, createdAt: true } },
        _count: { select: { releases: true, followers: true } },
        agencyLinks: { include: { agency: { select: { displayName: true } } }, take: 1 }
      },
      orderBy: { user: { createdAt: "desc" } }
    });
  }

  @Patch("artists/:id/verify")
  @Roles(UserRole.ADMIN)
  async verifyArtist(@Param("id") id: string, @Body() dto: { verified: boolean }) {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) throw new NotFoundException("Artist not found");
    return this.prisma.artist.update({
      where: { id },
      data: {
        isVerified: dto.verified,
        verifiedAt: dto.verified ? new Date() : null
      }
    });
  }

  // ─── Agencies ──────────────────────────────────────────────────────────────

  @Get("agencies")
  @Roles(UserRole.ADMIN)
  async listAgencies() {
    return this.prisma.agency.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, createdAt: true } },
        _count: { select: { artists: true, invitations: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get("agencies/:id")
  @Roles(UserRole.ADMIN)
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
        invitations: { where: { accepted: false }, orderBy: { createdAt: "desc" } }
      }
    });
    if (!agency) throw new NotFoundException("Agency not found");
    return agency;
  }

  @Patch("agencies/:id")
  @Roles(UserRole.ADMIN)
  async updateAgency(@Param("id") id: string, @Body() dto: UpdateAgencyDto) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) throw new NotFoundException("Agency not found");
    return this.prisma.agency.update({ where: { id }, data: { displayName: dto.displayName } });
  }

  @Delete("agencies/:id")
  @Roles(UserRole.ADMIN)
  async deleteAgency(@Param("id") id: string) {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) throw new NotFoundException("Agency not found");
    await this.prisma.user.update({ where: { id: agency.userId }, data: { role: UserRole.CLIENT } });
    return this.prisma.agency.delete({ where: { id } });
  }

  // ─── Revenue ────────────────────────────────────────────────────────────────

  @Get("revenue")
  @Roles(UserRole.ADMIN)
  async listRevenue() {
    const rows = await this.prisma.artistRevenue.findMany({
      include: { artist: { include: { user: { select: { email: true } } } } },
      orderBy: { month: "desc" }
    });
    return rows.map((r) => ({
      id: r.id,
      artistId: r.artistId,
      artistName: r.artist.displayName ?? r.artist.user.email,
      gross: Number(r.totalSales),
      net: Number(r.netDue),
      label: Number(r.commission),
      month: r.month,
      status: r.status
    }));
  }

  // ─── Invoices ──────────────────────────────────────────────────────────────

  @Get("invoices")
  @Roles(UserRole.ADMIN)
  async listInvoices() {
    return this.prisma.artistRevenue.findMany({
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Patch("invoices/:id/paid")
  @Roles(UserRole.ADMIN)
  async markInvoicePaid(@Param("id") id: string) {
    return this.prisma.artistRevenue.update({ where: { id }, data: { status: "PAID" } });
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  @Get("subscriptions")
  @Roles(UserRole.ADMIN)
  async listSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Patch("users/:id/subscription")
  @Roles(UserRole.ADMIN)
  async upsertSubscription(
    @Param("id") id: string,
    @Body() dto: { plan: string; status?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (!Object.values(SubscriptionPlan).includes(dto.plan as SubscriptionPlan)) {
      throw new BadRequestException("Invalid plan");
    }
    return this.prisma.subscription.upsert({
      where: { userId: id },
      update: { plan: dto.plan as SubscriptionPlan, status: dto.status ?? "active" },
      create: { userId: id, plan: dto.plan as SubscriptionPlan, status: dto.status ?? "active" }
    });
  }

  @Delete("users/:id/subscription")
  @Roles(UserRole.ADMIN)
  async deleteSubscription(@Param("id") id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId: id } });
    if (!sub) throw new NotFoundException("No subscription found");
    await this.prisma.subscription.delete({ where: { userId: id } });
    return { success: true };
  }

  @Get("comments")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listComments() {
    return this.prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        release: { select: { id: true, title: true, slug: true } },
        dubpack: { select: { id: true, title: true, slug: true } }
      }
    });
  }
}
