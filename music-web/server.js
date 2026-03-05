import express from "express";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiBase = process.env.API_BASE || "http://api:4000/api";
const recordsBase = process.env.RECORDS_BASE || "https://sauroraarecords.be";

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
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet">
  <!-- HLS.js for secure streaming -->
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js"></script>
  <style>
    :root {
      --bg: #050507;
      --bg-2: #0b0b10;
      --card: #12121a;
      --card-2: #17171f;
      --text: #ffffff;
      --muted: #9aa0aa;
      --line: rgba(255,255,255,0.10);
      --brand: #7b4cff;
      --brand-2: #5f39d6;
      --radius: 16px;
      --shadow: 0 10px 40px rgba(0,0,0,0.45);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Manrope", sans-serif;
      color: var(--text);
      background:
        radial-gradient(900px 500px at 12% -10%, rgba(123,76,255,0.18), transparent 70%),
        radial-gradient(900px 500px at 100% 120%, rgba(123,76,255,0.10), transparent 70%),
        linear-gradient(180deg, var(--bg), var(--bg-2));
      min-height: 100vh;
    }
    /* ── Layout ── */
    .app { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .side {
      position: sticky; top: 0; height: 100vh;
      background: rgba(8,8,14,0.92); border-right: 1px solid var(--line);
      backdrop-filter: blur(12px); padding: 18px 14px;
      display: flex; flex-direction: column; gap: 14px; overflow-y: auto;
    }
    .brand { padding: 8px 10px 14px; border-bottom: 1px solid var(--line); }
    .brand .t1 { font-size: 11px; color: var(--muted); margin-bottom: 3px; letter-spacing: .06em; text-transform: uppercase; }
    .brand .t2 { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
    .brand .t3 { font-size: 11px; color: #7b4cff; margin-top: 3px; font-weight: 700; }
    /* ── Nav ── */
    .nav { display: grid; gap: 4px; margin-top: 4px; }
    .nav-group-label { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); padding: 8px 10px 2px; }
    .nav button {
      all: unset; cursor: pointer; border: 1px solid transparent; color: #d6d7df;
      border-radius: 11px; padding: 9px 12px; font-size: 13px; font-weight: 700;
      transition: .14s ease; width: 100%;
    }
    .nav button:hover { border-color: var(--line); background: rgba(255,255,255,0.04); }
    .nav button.active {
      border-color: rgba(123,76,255,0.55);
      background: linear-gradient(90deg, rgba(123,76,255,0.22), rgba(123,76,255,0.10));
      color: #fff;
    }
    /* ── Side footer ── */
    .side-links { margin-top: auto; display: grid; gap: 6px; }
    .side-link {
      display: block; text-decoration: none; border: 1px solid var(--line);
      border-radius: 10px; padding: 8px 10px; font-size: 12px; font-weight: 700;
      color: #d6d7df; transition: .14s ease; text-align: center;
    }
    .side-link:hover { border-color: rgba(123,76,255,0.5); color: #fff; background: rgba(123,76,255,0.12); }
    .side-link.brand-link { background: linear-gradient(120deg,#7b4cff,#5f39d6); border-color: transparent; color: #fff; }
    /* ── Main ── */
    .main { padding: 20px 22px 140px; overflow-y: auto; }
    /* ── Top bar ── */
    .top {
      display: grid; grid-template-columns: 1fr auto auto auto;
      gap: 8px; align-items: center; margin-bottom: 14px;
    }
    .input {
      border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px;
      background: var(--card); font-size: 14px; font-weight: 600; color: var(--text);
      width: 100%; outline: none; transition: border-color .14s;
    }
    .input:focus { border-color: rgba(123,76,255,0.55); }
    .input::placeholder { color: #6a7080; }
    .btn {
      border: 1px solid var(--line); border-radius: 11px; background: var(--card);
      color: #f4f5ff; padding: 10px 14px; font-size: 13px; font-weight: 800;
      cursor: pointer; transition: .14s ease; white-space: nowrap;
    }
    .btn:hover { border-color: rgba(123,76,255,0.45); }
    .btn.brand {
      background: linear-gradient(120deg,#7b4cff,#5f39d6); border-color: transparent;
      box-shadow: 0 8px 24px rgba(123,76,255,0.28);
    }
    .btn.brand:hover { box-shadow: 0 10px 28px rgba(123,76,255,0.4); }
    /* ── Auth ── */
    .login-panel {
      display: none; border: 1px solid var(--line); border-radius: 12px;
      padding: 10px; background: var(--card); margin-bottom: 10px;
      grid-template-columns: 1fr 1fr auto auto; gap: 8px; align-items: center;
    }
    .login-panel.open { display: grid; }
    .notice {
      display: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
      padding: 9px 12px; margin-bottom: 10px; font-size: 12px;
      font-family: "IBM Plex Mono", monospace; color: #ffd9d9;
      background: rgba(217,63,63,0.12);
    }
    .notice.show { display: block; }
    .auth-bar { font-family: "IBM Plex Mono", monospace; font-size: 11px; color: var(--muted); margin-bottom: 8px; }
    /* ── Hero ── */
    .hero {
      border: 1px solid rgba(255,255,255,0.09); border-radius: 20px;
      background:
        radial-gradient(700px 220px at 20% -35%, rgba(123,76,255,0.26), transparent 70%),
        radial-gradient(700px 220px at 100% 130%, rgba(95,57,214,0.18), transparent 70%),
        #0f1017;
      padding: 22px; margin-bottom: 20px;
    }
    .hero h1 { font-size: 36px; font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; }
    .hero p { margin: 10px 0 0; color: var(--muted); max-width: 820px; font-size: 14px; line-height: 1.55; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; }
    .pill {
      border: 1px solid var(--line); border-radius: 999px; background: var(--card);
      color: #d6d7df; padding: 7px 12px; cursor: pointer; font-size: 12px; font-weight: 800;
      transition: .12s ease;
    }
    .pill:hover { border-color: rgba(123,76,255,0.4); }
    .pill.active { border-color: rgba(123,76,255,0.55); background: rgba(123,76,255,0.18); color: #fff; }
    /* ── Sections ── */
    section { margin-top: 22px; }
    section h2 { margin: 0 0 12px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
    /* ── Track card ── */
    .card {
      background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
      padding: 11px; box-shadow: var(--shadow); transition: .16s ease;
    }
    .card:hover { border-color: rgba(123,76,255,0.38); box-shadow: 0 14px 30px rgba(0,0,0,0.5); }
    .cover {
      width: 100%; aspect-ratio: 1/1; border-radius: 12px;
      background: linear-gradient(130deg, rgba(123,76,255,0.9), rgba(95,57,214,0.85));
      margin-bottom: 10px; background-size: cover; background-position: center;
      position: relative; overflow: hidden;
    }
    .cover-badge {
      position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.7);
      border-radius: 6px; padding: 3px 6px; font-size: 10px; font-weight: 800; color: #fff;
    }
    .waveform {
      width: 100%; height: 38px; border-radius: 8px; object-fit: cover;
      margin-bottom: 8px; opacity: 0.75;
    }
    .title { font-weight: 800; font-size: 15px; letter-spacing: -0.01em; margin-bottom: 2px; }
    .meta { color: var(--muted); font-size: 12px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
    .mono { font-family: "IBM Plex Mono", monospace; font-size: 11px; color: #7080a0; font-weight: 700; }
    .badge { font-size: 10px; font-weight: 800; border-radius: 6px; padding: 2px 6px; }
    .badge-verified { background: rgba(123,76,255,0.25); color: #c8b0ff; }
    .badge-hls { background: rgba(0,200,150,0.2); color: #50e0b0; }
    /* ── Card actions ── */
    .actions { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 6px; margin-top: 8px; }
    .a-btn {
      border: 1px solid var(--line); border-radius: 9px; background: var(--card-2);
      color: #d0d4e0; font-size: 11px; font-weight: 800; padding: 7px 6px;
      cursor: pointer; text-align: center; transition: .12s ease;
    }
    .a-btn:hover { border-color: rgba(123,76,255,0.4); color: #fff; }
    .a-btn.play {
      border-color: transparent; color: #fff;
      background: linear-gradient(120deg,#7b4cff,#5f39d6);
      box-shadow: 0 4px 14px rgba(123,76,255,0.3);
    }
    /* ── Artist card ── */
    .artist-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 10px; align-items: center; margin-top: 8px; }
    .avatar {
      width: 52px; height: 52px; border-radius: 50%;
      border: 2px solid rgba(123,76,255,0.5);
      background: linear-gradient(120deg,#7b4cff,#5f39d6);
      background-size: cover; background-position: center;
    }
    /* ── Comments drawer ── */
    .drawer {
      position: fixed; top: 0; right: 0; width: 420px; max-width: 100%;
      height: 100vh; background: var(--card); border-left: 1px solid var(--line);
      box-shadow: -16px 0 34px rgba(0,0,0,0.5); transform: translateX(110%);
      transition: .22s ease; z-index: 90;
      display: grid; grid-template-rows: auto 1fr auto;
    }
    .drawer.open { transform: translateX(0); }
    .d-head {
      padding: 14px; border-bottom: 1px solid var(--line);
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .d-list { padding: 11px 12px; overflow-y: auto; display: grid; align-content: start; gap: 8px; }
    .cmt {
      border: 1px solid var(--line); border-radius: 10px;
      padding: 9px 10px; background: var(--card-2);
    }
    .cmt .c-meta { font-size: 11px; color: var(--muted); margin-bottom: 4px; font-weight: 700; }
    .cmt .c-body { font-size: 13px; }
    .cmt .c-ts { font-family: "IBM Plex Mono", monospace; font-size: 10px; color: #7b4cff; }
    .d-form {
      border-top: 1px solid var(--line); padding: 10px;
      display: grid; grid-template-columns: 1fr auto; gap: 8px; background: var(--card);
    }
    /* ── Report drawer ── */
    .report-drawer {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%) translateY(110%);
      width: 480px; max-width: 96vw; background: var(--card);
      border: 1px solid var(--line); border-radius: 20px 20px 0 0;
      box-shadow: 0 -14px 40px rgba(0,0,0,0.5); z-index: 100;
      padding: 16px; transition: .22s ease;
    }
    .report-drawer.open { transform: translateX(-50%) translateY(0); }
    .report-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
    .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .report-btn {
      border: 1px solid var(--line); border-radius: 10px; background: var(--card-2);
      color: #d0d4e0; padding: 10px; font-size: 12px; font-weight: 800;
      cursor: pointer; transition: .12s; text-align: center;
    }
    .report-btn:hover, .report-btn.selected { border-color: rgba(123,76,255,0.6); background: rgba(123,76,255,0.15); color: #fff; }
    /* ── Share drawer ── */
    .share-drawer {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%) translateY(110%);
      width: 420px; max-width: 96vw; background: var(--card);
      border: 1px solid var(--line); border-radius: 20px 20px 0 0;
      box-shadow: 0 -14px 40px rgba(0,0,0,0.5); z-index: 101;
      padding: 16px; transition: .22s ease;
    }
    .share-drawer.open { transform: translateX(-50%) translateY(0); }
    .share-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 10px; }
    .share-item {
      border: 1px solid var(--line); border-radius: 12px; background: var(--card-2);
      padding: 12px 8px; text-align: center; cursor: pointer; transition: .12s;
    }
    .share-item:hover { border-color: rgba(123,76,255,0.5); background: rgba(123,76,255,0.12); }
    .share-item .si-icon { font-size: 22px; }
    .share-item .si-label { font-size: 11px; font-weight: 800; color: var(--muted); margin-top: 4px; }
    /* ── Player ── */
    .player {
      position: fixed; left: 268px; right: 18px; bottom: 14px;
      border: 1px solid rgba(123,76,255,0.3); border-radius: 18px;
      background: rgba(12,12,20,0.93); backdrop-filter: blur(14px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.5); padding: 10px 14px;
      z-index: 70; display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 10px; align-items: center;
    }
    .p-track { display: grid; grid-template-columns: 44px 1fr; gap: 10px; align-items: center; }
    .p-thumb {
      width: 44px; height: 44px; border-radius: 10px;
      background: linear-gradient(120deg,#7b4cff,#5f39d6);
      background-size: cover; background-position: center;
    }
    .p-title { font-size: 14px; font-weight: 800; line-height: 1.2; }
    .p-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .p-mid { display: grid; gap: 7px; }
    .p-ctrl { display: flex; justify-content: center; gap: 6px; }
    .icon-btn {
      border: 1px solid var(--line); border-radius: 999px;
      width: 34px; height: 34px; cursor: pointer;
      background: var(--card); font-weight: 900; color: #d0d4e0;
      font-size: 12px; display: flex; align-items: center; justify-content: center;
      transition: .12s;
    }
    .icon-btn:hover { border-color: rgba(123,76,255,0.5); }
    .icon-btn.playing { border-color: transparent; color: #fff; background: linear-gradient(120deg,#7b4cff,#5f39d6); }
    .bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.12); cursor: pointer; }
    .bar i { display: block; width: 0%; height: 100%; background: linear-gradient(90deg,#7b4cff,#5f39d6); border-radius: 999px; pointer-events: none; }
    .p-right {
      display: flex; justify-content: flex-end; align-items: center; gap: 10px;
      font-family: "IBM Plex Mono", monospace; font-size: 11px; color: var(--muted);
    }
    .vol { width: 80px; accent-color: #7b4cff; }
    /* ── Overlay backdrop ── */
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 89; display: none;
    }
    .backdrop.show { display: block; }
    /* ── Responsive ── */
    @media (max-width: 1200px) {
      .grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
      .top { grid-template-columns: 1fr auto auto; }
    }
    @media (max-width: 980px) {
      .app { grid-template-columns: 1fr; }
      .side { display: none; }
      .player { left: 10px; right: 10px; grid-template-columns: 1fr; }
      .grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
      .main { padding: 12px 12px 200px; }
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 26px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- ── Sidebar ── -->
    <aside class="side">
      <div class="brand">
        <div class="t1">Sauroraa Ecosystem</div>
        <div class="t2">Music</div>
        <div class="t3">Streaming &amp; Découverte</div>
      </div>
      <nav class="nav" id="menu">
        <div class="nav-group-label">Découverte</div>
        <button class="active" data-go="home">🏠 Home</button>
        <button data-go="discover">🎵 Tracks</button>
        <button data-go="trending">🔥 Trending</button>
        <button data-go="new-releases">✨ New Releases</button>
        <div class="nav-group-label">Artistes</div>
        <button data-go="artists">🎤 Artistes</button>
        <button data-go="dubpacks">📦 Dubpacks</button>
        <div class="nav-group-label">Mon espace</div>
        <button data-go="playlists">🎧 Mes Playlists</button>
        <button data-go="library">📚 Library</button>
        <button data-go="search">🔍 Recherche</button>
      </nav>
      <div class="side-links">
        <a class="side-link brand-link" id="side-records-btn" href="javascript:void(0)" onclick="openRecords()">Records →</a>
        <a class="side-link" href="javascript:void(0)" onclick="openRegister()">Créer un compte</a>
      </div>
    </aside>

    <!-- ── Main content ── -->
    <main class="main">
      <header class="top">
        <input class="input" id="search-input" placeholder="Recherche tracks, artistes, genres, BPM..." />
        <button class="btn" id="btn-login">Connexion</button>
        <button class="btn" id="btn-logout" style="display:none">Déconnexion</button>
        <button class="btn brand" id="btn-register">Records ↗</button>
      </header>

      <div class="login-panel" id="login-panel">
        <input class="input" id="login-email" placeholder="Email" />
        <input class="input" id="login-password" type="password" placeholder="Mot de passe" />
        <button class="btn brand" id="btn-login-submit">Se connecter</button>
        <button class="btn" id="btn-login-cancel">✕</button>
      </div>

      <div class="notice" id="notice"></div>
      <p class="auth-bar" id="auth-status">Session : invité</p>

      <!-- Hero -->
      <section class="hero" id="home">
        <h1>Écoute. Découvre.<br>Tout connecté à Records.</h1>
        <p>
          Même compte, même artistes, même stats. Chaque stream, commentaire et follow sur Music
          alimente directement la plateforme Records. Accès à votre bibliothèque et playlists depuis un seul endroit.
        </p>
        <div class="toolbar">
          <button class="pill active" data-genre="ALL">Tout</button>
          <button class="pill" data-genre="HOUSE">House</button>
          <button class="pill" data-genre="TECHNO">Techno</button>
          <button class="pill" data-genre="DNB">DNB</button>
          <button class="pill" data-genre="BASS">Bass</button>
          <button class="pill" data-genre="TRAP">Trap</button>
          <button class="pill" data-genre="DRILL">Drill</button>
          <button class="pill" data-genre="RAP">Rap</button>
          <button class="pill" data-genre="HIP_HOP">Hip-Hop</button>
          <button class="pill" data-genre="RNB">R&amp;B</button>
          <button class="pill" data-genre="AFRO">Afro</button>
          <button class="pill" data-genre="AMAPIANO">Amapiano</button>
          <button class="pill" data-genre="ELECTRO">Electro</button>
          <button class="pill" data-genre="POP">Pop</button>
        </div>
      </section>

      <section id="discover">
        <h2>Tracks</h2>
        <div class="grid" id="tracks"></div>
      </section>

      <section id="trending">
        <h2>🔥 Trending cette semaine</h2>
        <div class="grid" id="trending-grid"></div>
      </section>

      <section id="new-releases">
        <h2>✨ New Releases</h2>
        <div class="grid" id="new-releases-grid"></div>
      </section>

      <section id="artists">
        <h2>Artistes</h2>
        <div class="grid" id="artists-grid"></div>
      </section>

      <section id="dubpacks">
        <h2>Dubpacks</h2>
        <div class="grid" id="dubpacks-grid"></div>
      </section>

      <section id="playlists">
        <h2>Mes Playlists</h2>
        <div class="grid" id="playlists-grid"></div>
      </section>

      <section id="library">
        <h2>Library</h2>
        <div class="card">
          <p class="title" style="margin-bottom:6px">Actions rapides vers Records</p>
          <p class="meta">Toutes vos données sont centralisées sur Records.</p>
          <div class="actions" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px">
            <button class="a-btn" onclick="window.open('${recordsBase}','_blank')">Records Home</button>
            <button class="a-btn" onclick="window.open('${recordsBase}/catalog','_blank')">Catalogue</button>
            <button class="a-btn" onclick="window.open('${recordsBase}/dashboard','_blank')">Mon Profil</button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- ── Comments drawer ── -->
  <aside class="drawer" id="comments-drawer">
    <div class="d-head">
      <strong id="comments-title">Commentaires</strong>
      <button class="btn" id="comments-close">✕</button>
    </div>
    <div class="d-list" id="comments-list"></div>
    <div class="d-form">
      <input class="input" id="comment-input" placeholder="Commentaire (@ timecode : #1:23)" />
      <button class="btn brand" id="comment-send">Publier</button>
    </div>
  </aside>

  <!-- ── Report drawer ── -->
  <div class="report-drawer" id="report-drawer">
    <div class="report-title">🚨 Signaler ce contenu</div>
    <div class="report-grid" id="report-reasons">
      <button class="report-btn" data-reason="copyright">📜 Copyright</button>
      <button class="report-btn" data-reason="fake_artist">🎭 Faux artiste</button>
      <button class="report-btn" data-reason="spam">🗑️ Spam</button>
      <button class="report-btn" data-reason="offensive">⚠️ Contenu offensant</button>
      <button class="report-btn" data-reason="wrong_category">❌ Mauvaise catégorie</button>
      <button class="report-btn" data-reason="duplicate">🔁 Doublon</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
      <input class="input" id="report-detail" placeholder="Détails optionnels..." />
      <button class="btn brand" id="report-send">Envoyer</button>
    </div>
    <button class="btn" style="width:100%;margin-top:8px" id="report-cancel">Annuler</button>
  </div>

  <!-- ── Share drawer ── -->
  <div class="share-drawer" id="share-drawer">
    <div class="report-title">Partager ce track</div>
    <p class="meta" id="share-track-name" style="margin-bottom:4px"></p>
    <div class="share-grid">
      <div class="share-item" onclick="shareDiscord()"><div class="si-icon">💬</div><div class="si-label">Discord</div></div>
      <div class="share-item" onclick="shareTwitter()"><div class="si-icon">𝕏</div><div class="si-label">Twitter / X</div></div>
      <div class="share-item" onclick="shareCopy()"><div class="si-icon">🔗</div><div class="si-label">Copier lien</div></div>
    </div>
    <button class="btn" style="width:100%;margin-top:12px" id="share-cancel">Fermer</button>
  </div>

  <!-- ── Player ── -->
  <div class="player">
    <div class="p-track">
      <div class="p-thumb" id="player-thumb"></div>
      <div>
        <p class="p-title" id="player-title">Aucun track</p>
        <p class="p-sub" id="player-sub">Sélectionne un track</p>
      </div>
    </div>
    <div class="p-mid">
      <div class="p-ctrl">
        <button class="icon-btn" id="prev-btn">⏮</button>
        <button class="icon-btn" id="play-btn">▶</button>
        <button class="icon-btn" id="next-btn">⏭</button>
        <button class="icon-btn" id="shuffle-btn">⇄</button>
        <button class="icon-btn" id="repeat-btn">↺</button>
      </div>
      <div class="bar" id="progress-bar"><i id="progress"></i></div>
    </div>
    <div class="p-right">
      <span id="player-bpm">BPM ---</span>
      <span id="player-queue">Q 0</span>
      <input class="vol" id="volume" type="range" min="0" max="1" step="0.01" value="0.72" />
      <button class="btn" id="share-now">Share</button>
    </div>
  </div>

  <div class="backdrop" id="backdrop"></div>
  <audio id="audio"></audio>

  <script>
    const API = "/api";
    const RECORDS = ${JSON.stringify(recordsBase)};

    const state = {
      user: null,
      releases: [],
      trending: [],
      artists: [],
      dubpacks: [],
      playlists: [],
      queue: [],
      currentIndex: -1,
      currentReleaseId: null,
      currentCommentsReleaseId: null,
      reportTargetId: null,
      shareTargetId: null,
      selectedReportReason: null,
      genre: "ALL",
      shuffle: false,
      repeat: false,
      hlsInstance: null
    };

    const audio = document.getElementById("audio");
    const $ = (id) => document.getElementById(id);

    // ─── Utility ──────────────────────────────────────────────────────────

    function escapeHTML(v) {
      return String(v ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
    }

    function fmtTime(sec) {
      if (!sec || !Number.isFinite(sec)) return "0:00";
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return m + ":" + String(s).padStart(2, "0");
    }

    function showNotice(message, ok = false) {
      const el = $("notice");
      el.textContent = message;
      el.classList.add("show");
      el.style.background = ok ? "rgba(66,172,108,0.14)" : "rgba(217,63,63,0.12)";
      el.style.color = ok ? "#d8ffe7" : "#ffd9d9";
      clearTimeout(showNotice._t);
      showNotice._t = setTimeout(() => el.classList.remove("show"), 3500);
    }

    function setBackdrop(show) {
      $("backdrop").classList.toggle("show", show);
    }

    function closeAllDrawers() {
      $("comments-drawer").classList.remove("open");
      $("report-drawer").classList.remove("open");
      $("share-drawer").classList.remove("open");
      setBackdrop(false);
    }

    function api(path, opts = {}) {
      return fetch(API + path, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        ...opts
      });
    }

    function normalizeMediaPath(v) {
      if (!v) return null;
      if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) return v;
      return "/uploads/" + v;
    }

    function releaseArtistName(r) {
      return r.artist?.displayName || r.artist?.user?.firstName || r.artist?.user?.email || "Artiste inconnu";
    }

    function openRecords() { window.open(RECORDS, "_blank"); }
    function openRegister() { window.open(RECORDS + "/register", "_blank"); }

    // ─── Auth ─────────────────────────────────────────────────────────────

    function setLoginPanel(open) {
      $("login-panel").classList.toggle("open", open);
      if (open) $("login-email").focus();
    }

    async function refreshAuthState() {
      try {
        const res = await api("/auth/me");
        if (!res.ok) throw new Error();
        state.user = await res.json();
        $("btn-login").style.display = "none";
        $("btn-logout").style.display = "";
        $("auth-status").textContent = "Session : " + (state.user.email || state.user.userId);
      } catch {
        state.user = null;
        $("btn-login").style.display = "";
        $("btn-logout").style.display = "none";
        $("auth-status").textContent = "Session : invité";
      }
    }

    async function loginSubmit() {
      const email = $("login-email").value.trim();
      const password = $("login-password").value;
      if (!email || !password) { showNotice("Email et mot de passe requis."); return; }
      const res = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (!res.ok) { showNotice("Connexion refusée."); return; }
      $("login-password").value = "";
      setLoginPanel(false);
      showNotice("Connexion réussie.", true);
      await refreshAuthState();
      await loadPlaylists().then(() => renderPlaylists(state.playlists));
    }

    async function logoutNow() {
      await api("/auth/logout", { method: "POST" });
      state.user = null;
      await refreshAuthState();
    }

    // ─── Data loading ──────────────────────────────────────────────────────

    async function loadReleases() {
      const res = await api("/releases");
      if (!res.ok) return;
      state.releases = await res.json();
      state.queue = [...state.releases];
    }

    async function loadTrending() {
      const res = await api("/releases/trending");
      state.trending = res.ok ? await res.json() : [];
    }

    async function loadArtists() {
      const res = await api("/artists");
      state.artists = res.ok ? await res.json() : [];
    }

    async function loadDubpacks() {
      const res = await api("/dubpacks");
      state.dubpacks = res.ok ? await res.json() : [];
    }

    async function loadPlaylists() {
      if (!state.user) { state.playlists = []; return; }
      const res = await api("/premium/playlists/me");
      state.playlists = res.ok ? await res.json() : [];
    }

    function filteredReleases() {
      if (state.genre === "ALL") return state.releases;
      return state.releases.filter((r) => (r.genre || "").toUpperCase() === state.genre);
    }

    function byId(id) {
      return state.releases.find((r) => r.id === id)
          || state.trending.find((r) => r.id === id);
    }

    function getNewReleases(limit = 12) {
      const base = state.genre === "ALL" ? state.releases : state.releases.filter((r) => (r.genre || "").toUpperCase() === state.genre);
      return [...base]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit);
    }

    // ─── Render helpers ────────────────────────────────────────────────────

    function cardActions(r) {
      const id = escapeHTML(r.id);
      const slug = escapeHTML(r.slug || "");
      const isHls = r.hlsReady ? ' <span class="badge badge-hls">HLS</span>' : "";
      return '<div class="row">' +
        '<span class="mono">BPM ' + escapeHTML(r.bpm || "---") + '</span>' +
        '<span class="mono">' + escapeHTML(r.genre || "---") + '</span>' +
        isHls +
      '</div>' +
      '<div class="actions">' +
        '<button class="a-btn play" data-action="play" data-id="' + id + '">▶ Play</button>' +
        '<button class="a-btn" data-action="comments" data-id="' + id + '">💬</button>' +
        '<button class="a-btn" data-action="share" data-id="' + id + '">🔗</button>' +
        '<button class="a-btn" data-action="report" data-id="' + id + '">🚩</button>' +
      '</div>' +
      '<div class="actions" style="grid-template-columns:1fr 1fr;margin-top:0">' +
        '<button class="a-btn" data-action="open" data-slug="' + slug + '">Open on Records</button>' +
        '<button class="a-btn" data-action="queue-add" data-id="' + id + '">+ Queue</button>' +
      '</div>';
    }

    function renderReleases(targetId, list) {
      const root = $(targetId);
      if (!list.length) {
        root.innerHTML = '<div class="card" style="grid-column:1/-1"><p class="meta">Aucun track trouvé.</p></div>';
        return;
      }
      root.innerHTML = list.map((r) => {
        const cover = normalizeMediaPath(r.coverPath) || "";
        const waveform = normalizeMediaPath(r.waveformPath);
        const isVerified = r.artist?.isVerified;
        return '<article class="card">' +
          '<div class="cover" style="' + (cover ? 'background-image:url("' + cover + '")' : "") + '">' +
            (isVerified ? '<span class="cover-badge">✓ Vérifié</span>' : "") +
          '</div>' +
          (waveform ? '<img class="waveform" src="' + escapeHTML(waveform) + '" alt="waveform" loading="lazy" />' : "") +
          '<p class="title">' + escapeHTML(r.title) + '</p>' +
          '<p class="meta">' + escapeHTML(releaseArtistName(r)) + '</p>' +
          cardActions(r) +
        '</article>';
      }).join("");
    }

    function renderArtists(list) {
      const root = $("artists-grid");
      if (!list.length) {
        root.innerHTML = '<div class="card"><p class="meta">Aucun artiste trouvé.</p></div>';
        return;
      }
      root.innerHTML = list.map((a) => {
        const name = a.displayName || a.user?.email || "Artiste";
        const avatar = a.avatarPath ? normalizeMediaPath(a.avatarPath) : (a.avatar ? normalizeMediaPath(a.avatar) : "");
        const followerCount = a._count?.followers ?? 0;
        const isVerified = a.isVerified;
        return '<article class="card">' +
          '<div class="artist-row">' +
            '<div class="avatar" ' + (avatar ? 'style="background-image:url(\'' + escapeHTML(avatar) + '\')"' : "") + '></div>' +
            '<div>' +
              '<p class="title">' + escapeHTML(name) + (isVerified ? ' <span class="badge badge-verified">✓</span>' : '') + '</p>' +
              '<p class="meta">' + escapeHTML(a.genre || "Artiste") + ' · ' + followerCount + ' abonnés</p>' +
            '</div>' +
            '<button class="btn" data-action="artist-follow" data-id="' + escapeHTML(a.id) + '">Follow</button>' +
          '</div>' +
          '<div class="actions" style="grid-template-columns:1fr 1fr;margin-top:8px">' +
            '<button class="a-btn" data-action="artist-open" data-id="' + escapeHTML(a.id) + '">Profil</button>' +
            '<button class="a-btn" data-action="artist-releases" data-id="' + escapeHTML(a.id) + '">Tracks</button>' +
          '</div>' +
        '</article>';
      }).join("");
    }

    function renderDubpacks(list) {
      const root = $("dubpacks-grid");
      if (!list.length) {
        root.innerHTML = '<div class="card"><p class="meta">Aucun dubpack trouvé.</p></div>';
        return;
      }
      root.innerHTML = list.map((d) => {
        const cover = normalizeMediaPath(d.coverPath) || "";
        const artist = d.artist?.displayName || d.artist?.user?.email || "Artiste inconnu";
        return '<article class="card">' +
          '<div class="cover" ' + (cover ? 'style="background-image:url(\'' + escapeHTML(cover) + '\')"' : "") + '></div>' +
          '<p class="title">' + escapeHTML(d.title) + '</p>' +
          '<p class="meta">' + escapeHTML(artist) + '</p>' +
          '<div class="row">' +
            '<span class="mono">' + escapeHTML(d.genre || "---") + '</span>' +
            '<span class="mono">' + escapeHTML(String(d.price || "0")) + ' EUR</span>' +
          '</div>' +
          '<div class="actions" style="grid-template-columns:1fr 1fr">' +
            '<button class="a-btn" data-action="dubpack-open" data-slug="' + escapeHTML(d.slug || "") + '">Voir</button>' +
            '<button class="a-btn play" data-action="dubpack-buy" data-slug="' + escapeHTML(d.slug || "") + '">Acheter</button>' +
          '</div>' +
        '</article>';
      }).join("");
    }

    function renderPlaylists(list) {
      const root = $("playlists-grid");
      if (!list.length) {
        root.innerHTML = '<div class="card" style="grid-column:1/-1"><p class="meta">Connecte-toi pour voir tes playlists.</p><button class="btn brand" style="margin-top:10px" onclick="setLoginPanel(true)">Se connecter</button></div>';
        return;
      }
      root.innerHTML = list.map((p) => {
        const tracks = p.tracks?.length || 0;
        return '<article class="card">' +
          '<p class="title">' + escapeHTML(p.title || "Sans titre") + '</p>' +
          '<p class="meta">' + escapeHTML(p.description || "") + '</p>' +
          '<div class="row"><span class="mono">' + tracks + ' tracks</span><span class="mono">' + (p.isPublic ? "PUBLIC" : "PRIVÉE") + '</span></div>' +
          '<div class="actions" style="grid-template-columns:1fr 1fr">' +
            '<button class="a-btn" data-action="playlist-play" data-id="' + escapeHTML(p.id) + '">▶ Jouer</button>' +
            '<button class="a-btn" onclick="window.open(\'' + RECORDS + '/dashboard\',\'_blank\')">Gérer</button>' +
          '</div>' +
        '</article>';
      }).join("");
    }

    // ─── Player ────────────────────────────────────────────────────────────

    function updatePlayerMeta(r) {
      $("player-title").textContent = r ? r.title : "Aucun track";
      $("player-sub").textContent = r ? releaseArtistName(r) : "Sélectionne un track";
      $("player-bpm").textContent = "BPM " + (r?.bpm || "---");
      $("player-queue").textContent = "Q " + state.queue.length;
      const cover = r ? normalizeMediaPath(r.coverPath) : "";
      $("player-thumb").style.backgroundImage = cover ? 'url("' + cover + '")' : "";
    }

    async function getStreamToken(releaseId) {
      try {
        const res = await api("/stream/token/" + releaseId);
        if (!res.ok) return null;
        const data = await res.json();
        return data.token || null;
      } catch { return null; }
    }

    async function playReleaseById(releaseId) {
      const r = byId(releaseId);
      if (!r) return;

      state.currentReleaseId = r.id;
      state.currentIndex = state.queue.findIndex((x) => x.id === r.id);
      updatePlayerMeta(r);

      // Destroy previous HLS instance if any
      if (state.hlsInstance) {
        state.hlsInstance.destroy();
        state.hlsInstance = null;
      }

      // Try HLS streaming first if available
      if (r.hlsReady && r.hlsPreviewPath) {
        const token = await getStreamToken(r.id);
        if (token) {
          const hlsSrc = "/hls/" + r.id + "/preview/index.m3u8?token=" + encodeURIComponent(token);
          if (Hls.isSupported()) {
            state.hlsInstance = new Hls();
            state.hlsInstance.loadSource(hlsSrc);
            state.hlsInstance.attachMedia(audio);
            state.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
              audio.play().catch(() => {});
            });
          } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
            audio.src = hlsSrc;
            audio.play().catch(() => {});
          }
          setPlayingState(true);
          await trackView(r.id);
          return;
        }
      }

      // Fallback to direct audio
      const src = normalizeMediaPath(r.previewClip || r.audioPath);
      if (src) {
        audio.src = src;
        audio.play().catch(() => {});
        setPlayingState(true);
      }
      await trackView(r.id);
    }

    function setPlayingState(playing) {
      $("play-btn").classList.toggle("playing", playing);
      $("play-btn").textContent = playing ? "⏸" : "▶";
    }

    async function playAt(index) {
      if (!state.queue.length) return;
      if (index < 0) index = state.queue.length - 1;
      if (index >= state.queue.length) index = 0;
      state.currentIndex = index;
      await playReleaseById(state.queue[index].id);
    }

    async function nextTrack() {
      if (!state.queue.length) return;
      if (state.shuffle) {
        await playAt(Math.floor(Math.random() * state.queue.length));
      } else {
        await playAt(state.currentIndex + 1);
      }
    }

    async function prevTrack() {
      if (audio.currentTime > 3) { audio.currentTime = 0; return; }
      await playAt(state.currentIndex - 1);
    }

    function togglePlay() {
      if (!audio.src && state.queue.length) { playAt(0); return; }
      if (audio.paused) {
        audio.play().catch(() => {});
        setPlayingState(true);
      } else {
        audio.pause();
        setPlayingState(false);
      }
    }

    // ─── Engagement ────────────────────────────────────────────────────────

    async function trackView(releaseId) {
      if (!releaseId) return;
      api("/engagement/view", {
        method: "POST",
        body: JSON.stringify({ releaseId, scope: "PREVIEW", playlistPath: window.location.pathname })
      }).catch(() => {});
    }

    function trackHeatmap(releaseId, secondMark) {
      if (!releaseId || !Number.isFinite(secondMark)) return;
      api("/ecosystem/heatmap/" + releaseId + "/events", {
        method: "POST",
        body: JSON.stringify({ secondMark: Math.floor(secondMark) })
      }).catch(() => {});
    }

    // ─── Report ────────────────────────────────────────────────────────────

    function openReport(releaseId) {
      if (!state.user) { showNotice("Connecte-toi pour signaler."); return; }
      state.reportTargetId = releaseId;
      state.selectedReportReason = null;
      document.querySelectorAll(".report-btn").forEach((b) => b.classList.remove("selected"));
      $("report-detail").value = "";
      $("report-drawer").classList.add("open");
      setBackdrop(true);
    }

    async function sendReport() {
      if (!state.reportTargetId || !state.selectedReportReason) {
        showNotice("Sélectionne un motif."); return;
      }
      const res = await api("/ecosystem/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "RELEASE",
          releaseId: state.reportTargetId,
          reason: state.selectedReportReason,
          details: $("report-detail").value.trim() || undefined
        })
      });
      closeAllDrawers();
      showNotice(res.ok ? "Signalement envoyé. Merci." : "Signalement refusé.", res.ok);
    }

    // ─── Share ─────────────────────────────────────────────────────────────

    function openShare(releaseId) {
      const r = byId(releaseId);
      state.shareTargetId = releaseId;
      $("share-track-name").textContent = r ? r.title + " · " + releaseArtistName(r) : "";
      $("share-drawer").classList.add("open");
      setBackdrop(true);
    }

    function shareUrl() {
      const r = byId(state.shareTargetId);
      if (!r) return "";
      return RECORDS + "/release/" + (r.slug || r.id);
    }

    function shareDiscord() {
      const r = byId(state.shareTargetId);
      const url = shareUrl();
      const text = "🎧 " + (r ? r.title + " — " + releaseArtistName(r) : "Sauroraa Music") + "\n" + url;
      navigator.clipboard.writeText(text).catch(() => {});
      showNotice("Message copié ! Colle-le sur Discord.", true);
      registerShare();
    }

    function shareTwitter() {
      const url = shareUrl();
      const text = encodeURIComponent("Je stream ça sur Sauroraa Music 🎧\n" + url + " #SauroraaRecords");
      window.open("https://twitter.com/intent/tweet?text=" + text, "_blank");
      registerShare();
    }

    async function shareCopy() {
      const url = shareUrl();
      if (!url) return;
      try { await navigator.clipboard.writeText(url); } catch { }
      closeAllDrawers();
      showNotice("Lien copié !", true);
      registerShare();
    }

    function registerShare() {
      if (!state.shareTargetId) return;
      api("/engagement/share", {
        method: "POST",
        body: JSON.stringify({ releaseId: state.shareTargetId })
      }).catch(() => {});
      closeAllDrawers();
    }

    // ─── Comments ──────────────────────────────────────────────────────────

    async function openComments(releaseId) {
      state.currentCommentsReleaseId = releaseId;
      const r = byId(releaseId);
      $("comments-title").textContent = r ? "💬 " + r.title : "Commentaires";
      $("comments-drawer").classList.add("open");
      setBackdrop(true);
      $("comments-list").innerHTML = '<div class="cmt"><div class="c-body" style="color:var(--muted)">Chargement...</div></div>';

      const res = await api("/comments?releaseId=" + encodeURIComponent(releaseId));
      if (!res.ok) {
        $("comments-list").innerHTML = '<div class="cmt"><div class="c-body">Impossible de charger les commentaires.</div></div>';
        return;
      }
      const list = await res.json();
      $("comments-list").innerHTML = list.length ? list.map((c) => {
        const ts = c.timestampSec != null ? '<span class="c-ts">' + fmtTime(c.timestampSec) + '</span> ' : "";
        return '<div class="cmt">' +
          '<div class="c-meta">' + escapeHTML(c.user?.email || "utilisateur") + ' · ' + new Date(c.createdAt).toLocaleDateString("fr-FR") + '</div>' +
          '<div class="c-body">' + ts + escapeHTML(c.body) + '</div>' +
        '</div>';
      }).join("") : '<div class="cmt"><div class="c-body" style="color:var(--muted)">Aucun commentaire pour l\'instant.</div></div>';
    }

    async function sendComment() {
      if (!state.currentCommentsReleaseId) return;
      if (!state.user) { showNotice("Connecte-toi pour commenter."); return; }
      const bodyText = $("comment-input").value.trim();
      if (!bodyText) return;

      // Parse optional timecode from # prefix e.g. "#1:23 texte"
      let timestampSec;
      const tsMatch = bodyText.match(/^@(\d+):(\d{2})\s*/);
      if (tsMatch) timestampSec = Number(tsMatch[1]) * 60 + Number(tsMatch[2]);

      const res = await api("/comments", {
        method: "POST",
        body: JSON.stringify({
          releaseId: state.currentCommentsReleaseId,
          body: bodyText.replace(/^@\d+:\d{2}\s*/, ""),
          timestampSec
        })
      });
      if (!res.ok) { showNotice("Commentaire refusé."); return; }
      $("comment-input").value = "";
      await openComments(state.currentCommentsReleaseId);
    }

    // ─── Event wiring ──────────────────────────────────────────────────────

    function wireMainActions() {
      document.body.addEventListener("click", async (ev) => {
        const btn = ev.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        const slug = btn.getAttribute("data-slug");

        if (action === "play") await playReleaseById(id);
        if (action === "comments") await openComments(id);
        if (action === "share") openShare(id);
        if (action === "report") openReport(id);
        if (action === "open" && slug) window.open(RECORDS + "/release/" + slug, "_blank");
        if (action === "queue-add") {
          const r = byId(id);
          if (r && !state.queue.find((x) => x.id === id)) {
            state.queue.push(r);
            $("player-queue").textContent = "Q " + state.queue.length;
            showNotice("Ajouté à la queue.", true);
          }
        }
        if (action === "artist-follow") {
          if (!state.user) { showNotice("Connecte-toi pour suivre."); return; }
          const res = await api("/follows/artist/" + encodeURIComponent(id), { method: "POST" });
          showNotice(res.ok ? "Follow envoyé !" : "Déjà suivi ou erreur.", res.ok);
        }
        if (action === "artist-open") window.open(RECORDS + "/artists/" + encodeURIComponent(id), "_blank");
        if (action === "artist-releases") {
          const list = state.releases.filter((r) => r.artistId === id);
          renderReleases("tracks", list);
          document.getElementById("discover").scrollIntoView({ behavior: "smooth" });
        }
        if (action === "dubpack-open" && slug) window.open(RECORDS + "/dubpacks/" + slug, "_blank");
        if (action === "dubpack-buy" && slug) window.open(RECORDS + "/dubpacks/" + slug + "?buy=1", "_blank");
        if (action === "playlist-play") {
          const pl = state.playlists.find((p) => p.id === id);
          const firstId = pl?.tracks?.[0]?.release?.id || pl?.tracks?.[0]?.releaseId;
          if (firstId) await playReleaseById(firstId);
          else showNotice("Playlist vide.");
        }
      });
    }

    function wireUi() {
      $("btn-login").addEventListener("click", () => setLoginPanel(true));
      $("btn-logout").addEventListener("click", logoutNow);
      $("btn-login-submit").addEventListener("click", loginSubmit);
      $("btn-login-cancel").addEventListener("click", () => setLoginPanel(false));
      $("btn-register").addEventListener("click", openRegister);
      $("login-password").addEventListener("keydown", (e) => { if (e.key === "Enter") loginSubmit(); });

      $("comments-close").addEventListener("click", closeAllDrawers);
      $("comment-send").addEventListener("click", sendComment);
      $("comment-input").addEventListener("keydown", (e) => { if (e.key === "Enter") sendComment(); });

      // Report drawer
      document.querySelectorAll(".report-btn").forEach((b) => {
        b.addEventListener("click", () => {
          document.querySelectorAll(".report-btn").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected");
          state.selectedReportReason = b.getAttribute("data-reason");
        });
      });
      $("report-send").addEventListener("click", sendReport);
      $("report-cancel").addEventListener("click", closeAllDrawers);

      // Share drawer
      $("share-cancel").addEventListener("click", closeAllDrawers);
      $("share-now").addEventListener("click", () => {
        if (state.currentReleaseId) openShare(state.currentReleaseId);
      });

      $("backdrop").addEventListener("click", closeAllDrawers);

      // Search
      $("search-input").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        for (const card of document.querySelectorAll(".card")) {
          const txt = (card.textContent || "").toLowerCase();
          card.style.display = q === "" || txt.includes(q) ? "" : "none";
        }
        // Show/hide section headings when all cards within are hidden
        for (const section of document.querySelectorAll("section")) {
          const cards = section.querySelectorAll(".card");
          if (!cards.length) continue;
          const anyVisible = Array.from(cards).some((c) => c.style.display !== "none");
          section.style.display = anyVisible || q === "" ? "" : "none";
        }
      });

      // Genre filter
      document.querySelectorAll("[data-genre]").forEach((b) => {
        b.addEventListener("click", () => {
          document.querySelectorAll("[data-genre]").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          state.genre = b.getAttribute("data-genre");
          renderReleases("tracks", filteredReleases());
          renderReleases("new-releases-grid", getNewReleases());
        });
      });

      // Side menu — click scrolls to section
      document.querySelectorAll("#menu button").forEach((b) => {
        b.addEventListener("click", () => {
          document.querySelectorAll("#menu button").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          const target = b.getAttribute("data-go");
          if (target === "search") {
            $("search-input").focus();
            $("search-input").scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          const el = document.getElementById(target);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      // Side menu — auto-highlight active section on scroll
      const sectionIds = ["home", "discover", "trending", "new-releases", "artists", "dubpacks", "playlists", "library"];
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            document.querySelectorAll("#menu button").forEach((b) => {
              b.classList.toggle("active", b.getAttribute("data-go") === id);
            });
          }
        });
      }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
      sectionIds.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });

      // Player controls
      $("play-btn").addEventListener("click", togglePlay);
      $("next-btn").addEventListener("click", nextTrack);
      $("prev-btn").addEventListener("click", prevTrack);
      $("shuffle-btn").addEventListener("click", () => {
        state.shuffle = !state.shuffle;
        $("shuffle-btn").classList.toggle("playing", state.shuffle);
      });
      $("repeat-btn").addEventListener("click", () => {
        state.repeat = !state.repeat;
        $("repeat-btn").classList.toggle("playing", state.repeat);
      });
      $("volume").addEventListener("input", (e) => { audio.volume = Number(e.target.value); });

      // Progress bar click-to-seek
      $("progress-bar").addEventListener("click", (e) => {
        if (!audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });
    }

    function wireAudio() {
      audio.volume = Number($("volume").value);
      let lastHeatmapSec = -10;

      audio.addEventListener("timeupdate", () => {
        const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        $("progress").style.width = ratio.toFixed(2) + "%";

        // Send heatmap event every 10 seconds
        const currentSec = Math.floor(audio.currentTime);
        if (currentSec - lastHeatmapSec >= 10 && state.currentReleaseId) {
          lastHeatmapSec = currentSec;
          trackHeatmap(state.currentReleaseId, currentSec);
        }
      });

      audio.addEventListener("ended", async () => {
        if (state.repeat && state.currentReleaseId) {
          await playReleaseById(state.currentReleaseId);
          return;
        }
        await nextTrack();
      });

      audio.addEventListener("play", () => setPlayingState(true));
      audio.addEventListener("pause", () => setPlayingState(false));
    }

    // ─── Boot ──────────────────────────────────────────────────────────────

    async function boot() {
      wireUi();
      wireMainActions();
      wireAudio();
      await refreshAuthState();
      await Promise.allSettled([loadReleases(), loadTrending(), loadArtists(), loadDubpacks(), loadPlaylists()]);
      renderReleases("tracks", filteredReleases());
      renderReleases("trending-grid", state.trending);
      renderReleases("new-releases-grid", getNewReleases());
      renderArtists(state.artists);
      renderDubpacks(state.dubpacks);
      renderPlaylists(state.playlists);
      updatePlayerMeta(null);
    }

    boot();
  </script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log("[music-web] listening on :" + port);
});
