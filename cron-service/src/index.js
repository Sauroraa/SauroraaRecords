import cron from "node-cron";
import mysql from "mysql2/promise";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

// Computes platform commission rate based on subscription plan string.
// This duplicates logic from backend/utils/commission.ts but keeps cron-service standalone.
function getPlatformCommission(plan) {
  switch (plan) {
    case "ARTIST_BASIC":
      return 0.20;
    case "ARTIST_PRO":
      return 0.10;
    case "AGENCY_START":
      return 0.20;
    case "AGENCY_PRO":
      return 0.10;
    case "ARTIST_FREE":
    default:
      return 0.30;
  }
}

// default rate if no plan available
let COMMISSION_RATE = Number(process.env.COMMISSION_RATE ?? "0.10");

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

function generateInvoicePdf(outputPath, payload) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(outputPath));
  doc.fontSize(18).text("Sauroraa Records - Artist Invoice");
  doc.moveDown();
  doc.fontSize(12).text(`Artist ID: ${payload.artistId}`);
  doc.text(`Month: ${payload.month}`);
  doc.text(`Gross sales: ${payload.totalSales.toFixed(2)} EUR`);
  doc.text(`Commission (${(COMMISSION_RATE * 100).toFixed(0)}%): ${payload.commission.toFixed(2)} EUR`);
  doc.text(`Net due: ${payload.netDue.toFixed(2)} EUR`);
  doc.end();
}

async function runMonthlyJob() {
  const month = currentMonthKey();
  const db = await buildConnection();

  try {
    const [rows] = await db.query(
      `
      SELECT
        r.artistId as artistId,
        COALESCE(SUM(oi.price), 0) as totalSales
      FROM OrderItem oi
      INNER JOIN \`Order\` o ON o.id = oi.orderId
      INNER JOIN \`Release\` r ON r.id = oi.releaseId
      WHERE DATE_FORMAT(o.createdAt, '%Y-%m') = ?
      GROUP BY r.artistId
      `,
      [month]
    );

    for (const row of rows) {
      const totalSales = Number(row.totalSales || 0);
      // fetch artist subscription plan to compute rate
      let commissionRate = COMMISSION_RATE;
      try {
        const [planRow] = await db.query(
          `SELECT s.plan FROM Subscription s WHERE s.userId = ? LIMIT 1`,
          [row.artistId]
        );
        if (planRow && planRow.length > 0 && planRow[0].plan) {
          commissionRate = getPlatformCommission(planRow[0].plan);
        }
      } catch (err) {
        // if any error, fallback to env rate
      }
      const commission = Number((totalSales * commissionRate).toFixed(2));
      const netDue = Number((totalSales - commission).toFixed(2));

      await db.query(
        `
        INSERT INTO ArtistRevenue (id, artistId, month, totalSales, commission, netDue, status)
        VALUES (UUID(), ?, ?, ?, ?, ?, 'PENDING')
        ON DUPLICATE KEY UPDATE totalSales = VALUES(totalSales), commission = VALUES(commission), netDue = VALUES(netDue)
        `,
        [row.artistId, month, totalSales, commission, netDue]
      );

      generateInvoicePdf(`/tmp/invoices/${month}-${row.artistId}.pdf`, {
        artistId: row.artistId,
        month,
        totalSales,
        commission,
        netDue
      });
    }

    // Placeholder for SMTP send and payout API integration.
    console.log(`[cron-service] monthly revenue run complete for ${month}, artists: ${rows.length}`);
  } finally {
    await db.end();
  }
}

cron.schedule("0 0 1 * *", async () => {
  try {
    await runMonthlyJob();
  } catch (error) {
    console.error("[cron-service] monthly job failed", error);
  }
});

console.log("[cron-service] scheduler started (0 0 1 * *)");
