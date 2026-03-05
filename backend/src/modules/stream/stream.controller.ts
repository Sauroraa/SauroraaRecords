import { Controller, Get, Headers, HttpCode, Ip, Param, Query, Req, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { StreamService } from "./stream.service";

@Controller("stream")
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get("token/:releaseId")
  async createToken(
    @Param("releaseId") releaseId: string,
    @Ip() ipAddress: string,
    @Headers("authorization") authorization?: string,
    @Req() req?: Request
  ) {
    return this.streamService.issuePlayback(
      releaseId,
      ipAddress,
      authorization,
      req?.headers["user-agent"]
    );
  }

  @Get("verify")
  @HttpCode(204)
  verify(
    @Query("token") token: string,
    @Query("releaseId") releaseId: string,
    @Query("scope") scope: "preview" | "full",
    @Ip() ipAddress: string
  ) {
    if (!token || !releaseId || !scope) {
      throw new UnauthorizedException("Missing stream verification query");
    }

    const ok = this.streamService.verifySignedToken(token, ipAddress, releaseId, scope);
    if (!ok) throw new UnauthorizedException("Invalid or expired stream token");
    return undefined;
  }
}
