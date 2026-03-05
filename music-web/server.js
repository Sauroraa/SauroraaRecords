import express from "express";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiBase = process.env.API_BASE || "http://api:4000/api";

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "music-web" });
});

app.get("*", (_req, res) => {
  res
    .status(200)
    .type("html")
    .send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Music.SauroraaRecords</title>
  <style>
    :root {
      --bg: #0c1220;
      --bg2: #141f34;
      --text: #f5f7fb;
      --accent: #00aeef;
      --muted: #9eb1c9;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: var(--text);
      background: radial-gradient(circle at top left, #132543, var(--bg));
      min-height: 100vh;
      display: grid;
      place-items: center;
    }
    .card {
      width: min(760px, 92vw);
      background: linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 22px;
      padding: 28px;
      backdrop-filter: blur(10px);
    }
    h1 { margin-top: 0; letter-spacing: .06em; }
    p { color: var(--muted); line-height: 1.6; }
    .badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(0,174,239,.15);
      color: var(--accent);
      border: 1px solid rgba(0,174,239,.4);
      font-size: 12px;
      margin-bottom: 16px;
    }
    code {
      background: rgba(0,0,0,.25);
      border: 1px solid rgba(255,255,255,.15);
      padding: 2px 6px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">Music Platform</span>
    <h1>Music.SauroraaRecords</h1>
    <p>Frontend streaming séparé prêt à être remplacé par un client Next.js/PWA dédié.</p>
    <p>API connectée: <code>${apiBase}</code></p>
  </main>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(`[music-web] listening on :${port}`);
});
