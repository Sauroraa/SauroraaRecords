import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("api");
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: process.env.NODE_ENV === "production" ? undefined : false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
          mediaSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      }
    })
  );

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://sauroraarecords.be",
    "https://www.sauroraarecords.be",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ].filter((value): value is string => Boolean(value));

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"), false);
    },
    credentials: true
  });
  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
