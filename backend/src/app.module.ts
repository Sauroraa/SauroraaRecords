import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RolesGuard } from "./common/roles.guard";
import { PrismaService } from "./prisma.service";
import { ArtistsModule } from "./modules/artists/artists.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/jwt-auth.guard";
import { HealthModule } from "./modules/health/health.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ReleasesModule } from "./modules/releases/releases.module";
import { RevenueModule } from "./modules/revenue/revenue.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    ReleasesModule,
    OrdersModule,
    RevenueModule
  ],
  providers: [PrismaService, RolesGuard, JwtAuthGuard]
})
export class AppModule {}
