import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: { user?: { userId?: string } }) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException("Invalid user");
    return this.authService.logout(userId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user?: unknown }) {
    return req.user;
  }
}
