import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma.service";
import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException("Email already used");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, role: dto.role }
    });

    if (dto.role === UserRole.ARTIST) {
      await this.prisma.artist.create({ data: { userId: user.id } });
    }
    if (dto.role === UserRole.AGENCY) {
      // create an agency record for this user
      await this.prisma.agency.create({ data: { userId: user.id } });
    }

    return this.buildTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    return this.buildTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService
      .verifyAsync<{ sub: string; type?: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "change_me_refresh"
      })
      .catch(() => {
        throw new UnauthorizedException("Invalid refresh token");
      });

    if (payload.type !== "refresh") throw new UnauthorizedException("Invalid token type");
    const userId = payload.sub;

    const tokenRows = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const matched = await this.findMatchingToken(
      tokenRows.map((row) => row.tokenHash),
      refreshToken
    );
    if (!matched) throw new UnauthorizedException("Invalid refresh token");

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return this.buildTokens(user.id, user.email, user.role);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { success: true };
  }

  private async buildTokens(sub: string, email: string, role: UserRole) {
    const accessToken = await this.jwtService.signAsync(
      { sub, email, role },
      {
        secret: process.env.JWT_SECRET || "change_me_jwt",
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
      }
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub, email, role, type: "refresh" },
      {
        secret: process.env.JWT_REFRESH_SECRET || "change_me_refresh",
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
      }
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: sub,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: { id: sub, email, role }
    };
  }

  private async findMatchingToken(hashes: string[], candidate: string) {
    for (const hash of hashes) {
      const ok = await bcrypt.compare(candidate, hash);
      if (ok) return true;
    }
    return false;
  }
}
