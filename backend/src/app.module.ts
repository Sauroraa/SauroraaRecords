import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { RolesGuard } from "./common/roles.guard";
import { PrismaService } from "./prisma.service";
import { ArtistsModule } from "./modules/artists/artists.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { DubpacksModule } from "./modules/dubpacks/dubpacks.module";
import { FollowsModule } from "./modules/follows/follows.module";
import { FreeDownloadsModule } from "./modules/free-downloads/free-downloads.module";
import { HealthModule } from "./modules/health/health.module";
import { JwtAuthGuard } from "./modules/auth/jwt-auth.guard";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PreordersModule } from "./modules/preorders/preorders.module";
import { PromoCodesModule } from "./modules/promo-codes/promo-codes.module";
import { RankingsModule } from "./modules/rankings/rankings.module";
import { ReleasesModule } from "./modules/releases/releases.module";
import { RevenueModule } from "./modules/revenue/revenue.module";
import { StripeModule } from "./modules/stripe/stripe.module";
import { TipsModule } from "./modules/tips/tips.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { AgencyModule } from "./modules/agency/agency.module";
import { AdminController } from "./modules/admin/admin.controller";
import { UploadModule } from "./modules/upload/upload.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100
      }
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    ReleasesModule,
    DubpacksModule,
    OrdersModule,
    RevenueModule,
    CommentsModule,
    FollowsModule,
    NotificationsModule,
    FreeDownloadsModule,
    StripeModule,
    UploadModule,
    PreordersModule,
    PromoCodesModule,
    TipsModule,
    RankingsModule,
    SubscriptionsModule,
    AgencyModule
  ],
  controllers: [AdminController],
  providers: [
    PrismaService,
    RolesGuard,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
