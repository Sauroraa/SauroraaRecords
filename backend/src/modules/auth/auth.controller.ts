import { Body, Controller, ForbiddenException, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, RefreshDto } from "./dto";

const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  const baseCookieOptions = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: isProd,
    ...(cookieDomain ? { domain: cookieDomain } : {})
  };
  res.cookie(COOKIE_ACCESS, accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000
  });
  res.cookie(COOKIE_REFRESH, refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const host = req.headers.host ?? "";
    const origin = req.headers.origin ?? "";
    if (host.includes("music.sauroraarecords.be") || origin.includes("music.sauroraarecords.be")) {
      const redirect = process.env.RECORDS_PUBLIC_URL || "https://sauroraarecords.be/register";
      throw new ForbiddenException(`Registration is only available on SauroraaRecords: ${redirect}`);
    }

    const tokens = await this.authService.register(dto);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  @Post("refresh")
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = dto.refreshToken || (req.cookies as Record<string, string>)?.[COOKIE_REFRESH];
    if (!refreshToken) throw new UnauthorizedException("No refresh token");
    const tokens = await this.authService.refresh(refreshToken);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
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
    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    const baseCookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProd,
      ...(cookieDomain ? { domain: cookieDomain } : {})
    };
    res.clearCookie(COOKIE_ACCESS, baseCookieOptions);
    res.clearCookie(COOKIE_REFRESH, baseCookieOptions);
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user?: unknown }) {
    return req.user;
  }

  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
