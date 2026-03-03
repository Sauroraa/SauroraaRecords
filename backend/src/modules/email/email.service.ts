import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendWelcome(email: string, firstName?: string) {
    const name = firstName || email.split("@")[0];
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sauroraa Records" <noreply@sauroraa.be>',
        to: email,
        subject: "Bienvenue sur Sauroraa Records",
        html: this.welcomeTemplate(name)
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send welcome email to ${email}: ${String(err)}`);
    }
  }

  async sendInvitation(email: string, agencyName: string, token: string) {
    const url = process.env.FRONTEND_URL || "https://sauroraarecords.be";
    const inviteUrl = `${url}/agency/invite/${token}`;
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sauroraa Records" <noreply@sauroraa.be>',
        to: email,
        subject: `Invitation à rejoindre ${agencyName} sur Sauroraa Records`,
        html: this.invitationTemplate(email, agencyName, inviteUrl)
      });
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send invitation email to ${email}: ${String(err)}`);
    }
  }

  async sendPasswordChanged(email: string, firstName?: string) {
    const name = firstName || email.split("@")[0];
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sauroraa Records" <noreply@sauroraa.be>',
        to: email,
        subject: "Ton mot de passe a été modifié",
        html: this.passwordChangedTemplate(name)
      });
    } catch (err) {
      this.logger.error(`Failed to send password-changed email to ${email}: ${String(err)}`);
    }
  }

  private welcomeTemplate(name: string): string {
    const url = process.env.FRONTEND_URL || "https://sauroraarecords.be";
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Sauroraa Records</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 24px;">

    <!-- Logo / header -->
    <div style="text-align:center;margin-bottom:36px;">
      <h1 style="color:#f5f3ef;font-size:26px;margin:0;font-weight:700;letter-spacing:-0.5px;">
        Sauroraa Records
      </h1>
      <p style="color:#7c3aed;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:8px 0 0;">
        Plateforme musicale indépendante
      </p>
    </div>

    <!-- Main card -->
    <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <p style="color:rgba(245,243,239,0.5);font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">
        Bienvenue
      </p>
      <h2 style="color:#f5f3ef;font-size:24px;margin:0 0 16px;font-weight:700;">
        Salut ${name} 👋
      </h2>
      <p style="color:rgba(245,243,239,0.65);line-height:1.75;margin:0 0 28px;font-size:15px;">
        Ton compte Sauroraa Records a été créé avec succès. Tu peux dès maintenant accéder à la plateforme,
        explorer les releases &amp; dubpacks, ou commencer à publier ta musique.
      </p>

      <a href="${url}/dashboard"
         style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;
                letter-spacing:0.02em;">
        Accéder à mon espace →
      </a>
    </div>

    <!-- Quick links -->
    <div style="margin-top:16px;display:flex;gap:12px;">
      <a href="${url}/releases"
         style="flex:1;text-align:center;padding:14px;background:#111111;
                border:1px solid rgba(255,255,255,0.06);border-radius:12px;
                color:rgba(245,243,239,0.6);text-decoration:none;font-size:13px;">
        🎵 Releases
      </a>
      <a href="${url}/dubpacks"
         style="flex:1;text-align:center;padding:14px;background:#111111;
                border:1px solid rgba(255,255,255,0.06);border-radius:12px;
                color:rgba(245,243,239,0.6);text-decoration:none;font-size:13px;">
        📦 Dubpacks
      </a>
      <a href="${url}/pricing"
         style="flex:1;text-align:center;padding:14px;background:#111111;
                border:1px solid rgba(255,255,255,0.06);border-radius:12px;
                color:rgba(245,243,239,0.6);text-decoration:none;font-size:13px;">
        ⚡ Plans
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;text-align:center;">
      <p style="color:rgba(245,243,239,0.2);font-size:11px;margin:0 0 6px;">
        Si tu n'as pas créé ce compte, tu peux ignorer cet email.
      </p>
      <p style="color:rgba(245,243,239,0.2);font-size:11px;margin:0;">
        Questions ? <a href="mailto:contact@sauroraa.be"
                       style="color:#7c3aed;text-decoration:none;">contact@sauroraa.be</a>
      </p>
      <p style="color:rgba(245,243,239,0.12);font-size:10px;margin:16px 0 0;">
        © ${new Date().getFullYear()} SauroraaSNC — BE1031.598.463 — Belgique
      </p>
    </div>

  </div>
</body>
</html>`;
  }

  private passwordChangedTemplate(name: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:36px;">
      <h1 style="color:#f5f3ef;font-size:26px;margin:0;font-weight:700;">Sauroraa Records</h1>
    </div>
    <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <h2 style="color:#f5f3ef;font-size:22px;margin:0 0 14px;">Mot de passe modifié</h2>
      <p style="color:rgba(245,243,239,0.65);line-height:1.75;margin:0 0 20px;font-size:15px;">
        Bonjour ${name},<br /><br />
        Ton mot de passe a été modifié avec succès le ${new Date().toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}.
      </p>
      <p style="color:rgba(245,243,239,0.5);font-size:13px;line-height:1.6;margin:0;">
        Si tu n'es pas à l'origine de ce changement, contacte-nous immédiatement à
        <a href="mailto:contact@sauroraa.be" style="color:#7c3aed;text-decoration:none;">contact@sauroraa.be</a>.
      </p>
    </div>
    <p style="color:rgba(245,243,239,0.15);font-size:10px;text-align:center;margin-top:20px;">
      © ${new Date().getFullYear()} SauroraaSNC — BE1031.598.463
    </p>
  </div>
</body>
</html>`;
  }

  private invitationTemplate(email: string, agencyName: string, inviteUrl: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation Sauroraa Records</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:36px;">
      <h1 style="color:#f5f3ef;font-size:26px;margin:0;font-weight:700;letter-spacing:-0.5px;">Sauroraa Records</h1>
      <p style="color:#7c3aed;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:8px 0 0;">Plateforme musicale indépendante</p>
    </div>
    <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <p style="color:rgba(245,243,239,0.5);font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Invitation</p>
      <h2 style="color:#f5f3ef;font-size:22px;margin:0 0 16px;font-weight:700;">Tu es invité(e) à rejoindre ${agencyName}</h2>
      <p style="color:rgba(245,243,239,0.65);line-height:1.75;margin:0 0 12px;font-size:15px;">
        L'agence <strong style="color:#f5f3ef;">${agencyName}</strong> t'invite à rejoindre leur roster sur Sauroraa Records.
      </p>
      <p style="color:rgba(245,243,239,0.5);font-size:13px;line-height:1.6;margin:0 0 28px;">
        En acceptant, tu rejoindras leur équipe en tant qu'artiste. Tu peux refuser en ignorant cet email.
        L'invitation expire dans <strong style="color:#f5f3ef;">7 jours</strong>.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;
                padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.02em;">
        Accepter l'invitation →
      </a>
      <p style="color:rgba(245,243,239,0.3);font-size:11px;margin:20px 0 0;">
        Ou copiez ce lien : <span style="color:#7c3aed;">${inviteUrl}</span>
      </p>
    </div>
    <div style="margin-top:20px;text-align:center;">
      <p style="color:rgba(245,243,239,0.2);font-size:11px;margin:0;">
        Cet email a été envoyé à ${email}. Si vous ne connaissez pas ${agencyName}, ignorez cet email.
      </p>
      <p style="color:rgba(245,243,239,0.12);font-size:10px;margin:10px 0 0;">
        © ${new Date().getFullYear()} SauroraaSNC — BE1031.598.463 — Belgique
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}
