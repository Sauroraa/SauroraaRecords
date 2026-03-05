import express from "express";

const app = express();
const port = Number(process.env.PORT || 3001);
const recordsBase = process.env.RECORDS_BASE || "https://sauroraarecords.be";

app.get("/health", (_req, res) => res.json({ ok: true, service: "music-web" }));

app.get("*", (_req, res) => {
  const RB = JSON.stringify(recordsBase);
  res.status(200).type("html").send(String.raw`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sauroraa Music</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js"></script>
  <style>
    :root {
      --bg: #050507; --bg2: #0b0b10; --card: #12121a; --card2: #17171f;
      --text: #fff; --muted: #9aa0aa; --line: rgba(255,255,255,0.10);
      --brand: #7b4cff; --brand2: #5f39d6; --r: 16px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Manrope", sans-serif; color: var(--text);
      background: radial-gradient(900px 500px at 12% -10%, rgba(123,76,255,0.18), transparent 70%),
        radial-gradient(900px 500px at 100% 120%, rgba(123,76,255,0.10), transparent 70%),
        linear-gradient(180deg, var(--bg), var(--bg2));
      min-height: 100vh;
    }
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
    .nav { display: grid; gap: 4px; margin-top: 4px; }
    .nav-lbl { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); padding: 8px 10px 2px; }
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
    .side-links { margin-top: auto; display: grid; gap: 6px; }
    .side-link {
      display: block; text-decoration: none; border: 1px solid var(--line);
      border-radius: 10px; padding: 8px 10px; font-size: 12px; font-weight: 700;
      color: #d6d7df; transition: .14s ease; text-align: center; cursor: pointer;
    }
    .side-link:hover { border-color: rgba(123,76,255,0.5); color: #fff; background: rgba(123,76,255,0.12); }
    .side-link.brand-link { background: linear-gradient(120deg,#7b4cff,#5f39d6); border-color: transparent; color: #fff; }
    .main { padding: 20px 22px 140px; }
    .top { display: grid; grid-template-columns: 1fr auto auto auto; gap: 8px; align-items: center; margin-bottom: 14px; }
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
    .btn.brand { background: linear-gradient(120deg,#7b4cff,#5f39d6); border-color: transparent; box-shadow: 0 8px 24px rgba(123,76,255,0.28); }
    .btn.brand:hover { box-shadow: 0 10px 28px rgba(123,76,255,0.4); }
    .notice {
      display: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
      padding: 9px 12px; margin-bottom: 10px; font-size: 12px;
      font-family: "IBM Plex Mono", monospace;
    }
    .notice.show { display: block; }
    /* ---- User dropdown ---- */
    .user-wrap { position: relative; }
    .user-btn {
      display: flex; align-items: center; gap: 8px;
      border: 1px solid var(--line); border-radius: 11px;
      background: var(--card); padding: 6px 12px 6px 7px;
      cursor: pointer; transition: .14s ease; white-space: nowrap;
      font-size: 13px; font-weight: 800; color: #f4f5ff;
    }
    .user-btn:hover { border-color: rgba(123,76,255,0.45); }
    .user-btn.logged { border-color: rgba(123,76,255,0.35); background: rgba(123,76,255,0.10); }
    .user-av {
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg,#7b4cff,#5f39d6);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; color: #fff; flex-shrink: 0;
      overflow: hidden;
    }
    .user-av img { width: 100%; height: 100%; object-fit: cover; }
    .drop {
      display: none; position: absolute; top: calc(100% + 8px); right: 0;
      min-width: 260px; background: #12121a; border: 1px solid rgba(123,76,255,0.25);
      border-radius: 16px; box-shadow: 0 20px 48px rgba(0,0,0,0.55);
      z-index: 200; overflow: hidden;
    }
    .drop.open { display: block; }
    .drop-section { padding: 14px; display: grid; gap: 8px; }
    .drop-title { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
    .drop-input {
      border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px;
      background: #0b0b10; font-size: 13px; font-weight: 600; color: var(--text);
      width: 100%; outline: none; transition: border-color .14s;
    }
    .drop-input:focus { border-color: rgba(123,76,255,0.55); }
    .drop-input::placeholder { color: #6a7080; }
    .drop-btn-full {
      border: 1px solid var(--line); border-radius: 10px; background: var(--card);
      color: #f4f5ff; padding: 10px 14px; font-size: 13px; font-weight: 800;
      cursor: pointer; transition: .14s ease; width: 100%; text-align: center;
    }
    .drop-btn-full:hover { border-color: rgba(123,76,255,0.45); background: rgba(255,255,255,0.05); }
    .drop-btn-full.brand { background: linear-gradient(120deg,#7b4cff,#5f39d6); border-color: transparent; box-shadow: 0 6px 18px rgba(123,76,255,0.28); }
    .drop-btn-full.brand:hover { box-shadow: 0 8px 24px rgba(123,76,255,0.4); }
    .drop-btn-full.danger { color: #ff7070; border-color: rgba(255,80,80,0.2); }
    .drop-btn-full.danger:hover { background: rgba(255,80,80,0.08); border-color: rgba(255,80,80,0.4); }
    .drop-hr { border: none; border-top: 1px solid var(--line); margin: 2px 0; }
    .drop-user { display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center; padding: 4px 0 8px; }
    .drop-user-av {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg,#7b4cff,#5f39d6);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 800; color: #fff; overflow: hidden;
    }
    .drop-user-av img { width: 100%; height: 100%; object-fit: cover; }
    .drop-user-name { font-size: 14px; font-weight: 800; line-height: 1.2; }
    .drop-user-email { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .hero {
      border: 1px solid rgba(255,255,255,0.09); border-radius: 20px;
      background: radial-gradient(700px 220px at 20% -35%, rgba(123,76,255,0.26), transparent 70%),
        radial-gradient(700px 220px at 100% 130%, rgba(95,57,214,0.18), transparent 70%), #0f1017;
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
    section { margin-top: 22px; }
    section h2 { margin: 0 0 12px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
    .card {
      background: var(--card); border: 1px solid var(--line); border-radius: var(--r);
      padding: 11px; box-shadow: 0 10px 40px rgba(0,0,0,0.45); transition: .16s ease;
    }
    .card:hover { border-color: rgba(123,76,255,0.38); }
    .cover {
      width: 100%; aspect-ratio: 1/1; border-radius: 12px;
      background: linear-gradient(130deg, rgba(123,76,255,0.9), rgba(95,57,214,0.85));
      margin-bottom: 10px; background-size: cover; background-position: center;
      position: relative; overflow: hidden;
    }
    .cover-badge {
      position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.7);
      border-radius: 6px; padding: 3px 6px; font-size: 10px; font-weight: 800;
    }
    .waveform { width: 100%; height: 38px; border-radius: 8px; object-fit: cover; margin-bottom: 8px; opacity: 0.75; }
    .title { font-weight: 800; font-size: 15px; letter-spacing: -0.01em; margin-bottom: 2px; }
    .meta { color: var(--muted); font-size: 12px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
    .mono { font-family: "IBM Plex Mono", monospace; font-size: 11px; color: #7080a0; font-weight: 700; }
    .badge { font-size: 10px; font-weight: 800; border-radius: 6px; padding: 2px 6px; }
    .badge-verified { background: rgba(123,76,255,0.25); color: #c8b0ff; }
    .badge-hls { background: rgba(0,200,150,0.2); color: #50e0b0; }
    .actions { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 6px; margin-top: 8px; }
    .a-btn {
      border: 1px solid var(--line); border-radius: 9px; background: var(--card2);
      color: #d0d4e0; font-size: 11px; font-weight: 800; padding: 7px 6px;
      cursor: pointer; text-align: center; transition: .12s ease;
    }
    .a-btn:hover { border-color: rgba(123,76,255,0.4); color: #fff; }
    .a-btn.play { border-color: transparent; color: #fff; background: linear-gradient(120deg,#7b4cff,#5f39d6); box-shadow: 0 4px 14px rgba(123,76,255,0.3); }
    .artist-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 10px; align-items: center; margin-top: 8px; }
    .avatar {
      width: 52px; height: 52px; border-radius: 50%;
      border: 2px solid rgba(123,76,255,0.5);
      background: linear-gradient(120deg,#7b4cff,#5f39d6);
      background-size: cover; background-position: center;
    }
    .drawer {
      position: fixed; top: 0; right: 0; width: 420px; max-width: 100%;
      height: 100vh; background: var(--card); border-left: 1px solid var(--line);
      box-shadow: -16px 0 34px rgba(0,0,0,0.5); transform: translateX(110%);
      transition: .22s ease; z-index: 90;
      display: grid; grid-template-rows: auto 1fr auto;
    }
    .drawer.open { transform: translateX(0); }
    .d-head { padding: 14px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
    .d-list { padding: 11px 12px; overflow-y: auto; display: grid; align-content: start; gap: 8px; }
    .cmt { border: 1px solid var(--line); border-radius: 10px; padding: 9px 10px; background: var(--card2); }
    .cmt .c-meta { font-size: 11px; color: var(--muted); margin-bottom: 4px; font-weight: 700; }
    .cmt .c-body { font-size: 13px; }
    .cmt .c-ts { font-family: "IBM Plex Mono", monospace; font-size: 10px; color: #7b4cff; }
    .d-form { border-top: 1px solid var(--line); padding: 10px; display: grid; grid-template-columns: 1fr auto; gap: 8px; background: var(--card); }
    .modal {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%) translateY(110%);
      width: 480px; max-width: 96vw; background: var(--card);
      border: 1px solid var(--line); border-radius: 20px 20px 0 0;
      box-shadow: 0 -14px 40px rgba(0,0,0,0.5); z-index: 100;
      padding: 16px; transition: .22s ease;
    }
    .modal.open { transform: translateX(-50%) translateY(0); }
    .modal-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
    .rpt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .rpt-btn {
      border: 1px solid var(--line); border-radius: 10px; background: var(--card2);
      color: #d0d4e0; padding: 10px; font-size: 12px; font-weight: 800;
      cursor: pointer; transition: .12s; text-align: center;
    }
    .rpt-btn:hover, .rpt-btn.sel { border-color: rgba(123,76,255,0.6); background: rgba(123,76,255,0.15); color: #fff; }
    .shr-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 10px; }
    .shr-item {
      border: 1px solid var(--line); border-radius: 12px; background: var(--card2);
      padding: 12px 8px; text-align: center; cursor: pointer; transition: .12s;
    }
    .shr-item:hover { border-color: rgba(123,76,255,0.5); background: rgba(123,76,255,0.12); }
    .shr-icon { font-size: 22px; }
    .shr-lbl { font-size: 11px; font-weight: 800; color: var(--muted); margin-top: 4px; }
    .player {
      position: fixed; left: 268px; right: 18px; bottom: 14px;
      border: 1px solid rgba(123,76,255,0.3); border-radius: 18px;
      background: rgba(12,12,20,0.93); backdrop-filter: blur(14px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.5); padding: 10px 14px;
      z-index: 70; display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 10px; align-items: center;
    }
    .p-track { display: grid; grid-template-columns: 44px 1fr; gap: 10px; align-items: center; }
    .p-thumb { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(120deg,#7b4cff,#5f39d6); background-size: cover; background-position: center; }
    .p-title { font-size: 14px; font-weight: 800; line-height: 1.2; }
    .p-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .p-mid { display: grid; gap: 7px; }
    .p-ctrl { display: flex; justify-content: center; gap: 6px; }
    .icon-btn {
      border: 1px solid var(--line); border-radius: 999px;
      width: 34px; height: 34px; cursor: pointer;
      background: var(--card); font-weight: 900; color: #d0d4e0;
      font-size: 14px; display: flex; align-items: center; justify-content: center;
      transition: .12s;
    }
    .icon-btn:hover { border-color: rgba(123,76,255,0.5); }
    .icon-btn.playing { border-color: transparent; color: #fff; background: linear-gradient(120deg,#7b4cff,#5f39d6); }
    .bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.12); cursor: pointer; }
    .bar i { display: block; width: 0%; height: 100%; background: linear-gradient(90deg,#7b4cff,#5f39d6); border-radius: 999px; pointer-events: none; }
    .p-right { display: flex; justify-content: flex-end; align-items: center; gap: 10px; font-family: "IBM Plex Mono", monospace; font-size: 11px; color: var(--muted); }
    .vol { width: 80px; accent-color: #7b4cff; }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 89; display: none; }
    .backdrop.show { display: block; }
    @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3,minmax(0,1fr)); } .top { grid-template-columns: 1fr auto auto; } }
    @media (max-width: 980px) { .app { grid-template-columns: 1fr; } .side { display: none; } .player { left: 10px; right: 10px; grid-template-columns: 1fr; } .grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .main { padding: 12px 12px 200px; } }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .hero h1 { font-size: 26px; } }
  </style>
</head>
<body>
<div class="app">
  <aside class="side">
    <div class="brand">
      <div class="t1">Sauroraa Ecosystem</div>
      <div class="t2">Music</div>
      <div class="t3">Streaming &amp; Decouverte</div>
    </div>
    <nav class="nav" id="menu">
      <div class="nav-lbl">Decouverte</div>
      <button class="active" data-go="home">&#127968; Home</button>
      <button data-go="discover">&#127925; Tracks</button>
      <button data-go="trending">&#128293; Trending</button>
      <button data-go="new-releases">&#10024; New Releases</button>
      <div class="nav-lbl">Artistes</div>
      <button data-go="artists">&#127908; Artistes</button>
      <button data-go="dubpacks">&#128230; Dubpacks</button>
      <div class="nav-lbl">Mon espace</div>
      <button data-go="playlists">&#127911; Mes Playlists</button>
      <button data-go="library">&#128218; Library</button>
      <button data-go="search">&#128269; Recherche</button>
    </nav>
    <div class="side-links">
      <a class="side-link brand-link" href="javascript:void(0)" onclick="openRecords()">Records &#8594;</a>
      <a class="side-link" href="javascript:void(0)" onclick="openRegister()">Creer un compte</a>
    </div>
  </aside>

  <main class="main">
    <header class="top">
      <input class="input" id="search-input" placeholder="Recherche tracks, artistes, genres, BPM..." />
      <div class="user-wrap" id="user-wrap">
        <button class="user-btn" id="user-btn">
          <span class="user-av" id="user-av">?</span>
          <span id="user-btn-label">Connexion</span>
        </button>
        <div class="drop" id="user-drop"></div>
      </div>
      <button class="btn brand" id="btn-records">Records &#8599;</button>
    </header>

    <div class="notice" id="notice"></div>

    <section class="hero" id="home">
      <h1>Ecoute. Decouvre.<br>Tout connecte a Records.</h1>
      <p>Meme compte, memes artistes, memes stats. Chaque stream, commentaire et follow sur Music alimente directement la plateforme Records.</p>
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

    <section id="discover"><h2>Tracks</h2><div class="grid" id="tracks"></div></section>
    <section id="trending"><h2>&#128293; Trending cette semaine</h2><div class="grid" id="trending-grid"></div></section>
    <section id="new-releases"><h2>&#10024; New Releases</h2><div class="grid" id="new-releases-grid"></div></section>
    <section id="artists"><h2>Artistes</h2><div class="grid" id="artists-grid"></div></section>
    <section id="dubpacks"><h2>Dubpacks</h2><div class="grid" id="dubpacks-grid"></div></section>
    <section id="playlists"><h2>Mes Playlists</h2><div class="grid" id="playlists-grid"></div></section>
    <section id="library">
      <h2>Library</h2>
      <div class="card">
        <p class="title" style="margin-bottom:6px">Actions rapides vers Records</p>
        <p class="meta">Toutes vos donnees sont centralisees sur Records.</p>
        <div class="actions" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px">
          <button class="a-btn" onclick="openRecords()">Records Home</button>
          <button class="a-btn" onclick="openCatalog()">Catalogue</button>
          <button class="a-btn" onclick="openDashboard()">Mon Profil</button>
        </div>
      </div>
    </section>
  </main>
</div>

<aside class="drawer" id="comments-drawer">
  <div class="d-head">
    <strong id="comments-title">Commentaires</strong>
    <button class="btn" id="comments-close">&#10005;</button>
  </div>
  <div class="d-list" id="comments-list"></div>
  <div class="d-form">
    <input class="input" id="comment-input" placeholder="Commentaire (@1:23 pour timecode)" />
    <button class="btn brand" id="comment-send">Publier</button>
  </div>
</aside>

<div class="modal" id="report-modal">
  <div class="modal-title">Signaler ce contenu</div>
  <div class="rpt-grid" id="report-reasons">
    <button class="rpt-btn" data-reason="copyright">Copyright</button>
    <button class="rpt-btn" data-reason="fake_artist">Faux artiste</button>
    <button class="rpt-btn" data-reason="spam">Spam</button>
    <button class="rpt-btn" data-reason="offensive">Contenu offensant</button>
    <button class="rpt-btn" data-reason="wrong_category">Mauvaise categorie</button>
    <button class="rpt-btn" data-reason="duplicate">Doublon</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
    <input class="input" id="report-detail" placeholder="Details optionnels..." />
    <button class="btn brand" id="report-send">Envoyer</button>
  </div>
  <button class="btn" style="width:100%;margin-top:8px" id="report-cancel">Annuler</button>
</div>

<div class="modal" style="width:420px" id="share-modal">
  <div class="modal-title">Partager ce track</div>
  <p class="meta" id="share-track-name" style="margin-bottom:4px"></p>
  <div class="shr-grid">
    <div class="shr-item" id="shr-discord"><div class="shr-icon">&#128172;</div><div class="shr-lbl">Discord</div></div>
    <div class="shr-item" id="shr-twitter"><div class="shr-icon">&#120143;</div><div class="shr-lbl">Twitter / X</div></div>
    <div class="shr-item" id="shr-copy"><div class="shr-icon">&#128279;</div><div class="shr-lbl">Copier lien</div></div>
  </div>
  <button class="btn" style="width:100%;margin-top:12px" id="share-cancel">Fermer</button>
</div>

<div class="player">
  <div class="p-track">
    <div class="p-thumb" id="player-thumb"></div>
    <div>
      <p class="p-title" id="player-title">Aucun track</p>
      <p class="p-sub" id="player-sub">Selectionnez un track</p>
    </div>
  </div>
  <div class="p-mid">
    <div class="p-ctrl">
      <button class="icon-btn" id="prev-btn">&#9198;</button>
      <button class="icon-btn" id="play-btn">&#9654;</button>
      <button class="icon-btn" id="next-btn">&#9197;</button>
      <button class="icon-btn" id="shuffle-btn">&#8644;</button>
      <button class="icon-btn" id="repeat-btn">&#8635;</button>
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
  // ---- Config (server-injected) ----
  var API = "/api";
  var RECORDS = ${RB};

  // ---- State ----
  var S = {
    user: null, releases: [], trending: [], artists: [], dubpacks: [], playlists: [],
    queue: [], idx: -1, releaseId: null, commentsId: null,
    reportId: null, shareId: null, reportReason: null,
    genre: "ALL", shuffle: false, repeat: false, hls: null
  };

  var audio = document.getElementById("audio");
  function el(id) { return document.getElementById(id); }

  // ---- Utils ----
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtTime(s) {
    if (!s || !isFinite(s)) return "0:00";
    return Math.floor(s / 60) + ":" + ("0" + Math.floor(s % 60)).slice(-2);
  }

  function notice(msg, ok) {
    var n = el("notice");
    n.textContent = msg;
    n.className = "notice show";
    n.style.background = ok ? "rgba(66,172,108,0.14)" : "rgba(217,63,63,0.12)";
    n.style.color = ok ? "#d8ffe7" : "#ffd9d9";
    clearTimeout(notice._t);
    notice._t = setTimeout(function() { n.classList.remove("show"); }, 3500);
  }

  function backdrop(show) { el("backdrop").classList.toggle("show", show); }

  function closeAll() {
    el("comments-drawer").classList.remove("open");
    el("report-modal").classList.remove("open");
    el("share-modal").classList.remove("open");
    backdrop(false);
  }

  function apiFetch(path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      credentials: "include",
      headers: Object.assign({ "Content-Type": "application/json" }, opts.headers || {}),
      method: opts.method || "GET",
      body: opts.body || undefined
    });
  }

  function normUrl(v) {
    if (!v) return "";
    if (v.indexOf("http") === 0 || v.charAt(0) === "/") return v;
    return "/uploads/" + v;
  }

  function artistName(obj) {
    if (!obj) return "Artiste inconnu";
    var a = obj.artist || obj;
    return a.displayName || (a.user && (a.user.firstName || a.user.email)) || "Artiste inconnu";
  }

  // ---- Navigation ----
  function openRecords() { window.open(RECORDS, "_blank"); }
  function openRegister() { window.open(RECORDS + "/register", "_blank"); }
  function openCatalog() { window.open(RECORDS + "/catalog", "_blank"); }
  function openDashboard() { window.open(RECORDS + "/dashboard", "_blank"); }

  // ---- Auth ----
  function toggleDrop() {
    el("user-drop").classList.toggle("open");
  }

  function closeDrop() {
    el("user-drop").classList.remove("open");
  }

  function renderDrop() {
    var drop = el("user-drop");
    var btn = el("user-btn");
    var av = el("user-av");
    var lbl = el("user-btn-label");

    if (S.user) {
      var artist = S.user.artist;
      var name = (artist && artist.displayName) || S.user.firstName || S.user.email.split("@")[0];
      var initial = name.charAt(0).toUpperCase();
      var avatarUrl = S.user.avatarUrl || (artist && artist.avatar) || "";
      av.innerHTML = avatarUrl ? "<img src=\"" + esc(normUrl(avatarUrl)) + "\" />" : initial;
      lbl.textContent = name;
      btn.classList.add("logged");
      drop.innerHTML =
        "<div class=\"drop-section\">" +
          "<div class=\"drop-user\">" +
            "<div class=\"drop-user-av\">" + (avatarUrl ? "<img src=\"" + esc(normUrl(avatarUrl)) + "\" />" : initial) + "</div>" +
            "<div>" +
              "<p class=\"drop-user-name\">" + esc(name) + "</p>" +
              "<p class=\"drop-user-email\">" + esc(S.user.email) + "</p>" +
            "</div>" +
          "</div>" +
          "<hr class=\"drop-hr\" />" +
          "<button class=\"drop-btn-full brand\" onclick=\"openDashboard()\">&#127968; Mon Profil sur Records</button>" +
          "<button class=\"drop-btn-full\" onclick=\"openRecords()\">Records &#8599;</button>" +
          "<hr class=\"drop-hr\" />" +
          "<button class=\"drop-btn-full danger\" id=\"btn-logout\">Deconnexion</button>" +
        "</div>";
      el("btn-logout").addEventListener("click", function() { closeDrop(); logout(); });
    } else {
      av.innerHTML = "?";
      lbl.textContent = "Connexion";
      btn.classList.remove("logged");
      drop.innerHTML =
        "<div class=\"drop-section\">" +
          "<p class=\"drop-title\">Connexion</p>" +
          "<input class=\"drop-input\" id=\"login-email\" type=\"email\" placeholder=\"Email\" />" +
          "<input class=\"drop-input\" id=\"login-password\" type=\"password\" placeholder=\"Mot de passe\" />" +
          "<button class=\"drop-btn-full brand\" id=\"btn-login-submit\">Se connecter</button>" +
          "<button class=\"drop-btn-full\" onclick=\"openRegister()\">Creer un compte &#8594;</button>" +
        "</div>";
      el("btn-login-submit").addEventListener("click", loginSubmit);
      el("login-password").addEventListener("keydown", function(e) { if (e.key === "Enter") loginSubmit(); });
      el("login-email").focus();
    }
  }

  async function refreshAuth() {
    try {
      var r = await apiFetch("/auth/me");
      if (!r.ok) throw new Error();
      S.user = await r.json();
    } catch(e) {
      S.user = null;
    }
    renderDrop();
  }

  async function loginSubmit() {
    var email = el("login-email").value.trim();
    var pass = el("login-password").value;
    if (!email || !pass) { notice("Email et mot de passe requis."); return; }
    try {
      var r = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email, password: pass })
      });
      if (!r.ok) {
        var err = await r.json().catch(function() { return {}; });
        notice(err.message || "Connexion refusee."); return;
      }
      el("login-password").value = "";
      closeDrop();
      notice("Connexion reussie !", true);
      await refreshAuth();
      await loadPlaylists();
      renderPlaylists(S.playlists);
    } catch(e) { notice("Erreur reseau."); }
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(function() {});
    S.user = null;
    await refreshAuth();
    S.playlists = [];
    renderPlaylists([]);
  }

  // ---- Data ----
  function toArray(v) { return Array.isArray(v) ? v : (v && (v.data || v.items)) || []; }

  async function loadReleases() {
    try {
      var r = await apiFetch("/releases");
      if (!r.ok) return;
      S.releases = toArray(await r.json());
      S.queue = S.releases.slice();
    } catch(e) {}
  }

  async function loadTrending() {
    try {
      var r = await apiFetch("/releases/trending");
      S.trending = r.ok ? toArray(await r.json()) : [];
    } catch(e) { S.trending = []; }
  }

  async function loadArtists() {
    try {
      var r = await apiFetch("/artists");
      S.artists = r.ok ? toArray(await r.json()) : [];
    } catch(e) { S.artists = []; }
  }

  async function loadDubpacks() {
    try {
      var r = await apiFetch("/dubpacks");
      S.dubpacks = r.ok ? toArray(await r.json()) : [];
    } catch(e) { S.dubpacks = []; }
  }

  async function loadPlaylists() {
    if (!S.user) { S.playlists = []; return; }
    try {
      var r = await apiFetch("/premium/playlists/me");
      S.playlists = r.ok ? toArray(await r.json()) : [];
    } catch(e) { S.playlists = []; }
  }

  function filtered() {
    if (S.genre === "ALL") return S.releases;
    return S.releases.filter(function(r) { return (r.genre || "").toUpperCase() === S.genre; });
  }

  function byId(id) {
    return S.releases.find(function(r) { return r.id === id; })
      || S.trending.find(function(r) { return r.id === id; })
      || null;
  }

  function newReleases() {
    var base = S.genre === "ALL" ? S.releases : S.releases.filter(function(r) { return (r.genre || "").toUpperCase() === S.genre; });
    return base.slice().sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); }).slice(0, 12);
  }

  // ---- Render ----
  function buildCoverStyle(path) {
    if (!path) return "";
    return " style=\"background-image:url('" + esc(normUrl(path)) + "')\"";
  }

  function cardActions(r) {
    var id = esc(r.id || "");
    var slug = esc(r.slug || "");
    return "<div class=\"row\">" +
        "<span class=\"mono\">BPM " + esc(r.bpm || "---") + "</span>" +
        "<span class=\"mono\">" + esc(r.genre || "---") + "</span>" +
        (r.hlsReady ? "<span class=\"badge badge-hls\">HLS</span>" : "") +
      "</div>" +
      "<div class=\"actions\">" +
        "<button class=\"a-btn play\" data-action=\"play\" data-id=\"" + id + "\">&#9654; Play</button>" +
        "<button class=\"a-btn\" data-action=\"comments\" data-id=\"" + id + "\">Cmts</button>" +
        "<button class=\"a-btn\" data-action=\"share\" data-id=\"" + id + "\">Share</button>" +
        "<button class=\"a-btn\" data-action=\"report\" data-id=\"" + id + "\">Flag</button>" +
      "</div>" +
      "<div class=\"actions\" style=\"grid-template-columns:1fr 1fr;margin-top:0\">" +
        "<button class=\"a-btn\" data-action=\"open\" data-slug=\"" + slug + "\">Records</button>" +
        "<button class=\"a-btn\" data-action=\"queue-add\" data-id=\"" + id + "\">+ Queue</button>" +
      "</div>";
  }

  function renderReleases(targetId, list) {
    var root = el(targetId);
    if (!list || !list.length) {
      root.innerHTML = "<div class=\"card\" style=\"grid-column:1/-1\"><p class=\"meta\">Aucun track.</p></div>";
      return;
    }
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var coverStyle = buildCoverStyle(r.coverPath);
      var wf = normUrl(r.waveformPath);
      var verified = r.artist && r.artist.isVerified;
      html += "<article class=\"card\">";
      html += "<div class=\"cover\"" + coverStyle + ">";
      if (verified) html += "<span class=\"cover-badge\">&#10003; Verifie</span>";
      html += "</div>";
      if (wf) html += "<img class=\"waveform\" src=\"" + esc(wf) + "\" alt=\"waveform\" loading=\"lazy\" />";
      html += "<p class=\"title\">" + esc(r.title || "Sans titre") + "</p>";
      html += "<p class=\"meta\">" + esc(artistName(r)) + "</p>";
      html += cardActions(r);
      html += "</article>";
    }
    root.innerHTML = html;
  }

  function renderArtists(list) {
    var root = el("artists-grid");
    if (!list || !list.length) {
      root.innerHTML = "<div class=\"card\"><p class=\"meta\">Aucun artiste.</p></div>";
      return;
    }
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var name = esc(a.displayName || (a.user && a.user.email) || "Artiste");
      var avatarStyle = buildCoverStyle(a.avatarPath || a.avatar);
      var genre = esc(a.genre || "Artiste");
      var followers = (a._count && a._count.followers) || 0;
      var id = esc(a.id || "");
      html += "<article class=\"card\">";
      html += "<div class=\"artist-row\">";
      html += "<div class=\"avatar\"" + avatarStyle + "></div>";
      html += "<div>";
      html += "<p class=\"title\">" + name + (a.isVerified ? " <span class=\"badge badge-verified\">&#10003;</span>" : "") + "</p>";
      html += "<p class=\"meta\">" + genre + " &middot; " + followers + " abonn&eacute;s</p>";
      html += "</div>";
      html += "<button class=\"btn\" data-action=\"artist-follow\" data-id=\"" + id + "\">Follow</button>";
      html += "</div>";
      html += "<div class=\"actions\" style=\"grid-template-columns:1fr 1fr;margin-top:8px\">";
      html += "<button class=\"a-btn\" data-action=\"artist-open\" data-id=\"" + id + "\">Profil</button>";
      html += "<button class=\"a-btn\" data-action=\"artist-releases\" data-id=\"" + id + "\">Tracks</button>";
      html += "</div>";
      html += "</article>";
    }
    root.innerHTML = html;
  }

  function renderDubpacks(list) {
    var root = el("dubpacks-grid");
    if (!list || !list.length) {
      root.innerHTML = "<div class=\"card\"><p class=\"meta\">Aucun dubpack.</p></div>";
      return;
    }
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      var coverStyle = buildCoverStyle(d.coverPath);
      var slug = esc(d.slug || "");
      html += "<article class=\"card\">";
      html += "<div class=\"cover\"" + coverStyle + "></div>";
      html += "<p class=\"title\">" + esc(d.title || "Dubpack") + "</p>";
      html += "<p class=\"meta\">" + esc(artistName(d)) + "</p>";
      html += "<div class=\"row\">";
      html += "<span class=\"mono\">" + esc(d.genre || "---") + "</span>";
      html += "<span class=\"mono\">" + esc(String(d.price || 0)) + " EUR</span>";
      html += "</div>";
      html += "<div class=\"actions\" style=\"grid-template-columns:1fr 1fr\">";
      html += "<button class=\"a-btn\" data-action=\"dubpack-open\" data-slug=\"" + slug + "\">Voir</button>";
      html += "<button class=\"a-btn play\" data-action=\"dubpack-buy\" data-slug=\"" + slug + "\">Acheter</button>";
      html += "</div>";
      html += "</article>";
    }
    root.innerHTML = html;
  }

  function renderPlaylists(list) {
    var root = el("playlists-grid");
    if (!list || !list.length) {
      root.innerHTML = "<div class=\"card\" style=\"grid-column:1/-1\"><p class=\"meta\">Connecte-toi pour voir tes playlists.</p><button class=\"btn brand\" style=\"margin-top:10px\" onclick=\"setLoginPanel(true)\">Se connecter</button></div>";
      return;
    }
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var tracks = (p.tracks && p.tracks.length) || 0;
      var pid = esc(p.id || "");
      html += "<article class=\"card\">";
      html += "<p class=\"title\">" + esc(p.title || "Sans titre") + "</p>";
      html += "<p class=\"meta\">" + esc(p.description || "") + "</p>";
      html += "<div class=\"row\">";
      html += "<span class=\"mono\">" + tracks + " tracks</span>";
      html += "<span class=\"mono\">" + (p.isPublic ? "PUBLIC" : "PRIVEE") + "</span>";
      html += "</div>";
      html += "<div class=\"actions\" style=\"grid-template-columns:1fr 1fr\">";
      html += "<button class=\"a-btn\" data-action=\"playlist-play\" data-id=\"" + pid + "\">&#9654; Jouer</button>";
      html += "<button class=\"a-btn\" data-action=\"playlist-manage\">Gerer</button>";
      html += "</div>";
      html += "</article>";
    }
    root.innerHTML = html;
  }

  // ---- Player ----
  function updateMeta(r) {
    el("player-title").textContent = r ? r.title : "Aucun track";
    el("player-sub").textContent = r ? artistName(r) : "Selectionnez un track";
    el("player-bpm").textContent = "BPM " + ((r && r.bpm) || "---");
    el("player-queue").textContent = "Q " + S.queue.length;
    var cover = r ? normUrl(r.coverPath) : "";
    el("player-thumb").style.backgroundImage = cover ? "url('" + cover + "')" : "";
  }

  async function getToken(id) {
    try {
      var r = await apiFetch("/stream/token/" + id);
      if (!r.ok) return null;
      var d = await r.json();
      return d.token || null;
    } catch(e) { return null; }
  }

  async function playById(id) {
    var r = byId(id);
    if (!r) return;
    S.releaseId = r.id;
    S.idx = S.queue.findIndex(function(x) { return x.id === r.id; });
    updateMeta(r);

    if (S.hls) { S.hls.destroy(); S.hls = null; }

    if (r.hlsReady && r.hlsPreviewPath) {
      var token = await getToken(r.id);
      if (token) {
        var src = "/hls/" + r.id + "/preview/index.m3u8?token=" + encodeURIComponent(token);
        if (typeof Hls !== "undefined" && Hls.isSupported()) {
          S.hls = new Hls();
          S.hls.loadSource(src);
          S.hls.attachMedia(audio);
          S.hls.on(Hls.Events.MANIFEST_PARSED, function() { audio.play().catch(function() {}); });
          setPlaying(true);
          trackView(r.id);
          return;
        } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          audio.src = src;
          audio.play().catch(function() {});
          setPlaying(true);
          trackView(r.id);
          return;
        }
      }
    }

    var fallback = normUrl(r.previewClip || r.audioPath);
    if (fallback) {
      audio.src = fallback;
      audio.play().catch(function() {});
      setPlaying(true);
    }
    trackView(r.id);
  }

  function setPlaying(on) {
    el("play-btn").classList.toggle("playing", on);
    el("play-btn").innerHTML = on ? "&#9646;&#9646;" : "&#9654;";
  }

  async function playAt(idx) {
    if (!S.queue.length) return;
    if (idx < 0) idx = S.queue.length - 1;
    if (idx >= S.queue.length) idx = 0;
    S.idx = idx;
    await playById(S.queue[idx].id);
  }

  async function nextTrack() {
    if (S.shuffle) await playAt(Math.floor(Math.random() * S.queue.length));
    else await playAt(S.idx + 1);
  }

  async function prevTrack() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    await playAt(S.idx - 1);
  }

  function togglePlay() {
    if (!audio.src && S.queue.length) { playAt(0); return; }
    if (audio.paused) { audio.play().catch(function() {}); setPlaying(true); }
    else { audio.pause(); setPlaying(false); }
  }

  // ---- Engagement ----
  function trackView(id) {
    if (!id) return;
    apiFetch("/engagement/view", { method: "POST", body: JSON.stringify({ releaseId: id, scope: "PREVIEW" }) }).catch(function() {});
  }

  function trackHeatmap(id, sec) {
    if (!id || !isFinite(sec)) return;
    apiFetch("/ecosystem/heatmap/" + id + "/events", { method: "POST", body: JSON.stringify({ secondMark: Math.floor(sec) }) }).catch(function() {});
  }

  // ---- Report ----
  function openReport(id) {
    if (!S.user) { notice("Connecte-toi pour signaler."); return; }
    S.reportId = id;
    S.reportReason = null;
    document.querySelectorAll(".rpt-btn").forEach(function(b) { b.classList.remove("sel"); });
    el("report-detail").value = "";
    el("report-modal").classList.add("open");
    backdrop(true);
  }

  async function sendReport() {
    if (!S.reportId || !S.reportReason) { notice("Selectionnez un motif."); return; }
    var r = await apiFetch("/ecosystem/reports", {
      method: "POST",
      body: JSON.stringify({ targetType: "RELEASE", releaseId: S.reportId, reason: S.reportReason, details: el("report-detail").value.trim() || undefined })
    });
    closeAll();
    notice(r.ok ? "Signalement envoye." : "Signalement refuse.", r.ok);
  }

  // ---- Share ----
  function openShare(id) {
    var r = byId(id);
    S.shareId = id;
    el("share-track-name").textContent = r ? r.title + " - " + artistName(r) : "";
    el("share-modal").classList.add("open");
    backdrop(true);
  }

  function shareUrl() {
    var r = byId(S.shareId);
    return r ? RECORDS + "/release/" + (r.slug || r.id) : "";
  }

  function shareDiscord() {
    var r = byId(S.shareId);
    var url = shareUrl();
    var title = r ? r.title + " - " + artistName(r) : "Sauroraa Music";
    var text = "Ecoute ca sur Sauroraa Music: " + title + " " + url;
    navigator.clipboard.writeText(text).catch(function() {});
    notice("Copie pour Discord !", true);
    registerShare();
  }

  function shareTwitter() {
    var url = shareUrl();
    var text = encodeURIComponent("Je stream ca sur Sauroraa Music\n" + url + " #SauroraaRecords");
    window.open("https://twitter.com/intent/tweet?text=" + text, "_blank");
    registerShare();
  }

  async function shareCopy() {
    var url = shareUrl();
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch(e) {}
    notice("Lien copie !", true);
    registerShare();
  }

  function registerShare() {
    if (!S.shareId) return;
    apiFetch("/engagement/share", { method: "POST", body: JSON.stringify({ releaseId: S.shareId }) }).catch(function() {});
    closeAll();
  }

  // ---- Comments ----
  async function openComments(id) {
    S.commentsId = id;
    var r = byId(id);
    el("comments-title").textContent = r ? "Commentaires : " + r.title : "Commentaires";
    el("comments-drawer").classList.add("open");
    backdrop(true);
    el("comments-list").innerHTML = "<div class=\"cmt\"><div class=\"c-body\" style=\"color:var(--muted)\">Chargement...</div></div>";
    try {
      var res = await apiFetch("/comments?releaseId=" + encodeURIComponent(id));
      if (!res.ok) throw new Error();
      var list = await res.json();
      if (!Array.isArray(list)) list = [];
      if (!list.length) {
        el("comments-list").innerHTML = "<div class=\"cmt\"><div class=\"c-body\" style=\"color:var(--muted)\">Aucun commentaire.</div></div>";
        return;
      }
      var html = "";
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        var ts = c.timestampSec != null ? "<span class=\"c-ts\">" + fmtTime(c.timestampSec) + "</span> " : "";
        html += "<div class=\"cmt\">";
        html += "<div class=\"c-meta\">" + esc((c.user && c.user.email) || "utilisateur") + " &middot; " + new Date(c.createdAt).toLocaleDateString("fr-FR") + "</div>";
        html += "<div class=\"c-body\">" + ts + esc(c.body) + "</div>";
        html += "</div>";
      }
      el("comments-list").innerHTML = html;
    } catch(e) {
      el("comments-list").innerHTML = "<div class=\"cmt\"><div class=\"c-body\">Impossible de charger.</div></div>";
    }
  }

  async function sendComment() {
    if (!S.commentsId) return;
    if (!S.user) { notice("Connecte-toi pour commenter."); return; }
    var body = el("comment-input").value.trim();
    if (!body) return;
    var m = body.match(/^@(\d+):(\d{2})\s*/);
    var ts = m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
    var r = await apiFetch("/comments", {
      method: "POST",
      body: JSON.stringify({ releaseId: S.commentsId, body: body.replace(/^@\d+:\d{2}\s*/, ""), timestampSec: ts })
    });
    if (!r.ok) { notice("Commentaire refuse."); return; }
    el("comment-input").value = "";
    await openComments(S.commentsId);
  }

  // ---- Event wiring ----
  function wireActions() {
    document.body.addEventListener("click", function(ev) {
      var btn = ev.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      var id = btn.getAttribute("data-id") || "";
      var slug = btn.getAttribute("data-slug") || "";

      if (action === "play") playById(id);
      else if (action === "comments") openComments(id);
      else if (action === "share") openShare(id);
      else if (action === "report") openReport(id);
      else if (action === "open" && slug) window.open(RECORDS + "/release/" + slug, "_blank");
      else if (action === "queue-add") {
        var r = byId(id);
        if (r && !S.queue.find(function(x) { return x.id === id; })) {
          S.queue.push(r);
          el("player-queue").textContent = "Q " + S.queue.length;
          notice("Ajoute a la queue.", true);
        }
      }
      else if (action === "artist-follow") {
        if (!S.user) { notice("Connecte-toi pour suivre."); return; }
        apiFetch("/follows/artist/" + encodeURIComponent(id), { method: "POST" })
          .then(function(r) { notice(r.ok ? "Follow envoye !" : "Deja suivi.", r.ok); })
          .catch(function() { notice("Erreur."); });
      }
      else if (action === "artist-open") window.open(RECORDS + "/artists/" + encodeURIComponent(id), "_blank");
      else if (action === "artist-releases") {
        var artistTracks = S.releases.filter(function(r) { return r.artistId === id; });
        renderReleases("tracks", artistTracks);
        document.getElementById("discover").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      else if (action === "dubpack-open" && slug) window.open(RECORDS + "/dubpacks/" + slug, "_blank");
      else if (action === "dubpack-buy" && slug) window.open(RECORDS + "/dubpacks/" + slug + "?buy=1", "_blank");
      else if (action === "playlist-play") {
        var pl = S.playlists.find(function(p) { return p.id === id; });
        var firstId = pl && pl.tracks && pl.tracks[0] && ((pl.tracks[0].release && pl.tracks[0].release.id) || pl.tracks[0].releaseId);
        if (firstId) playById(firstId);
        else notice("Playlist vide.");
      }
      else if (action === "playlist-manage") window.open(RECORDS + "/dashboard", "_blank");
    });
  }

  function wireUi() {
    el("user-btn").addEventListener("click", function(e) { e.stopPropagation(); toggleDrop(); });
    el("btn-records").addEventListener("click", openRecords);
    document.addEventListener("click", function(e) {
      if (!el("user-wrap").contains(e.target)) closeDrop();
    });

    el("comments-close").addEventListener("click", closeAll);
    el("comment-send").addEventListener("click", sendComment);
    el("comment-input").addEventListener("keydown", function(e) { if (e.key === "Enter") sendComment(); });

    document.querySelectorAll(".rpt-btn").forEach(function(b) {
      b.addEventListener("click", function() {
        document.querySelectorAll(".rpt-btn").forEach(function(x) { x.classList.remove("sel"); });
        b.classList.add("sel");
        S.reportReason = b.getAttribute("data-reason");
      });
    });
    el("report-send").addEventListener("click", sendReport);
    el("report-cancel").addEventListener("click", closeAll);

    el("shr-discord").addEventListener("click", shareDiscord);
    el("shr-twitter").addEventListener("click", shareTwitter);
    el("shr-copy").addEventListener("click", shareCopy);
    el("share-cancel").addEventListener("click", closeAll);
    el("share-now").addEventListener("click", function() { if (S.releaseId) openShare(S.releaseId); });

    el("backdrop").addEventListener("click", closeAll);

    el("search-input").addEventListener("input", function(e) {
      var q = e.target.value.toLowerCase().trim();
      document.querySelectorAll("section").forEach(function(sec) {
        if (sec.classList.contains("hero")) return;
        var cards = sec.querySelectorAll(".card");
        if (!cards.length) return;
        var any = false;
        cards.forEach(function(c) {
          var show = !q || (c.textContent || "").toLowerCase().indexOf(q) !== -1;
          c.style.display = show ? "" : "none";
          if (show) any = true;
        });
        sec.style.display = any || !q ? "" : "none";
      });
    });

    document.querySelectorAll("[data-genre]").forEach(function(b) {
      b.addEventListener("click", function() {
        document.querySelectorAll("[data-genre]").forEach(function(x) { x.classList.remove("active"); });
        b.classList.add("active");
        S.genre = b.getAttribute("data-genre");
        renderReleases("tracks", filtered());
        renderReleases("new-releases-grid", newReleases());
      });
    });

    document.querySelectorAll("#menu button").forEach(function(b) {
      b.addEventListener("click", function() {
        document.querySelectorAll("#menu button").forEach(function(x) { x.classList.remove("active"); });
        b.classList.add("active");
        var target = b.getAttribute("data-go");
        if (target === "search") {
          el("search-input").focus();
          el("search-input").scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        var sec = document.getElementById(target);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    var sectionIds = ["home", "discover", "trending", "new-releases", "artists", "dubpacks", "playlists", "library"];
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var sid = entry.target.id;
        document.querySelectorAll("#menu button").forEach(function(b) {
          b.classList.toggle("active", b.getAttribute("data-go") === sid);
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sectionIds.forEach(function(sid) { var s = document.getElementById(sid); if (s) obs.observe(s); });

    el("play-btn").addEventListener("click", togglePlay);
    el("next-btn").addEventListener("click", nextTrack);
    el("prev-btn").addEventListener("click", prevTrack);
    el("shuffle-btn").addEventListener("click", function() {
      S.shuffle = !S.shuffle;
      el("shuffle-btn").classList.toggle("playing", S.shuffle);
    });
    el("repeat-btn").addEventListener("click", function() {
      S.repeat = !S.repeat;
      el("repeat-btn").classList.toggle("playing", S.repeat);
    });
    el("volume").addEventListener("input", function(e) { audio.volume = Number(e.target.value); });
    el("progress-bar").addEventListener("click", function(e) {
      if (!audio.duration) return;
      var rect = e.currentTarget.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
  }

  function wireAudio() {
    audio.volume = Number(el("volume").value);
    var lastHeat = -10;
    audio.addEventListener("timeupdate", function() {
      var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      el("progress").style.width = pct.toFixed(2) + "%";
      var sec = Math.floor(audio.currentTime);
      if (sec - lastHeat >= 10 && S.releaseId) { lastHeat = sec; trackHeatmap(S.releaseId, sec); }
    });
    audio.addEventListener("ended", function() {
      if (S.repeat && S.releaseId) { playById(S.releaseId); return; }
      nextTrack();
    });
    audio.addEventListener("play", function() { setPlaying(true); });
    audio.addEventListener("pause", function() { setPlaying(false); });
  }

  // ---- Boot ----
  async function boot() {
    wireUi();
    wireActions();
    wireAudio();
    await refreshAuth();
    await Promise.allSettled([loadReleases(), loadTrending(), loadArtists(), loadDubpacks(), loadPlaylists()]);
    renderReleases("tracks", filtered());
    renderReleases("trending-grid", S.trending);
    renderReleases("new-releases-grid", newReleases());
    renderArtists(S.artists);
    renderDubpacks(S.dubpacks);
    renderPlaylists(S.playlists);
    updateMeta(null);
  }

  boot();
</script>
</body>
</html>`);
});

app.listen(port, () => console.log("[music-web] :" + port));
