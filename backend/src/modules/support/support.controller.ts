import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import {
  SupportMessageAuthorType,
  SupportTicketPriority,
  SupportTicketStatus,
  UserRole
} from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

type AuthUser = {
  userId: string;
  role: UserRole;
};

class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  message!: string;
}

class CreateSupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

class UpdateSupportTicketDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

const TICKET_INCLUDE = {
  user: { select: { id: true, email: true, role: true } },
  assignedTo: { select: { id: true, email: true, role: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, email: true, role: true } } }
  }
};

function isAgent(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.STAFF;
}

function buildBotReply(message: string) {
  const text = message.toLowerCase();
  if (text.includes("paiement") || text.includes("payment") || text.includes("stripe")) {
    return "Merci. Pour un souci paiement, verifiez d'abord votre historique de commandes puis envoyez le numero de commande ici.";
  }
  if (text.includes("upload") || text.includes("audio") || text.includes("cover")) {
    return "Je peux aider sur les uploads: confirmez le type de fichier, la taille, puis l'heure exacte de l'erreur pour diagnostic rapide.";
  }
  if (text.includes("release") || text.includes("catalog") || text.includes("home")) {
    return "Bien recu. Donnez le slug de la release et la page concernee (home, catalog, release) pour que le support verifie.";
  }
  if (text.includes("login") || text.includes("auth") || text.includes("mot de passe")) {
    return "Pour un probleme de connexion, indiquez email du compte, navigateur et heure du test. Ne partagez pas votre mot de passe.";
  }
  return "Ticket recu. Un agent va prendre le relais. Vous pouvez ajouter captures d'ecran, URL et etapes de reproduction.";
}

@Controller("support")
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("tickets/mine")
  async listMine(@Req() req: Request & { user?: AuthUser }) {
    return this.prisma.supportTicket.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        assignedTo: { select: { id: true, email: true, role: true } },
        _count: { select: { messages: true } }
      }
    });
  }

  @Get("tickets/queue")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listQueue(@Query("status") status?: SupportTicketStatus) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        user: { select: { id: true, email: true, role: true } },
        assignedTo: { select: { id: true, email: true, role: true } },
        _count: { select: { messages: true } }
      }
    });
  }

  @Post("tickets")
  async createTicket(
    @Body() dto: CreateSupportTicketDto,
    @Req() req: Request & { user?: AuthUser }
  ) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: dto.subject.trim(),
        category: dto.category?.trim(),
        priority: dto.priority ?? SupportTicketPriority.NORMAL,
        userId: req.user!.userId,
        messages: {
          create: [
            {
              body: dto.message.trim(),
              authorType: SupportMessageAuthorType.USER,
              authorId: req.user!.userId
            },
            {
              body: buildBotReply(dto.message),
              authorType: SupportMessageAuthorType.BOT
            }
          ]
        }
      },
      include: TICKET_INCLUDE
    });

    return ticket;
  }

  @Get("tickets/:id")
  async getTicket(
    @Param("id") id: string,
    @Req() req: Request & { user?: AuthUser }
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: TICKET_INCLUDE
    });
    if (!ticket) throw new NotFoundException("Ticket not found");

    const role = req.user!.role;
    if (!isAgent(role) && ticket.userId !== req.user!.userId) {
      throw new ForbiddenException("Not allowed");
    }

    return ticket;
  }

  @Post("tickets/:id/messages")
  async addMessage(
    @Param("id") id: string,
    @Body() dto: CreateSupportMessageDto,
    @Req() req: Request & { user?: AuthUser }
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    const role = req.user!.role;
    const agent = isAgent(role);
    if (!agent && ticket.userId !== req.user!.userId) {
      throw new ForbiddenException("Not allowed");
    }
    if (ticket.status === SupportTicketStatus.CLOSED && !agent) {
      throw new BadRequestException("Ticket is closed");
    }

    await this.prisma.supportMessage.create({
      data: {
        ticketId: id,
        body: dto.body.trim(),
        authorId: req.user!.userId,
        authorType: agent ? SupportMessageAuthorType.AGENT : SupportMessageAuthorType.USER
      }
    });

    if (!agent) {
      await this.prisma.supportMessage.create({
        data: {
          ticketId: id,
          body: buildBotReply(dto.body),
          authorType: SupportMessageAuthorType.BOT
        }
      });
    }

    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: agent ? SupportTicketStatus.WAITING_USER : SupportTicketStatus.IN_PROGRESS,
        updatedAt: new Date()
      }
    });

    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: TICKET_INCLUDE
    });
  }

  @Patch("tickets/:id")
  async updateTicket(
    @Param("id") id: string,
    @Body() dto: UpdateSupportTicketDto,
    @Req() req: Request & { user?: AuthUser }
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    const role = req.user!.role;
    const agent = isAgent(role);
    const owner = ticket.userId === req.user!.userId;
    if (!agent && !owner) throw new ForbiddenException("Not allowed");

    if (!agent && dto.assignedToId) {
      throw new ForbiddenException("Cannot assign ticket");
    }
    if (!agent && dto.priority) {
      throw new ForbiddenException("Cannot change priority");
    }
    if (!agent && dto.status && dto.status !== SupportTicketStatus.CLOSED) {
      throw new ForbiddenException("You can only close your ticket");
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: dto.status,
        priority: dto.priority,
        assignedToId: dto.assignedToId,
        closedAt:
          dto.status === SupportTicketStatus.CLOSED || dto.status === SupportTicketStatus.RESOLVED
            ? new Date()
            : null
      },
      include: TICKET_INCLUDE
    });

    return updated;
  }
}

