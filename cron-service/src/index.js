import cron from "node-cron";
import mysql from "mysql2/promise";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

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
      const commission = Number((totalSales * COMMISSION_RATE).toFixed(2));
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
