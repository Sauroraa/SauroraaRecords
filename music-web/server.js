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
  <title>Sauroraa Music</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050507;
      --surface: #1c1c22;
      --text: #ffffff;
      --muted: #9fa3b4;
      --violet: #7b4cff;
      --cyan: #00d1ff;
      --radius: 14px;
      --shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      --grad: linear-gradient(135deg, #7b4cff, #00d1ff);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: "Inter", sans-serif;
      color: var(--text);
      background:
        radial-gradient(900px 700px at 10% -20%, rgba(123, 76, 255, 0.25), transparent 70%),
        radial-gradient(900px 700px at 100% 120%, rgba(0, 209, 255, 0.18), transparent 70%),
        var(--bg);
      min-height: 100vh;
    }
    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 260px 1fr;
      padding-bottom: 110px;
    }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      background: linear-gradient(180deg, rgba(18, 18, 28, 0.92), rgba(8, 8, 14, 0.95));
      backdrop-filter: blur(12px);
      padding: 22px 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .logo {
      font-family: "Space Grotesk", sans-serif;
      font-size: 24px;
      letter-spacing: 0.02em;
      margin: 2px 8px 12px;
    }
    .logo span {
      background: var(--grad);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .menu {
      display: grid;
      gap: 6px;
    }
    .menu button {
      all: unset;
      cursor: pointer;
      padding: 10px 12px;
      border-radius: 10px;
      color: #d8d9e2;
      font-weight: 600;
      font-size: 14px;
      transition: 0.2s ease;
    }
    .menu button:hover,
    .menu button.active {
      background: linear-gradient(90deg, rgba(123, 76, 255, 0.2), rgba(0, 209, 255, 0.08));
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(123, 76, 255, 0.45);
    }
    .main {
      padding: 24px 28px;
    }
    .topbar {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 20px;
    }
    .search {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 14px;
      color: #fff;
      outline: none;
      width: 100%;
    }
    .chip {
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.02);
      color: #fff;
      font-size: 13px;
      cursor: pointer;
    }
    .chip.premium {
      border-color: transparent;
      background: var(--grad);
      color: #fff;
      box-shadow: var(--shadow);
      font-weight: 700;
    }
    .hero {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius);
      padding: 26px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      background:
        radial-gradient(500px 300px at 20% 0%, rgba(123, 76, 255, 0.25), transparent 70%),
        radial-gradient(500px 300px at 100% 120%, rgba(0, 209, 255, 0.2), transparent 70%),
        rgba(255, 255, 255, 0.03);
      box-shadow: var(--shadow);
      margin-bottom: 18px;
    }
    .hero h1 {
      margin: 0 0 8px;
      font: 700 44px/1.08 "Space Grotesk", sans-serif;
      max-width: 760px;
    }
    .hero p {
      margin: 0;
      color: var(--muted);
      max-width: 720px;
    }
    .section {
      margin-top: 24px;
    }
    .section h2 {
      margin: 0 0 10px;
      font: 700 24px/1.2 "Space Grotesk", sans-serif;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .card {
      border-radius: var(--radius);
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      padding: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      box-shadow: var(--shadow);
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(123, 76, 255, 0.5);
      box-shadow: 0 10px 30px rgba(123, 76, 255, 0.15);
    }
    .cover {
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: 10px;
      background: var(--grad);
      margin-bottom: 10px;
      position: relative;
      overflow: hidden;
    }
    .cover::after {
      content: "";
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.3) 0 2px,
        rgba(255, 255, 255, 0.02) 2px 8px
      );
      opacity: 0.22;
    }
    .title {
      font-weight: 700;
      margin: 0 0 4px;
    }
    .meta {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 13px;
    }
    .row {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }
    .btn {
      border: 0;
      border-radius: 9px;
      padding: 8px 10px;
      cursor: pointer;
      font-weight: 600;
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .btn.play {
      background: var(--grad);
    }
    .mono {
      font-family: "JetBrains Mono", monospace;
      font-size: 12px;
      color: #bdd0ff;
    }
    .player {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      display: grid;
      grid-template-columns: 280px 1fr 320px;
      gap: 12px;
      padding: 10px 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(8, 8, 14, 0.92);
      backdrop-filter: blur(12px);
      z-index: 20;
    }
    .player-card {
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.04);
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mini {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: var(--grad);
      flex-shrink: 0;
    }
    .wave {
      height: 34px;
      border-radius: 8px;
      background:
        linear-gradient(90deg, rgba(123, 76, 255, 0.8), rgba(0, 209, 255, 0.8)),
        repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0 2px, transparent 2px 8px);
      position: relative;
      overflow: hidden;
    }
    .wave::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--progress, 18%);
      background: rgba(255, 255, 255, 0.45);
      mix-blend-mode: soft-light;
    }
    .controls {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 8px;
    }
    .ctl {
      border: 0;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      cursor: pointer;
    }
    .badge {
      display: inline-block;
      padding: 6px 9px;
      border-radius: 999px;
      background: rgba(123, 76, 255, 0.2);
      border: 1px solid rgba(123, 76, 255, 0.45);
      font-size: 12px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 70px;
      left: 12px;
      right: 12px;
      background: rgba(12, 12, 19, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 8px;
      justify-content: space-between;
      z-index: 30;
    }
    .mobile-nav button {
      all: unset;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
      flex: 1;
      padding: 8px 0;
    }
    @media (max-width: 1220px) {
      .cards {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .player {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 880px) {
      .app {
        grid-template-columns: 1fr;
      }
      .sidebar {
        display: none;
      }
      .main {
        padding: 14px;
      }
      .topbar {
        grid-template-columns: 1fr;
      }
      .cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .hero h1 {
        font-size: 32px;
      }
      .mobile-nav {
        display: flex;
      }
    }
    @media (max-width: 540px) {
      .cards {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="logo">Sauroraa <span>Music</span></div>
      <div class="menu">
        <button class="active">Home</button>
        <button>Discover</button>
        <button>Trending</button>
        <button>Artists</button>
        <button>Playlists</button>
        <button>Dubpacks</button>
        <button>New Releases</button>
        <button>Library</button>
        <button>Search</button>
      </div>
      <div class="mono">API: ${apiBase}</div>
    </aside>

    <main class="main">
      <header class="topbar">
        <input class="search" id="search" placeholder="Search track, artist, playlist, dubpack..." />
        <button class="chip">Genre: All</button>
        <button class="chip premium">Go PRO</button>
      </header>

      <section class="hero">
        <span class="badge">Cosmic Sound Engine</span>
        <h1>Un univers sonore futuriste pour streamer, découvrir et vibrer.</h1>
        <p>Waveform native, discovery en temps reel, design spatial, interactions premium. Sauroraa Music transforme chaque track en experience visuelle.</p>
      </section>

      <section class="section">
        <h2>Trending Today</h2>
        <div class="cards" id="tracks"></div>
      </section>

      <section class="section">
        <h2>Top Artists</h2>
        <div class="cards" id="artists"></div>
      </section>

      <section class="section">
        <h2>Dubpacks</h2>
        <div class="cards" id="dubpacks"></div>
      </section>
    </main>
  </div>

  <nav class="mobile-nav">
    <button>Home</button>
    <button>Search</button>
    <button>Library</button>
    <button>Alerts</button>
    <button>Profile</button>
  </nav>

  <footer class="player">
    <div class="player-card">
      <div class="mini"></div>
      <div>
        <div id="now-title" class="title">No track selected</div>
        <div id="now-meta" class="meta">Press play on a card</div>
      </div>
    </div>
    <div class="player-card" style="display:block">
      <div class="controls">
        <button class="ctl">⏮</button>
        <button class="ctl">▶</button>
        <button class="ctl">⏭</button>
        <button class="ctl">🔀</button>
        <button class="ctl">🔁</button>
      </div>
      <div class="wave" id="wave"></div>
    </div>
    <div class="player-card" style="justify-content:space-between">
      <span class="mono">BPM <strong id="now-bpm">---</strong></span>
      <span class="mono">VOL 72%</span>
      <span class="mono">QUEUE 12</span>
    </div>
  </footer>

  <script>
    const tracks = [
      { title: "Nebula Drive", artist: "SXR", bpm: 128, tag: "Melodic Techno" },
      { title: "Gravity Drop", artist: "Klyx", bpm: 140, tag: "Bass House" },
      { title: "Aurora Pulse", artist: "Luna Vox", bpm: 124, tag: "Deep House" },
      { title: "Dark Matter", artist: "N8", bpm: 136, tag: "Drum & Bass" },
      { title: "Ion Drift", artist: "Mira", bpm: 130, tag: "Afro House" },
      { title: "Orbit Shift", artist: "Rika", bpm: 122, tag: "Progressive" },
      { title: "Skyline Repost", artist: "Tavor", bpm: 144, tag: "Trap" },
      { title: "Quantum Step", artist: "Elya", bpm: 126, tag: "Electro" }
    ];

    const artists = [
      { title: "Luna Vox", artist: "2.4M streams", bpm: 91, tag: "Top 1 Trend" },
      { title: "Klyx", artist: "1.8M streams", bpm: 88, tag: "Top 2 Trend" },
      { title: "Mira", artist: "1.4M streams", bpm: 85, tag: "Top 3 Trend" },
      { title: "SXR", artist: "1.1M streams", bpm: 83, tag: "Top 4 Trend" }
    ];

    const dubpacks = [
      { title: "Warehouse Drums Vol.1", artist: "128 one-shots", bpm: 126, tag: "DUBPACK" },
      { title: "Future Bass FX", artist: "94 loops", bpm: 140, tag: "DUBPACK" },
      { title: "Afro Perc Toolkit", artist: "102 loops", bpm: 120, tag: "DUBPACK" },
      { title: "Synth Atmos Pack", artist: "68 textures", bpm: 110, tag: "DUBPACK" }
    ];

    function renderCards(targetId, data, kind) {
      const root = document.getElementById(targetId);
      root.innerHTML = data.map((item, idx) => \`
        <article class="card" data-kind="\${kind}" data-title="\${item.title.toLowerCase()}" data-artist="\${item.artist.toLowerCase()}">
          <div class="cover"></div>
          <p class="title">\${item.title}</p>
          <p class="meta">\${item.artist}</p>
          <div class="row">
            <span class="mono">\${item.bpm} BPM</span>
            <button class="btn \${kind === "track" ? "play" : ""}" onclick="selectTrack('\${item.title.replace(/'/g, "\\\\'")}', '\${item.artist.replace(/'/g, "\\\\'")}', '\${item.bpm}')">
              \${kind === "track" ? "Play" : "Open"}
            </button>
          </div>
          <div class="badge" style="margin-top:8px">\${item.tag}</div>
        </article>
      \`).join("");
    }

    function selectTrack(title, artist, bpm) {
      document.getElementById("now-title").textContent = title;
      document.getElementById("now-meta").textContent = artist;
      document.getElementById("now-bpm").textContent = bpm;
      document.getElementById("wave").style.setProperty("--progress", (10 + Math.floor(Math.random() * 70)) + "%");
    }

    document.getElementById("search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      for (const card of document.querySelectorAll(".card")) {
        const txt = (card.dataset.title || "") + " " + (card.dataset.artist || "");
        card.style.display = txt.includes(q) ? "" : "none";
      }
    });

    renderCards("tracks", tracks, "track");
    renderCards("artists", artists, "artist");
    renderCards("dubpacks", dubpacks, "dubpack");
    selectTrack("Nebula Drive", "SXR", 128);
  </script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log(`[music-web] listening on :${port}`);
});
