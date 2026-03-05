import cron from "node-cron";
import mysql from "mysql2/promise";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

// ─── Commission rates by subscription plan ────────────────────────────────────

function getPlatformCommission(plan) {
  switch (plan) {
    case "ARTIST_BASIC": return 0.20;
    case "ARTIST_PRO": return 0.10;
    case "AGENCY_START": return 0.20;
    case "AGENCY_PRO": return 0.10;
    case "ARTIST_FREE":
    default: return 0.30;
  }
}

const COMMISSION_RATE = Number(process.env.COMMISSION_RATE ?? "0.10");

function currentMonthKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function buildConnection() {
  const url = new URL(process.env.DATABASE_URL);
  return mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", "")
  });
}

// ─── Invoice PDF generation ───────────────────────────────────────────────────

function generateInvoicePdf(outputPath, payload) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(outputPath));
  doc.fontSize(18).text("Sauroraa Records - Invoice Artiste");
  doc.moveDown();
  doc.fontSize(12).text("Artist ID: " + payload.artistId);
  doc.text("Mois: " + payload.month);
  doc.text("Ventes brutes: " + payload.totalSales.toFixed(2) + " EUR");
  doc.text("Commission (" + (payload.commissionRate * 100).toFixed(0) + "%): " + payload.commission.toFixed(2) + " EUR");
  doc.text("Net du: " + payload.netDue.toFixed(2) + " EUR");
  doc.end();
}

// ─── Job 1 : Monthly revenue (1st of month midnight UTC) ─────────────────────

async function runMonthlyJob() {
  const month = currentMonthKey();
  const db = await buildConnection();
  try {
    const [rows] = await db.query(
      "SELECT r.artistId, COALESCE(SUM(oi.price), 0) AS totalSales" +
      " FROM OrderItem oi" +
      " INNER JOIN `Order` o ON o.id = oi.orderId" +
      " INNER JOIN `Release` r ON r.id = oi.releaseId" +
      " WHERE DATE_FORMAT(o.createdAt, '%Y-%m') = ?" +
      " GROUP BY r.artistId",
      [month]
    );

    for (const row of rows) {
      const totalSales = Number(row.totalSales || 0);
      let commissionRate = COMMISSION_RATE;
      try {
        const [planRows] = await db.query(
          "SELECT s.plan FROM Subscription s INNER JOIN Artist a ON a.userId = s.userId WHERE a.id = ? LIMIT 1",
          [row.artistId]
        );
        if (planRows?.length > 0) commissionRate = getPlatformCommission(planRows[0].plan);
      } catch { /* fallback to env rate */ }

      const commission = Number((totalSales * commissionRate).toFixed(2));
      const netDue = Number((totalSales - commission).toFixed(2));

      await db.query(
        "INSERT INTO ArtistRevenue (id, artistId, month, totalSales, commission, netDue, status)" +
        " VALUES (UUID(), ?, ?, ?, ?, ?, 'PENDING')" +
        " ON DUPLICATE KEY UPDATE totalSales = VALUES(totalSales), commission = VALUES(commission), netDue = VALUES(netDue)",
        [row.artistId, month, totalSales, commission, netDue]
      );

      const invoicePath = "/tmp/invoices/" + month + "-" + row.artistId + ".pdf";
      generateInvoicePdf(invoicePath, { artistId: row.artistId, month, totalSales, commission, netDue, commissionRate });

      await db.query(
        "INSERT INTO Invoice (id, artistId, periodMonth, grossAmount, commission, netAmount, filePath, status, createdAt)" +
        " VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'ISSUED', NOW())" +
        " ON DUPLICATE KEY UPDATE grossAmount = VALUES(grossAmount), commission = VALUES(commission)," +
        "   netAmount = VALUES(netAmount), filePath = VALUES(filePath), status = 'ISSUED'",
        [row.artistId, month, totalSales, commission, netDue, invoicePath]
      );
    }
    console.log("[cron] monthly-revenue OK — " + month + ", artists: " + rows.length);
  } finally {
    await db.end();
  }
}

// ─── Job 2 : Auto-publish scheduled releases (every 15 min) ──────────────────

async function runScheduledPublish() {
  const db = await buildConnection();
  try {
    const [schedules] = await db.query(
      "SELECT rs.id AS scheduleId, rs.releaseId" +
      " FROM ReleaseSchedule rs" +
      " INNER JOIN `Release` r ON r.id = rs.releaseId" +
      " WHERE rs.autoPublish = 1 AND rs.publishedAt IS NULL AND rs.scheduledAt <= NOW() AND r.published = 0"
    );

    for (const row of schedules) {
      await db.query(
        "UPDATE `Release` SET published = 1, processingStatus = 'PUBLISHED' WHERE id = ?",
        [row.releaseId]
      );
      await db.query(
        "UPDATE ReleaseSchedule SET publishedAt = NOW() WHERE id = ?",
        [row.scheduleId]
      );

      // Notify followers
      const [artistRows] = await db.query(
        "SELECT a.id AS artistId, r.title FROM Artist a INNER JOIN `Release` r ON r.artistId = a.id WHERE r.id = ? LIMIT 1",
        [row.releaseId]
      );
      if (artistRows?.length > 0) {
        const artistId = artistRows[0].artistId;
        const title = String(artistRows[0].title).replace(/'/g, "\\'");
        const [followers] = await db.query("SELECT followerId FROM Follow WHERE artistId = ?", [artistId]);
        if (followers?.length > 0) {
          const vals = followers.map((f) =>
            "(UUID(), '" + f.followerId + "', 'NEW_RELEASE', 'Nouvelle release : " + title + "', '" + row.releaseId + "', NOW())"
          ).join(",");
          await db.query("INSERT INTO Notification (id, userId, type, body, releaseId, createdAt) VALUES " + vals);
        }
      }
      console.log("[cron] auto-published " + row.releaseId);
    }
    if (schedules.length > 0) console.log("[cron] scheduled-publish OK — " + schedules.length + " release(s)");
  } finally {
    await db.end();
  }
}

// ─── Job 3 : Upload bot validation (every 5 min) ─────────────────────────────
// Validates PENDING releases: metadata checks + anti-spam.
// Publishes valid ones automatically; flags bad ones for staff review.

async function runUploadBotValidation() {
  const db = await buildConnection();
  try {
    const [pending] = await db.query(
      "SELECT id, title, genre, bpm, audioPath, coverPath, artistId, hlsReady" +
      " FROM `Release` WHERE processingStatus = 'PENDING' AND published = 0 LIMIT 20"
    );

    for (const row of pending) {
      const issues = [];
      if (!row.title || row.title.trim().length < 2) issues.push("titre invalide");
      if (!row.genre) issues.push("genre manquant");
      if (!row.audioPath) issues.push("audio manquant");
      if (!row.coverPath) issues.push("cover manquante");
      if (row.bpm && (Number(row.bpm) < 40 || Number(row.bpm) > 300)) issues.push("BPM hors plage");

      // Anti-spam: >10 uploads this week from same artist
      const [spamCheck] = await db.query(
        "SELECT COUNT(*) AS cnt FROM `Release` WHERE artistId = ? AND createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [row.artistId]
      );
      if (Number(spamCheck?.[0]?.cnt) > 10) issues.push("upload massif detecte");

      const isValid = issues.length === 0;
      await db.query(
        "UPDATE `Release` SET processingStatus = ? WHERE id = ?",
        [isValid ? "VALIDATED" : "NEEDS_REVIEW", row.id]
      );

      if (isValid && !row.hlsReady) {
        // Auto-publish immediately if HLS not required
        await db.query(
          "UPDATE `Release` SET published = 1, processingStatus = 'PUBLISHED' WHERE id = ?",
          [row.id]
        );
        console.log("[cron] bot-validated & published " + row.id);
      } else if (!isValid) {
        // Flag for staff review via ContentReport
        await db.query(
          "INSERT INTO ContentReport (id, reporterId, targetType, releaseId, reason, details, botScore, status, createdAt, updatedAt)" +
          " SELECT UUID(), u.id, 'RELEASE', ?, 'BOT_VALIDATION_FAILED', ?, 80, 'STAFF_REVIEW', NOW(), NOW()" +
          " FROM User u WHERE u.role = 'ADMIN' LIMIT 1",
          [row.id, "Problemes: " + issues.join(", ")]
        );
        console.log("[cron] bot-flagged " + row.id + ": " + issues.join(", "));
      }
    }
    if (pending.length > 0) console.log("[cron] bot-validation OK — " + pending.length + " checked");
  } finally {
    await db.end();
  }
}

// ─── Job 4 : Artist trust score update (hourly) ───────────────────────────────
// Score: base 50 + age + followers + sales + verified bonus - report penalty

async function runTrustScoreUpdate() {
  const db = await buildConnection();
  try {
    const [artists] = await db.query(
      "SELECT a.id, a.isVerified, u.createdAt AS userCreatedAt," +
      " COUNT(DISTINCT f.id) AS followers," +
      " COUNT(DISTINCT oi.id) AS sales," +
      " COUNT(DISTINCT cr.id) AS reportCount" +
      " FROM Artist a" +
      " INNER JOIN User u ON u.id = a.userId" +
      " LEFT JOIN Follow f ON f.artistId = a.id" +
      " LEFT JOIN `Release` rel ON rel.artistId = a.id" +
      " LEFT JOIN OrderItem oi ON oi.releaseId = rel.id" +
      " LEFT JOIN ContentReport cr ON cr.releaseId = rel.id AND cr.status != 'CLOSED'" +
      " GROUP BY a.id, a.isVerified, u.createdAt"
    );

    for (const row of artists) {
      const ageMonths = Math.floor(
        (Date.now() - new Date(row.userCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      let score = 50;
      score += Math.min(ageMonths * 2, 20);       // +20 max — anciennete
      score += Math.min(row.followers * 0.5, 15); // +15 max — followers
      score += Math.min(row.sales * 2, 10);        // +10 max — ventes
      if (row.isVerified) score += 15;             // +15 — verifie
      score -= Math.min(row.reportCount * 5, 30);  // -30 max — reports
      score = Math.max(0, Math.min(100, Math.round(score)));

      await db.query(
        "INSERT INTO ArtistTrustScore (id, artistId, score, updatedAt) VALUES (UUID(), ?, ?, NOW())" +
        " ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW()",
        [row.id, score]
      );
    }
    console.log("[cron] trust-score OK — " + artists.length + " artists");
  } finally {
    await db.end();
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

cron.schedule("0 0 1 * *", async () => {
  try { await runMonthlyJob(); }
  catch (e) { console.error("[cron] monthly-revenue FAILED", e); }
});

cron.schedule("*/15 * * * *", async () => {
  try { await runScheduledPublish(); }
  catch (e) { console.error("[cron] scheduled-publish FAILED", e); }
});

cron.schedule("*/5 * * * *", async () => {
  try { await runUploadBotValidation(); }
  catch (e) { console.error("[cron] bot-validation FAILED", e); }
});

cron.schedule("0 * * * *", async () => {
  try { await runTrustScoreUpdate(); }
  catch (e) { console.error("[cron] trust-score FAILED", e); }
});

console.log("[cron-service] started — 4 jobs scheduled");
console.log("  monthly-revenue   : 0 0 1 * *   (1er du mois)");
console.log("  scheduled-publish : */15 * * * * (toutes les 15 min)");
console.log("  bot-validation    : */5 * * * *  (toutes les 5 min)");
console.log("  trust-score       : 0 * * * *    (toutes les heures)");
