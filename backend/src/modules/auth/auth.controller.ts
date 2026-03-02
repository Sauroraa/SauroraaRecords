import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_ACCESS, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 15 * 60 * 1000
  });
  res.cookie(COOKIE_REFRESH, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: tokens.user };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: tokens.user };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies as Record<string, string>)?.[COOKIE_REFRESH];
    if (!refreshToken) throw new UnauthorizedException("No refresh token");
    const tokens = await this.authService.refresh(refreshToken);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user: tokens.user };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request & { user?: { userId?: string } },
    @Res({ passthrough: true }) res: Response
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException("Invalid user");
    await this.authService.logout(userId);
    res.clearCookie(COOKIE_ACCESS);
    res.clearCookie(COOKIE_REFRESH);
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user?: unknown }) {
    return req.user;
  }
}
