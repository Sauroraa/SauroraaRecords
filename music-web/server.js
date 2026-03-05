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
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f7f8fb;
      --bg-2: #eef1f7;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #5f6b84;
      --line: #dbe1ec;
      --brand: #1273ea;
      --brand-2: #12b8ea;
      --radius: 16px;
      --shadow: 0 10px 30px rgba(14, 24, 46, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Manrope", sans-serif;
      color: var(--text);
      background:
        radial-gradient(1200px 540px at 20% -5%, rgba(18,115,234,0.16), transparent 70%),
        radial-gradient(1200px 540px at 100% 110%, rgba(18,184,234,0.14), transparent 70%),
        linear-gradient(180deg, var(--bg), var(--bg-2));
      min-height: 100vh;
    }
    .app {
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: 100vh;
    }
    .side {
      position: sticky;
      top: 0;
      height: 100vh;
      background: rgba(255,255,255,0.82);
      border-right: 1px solid var(--line);
      backdrop-filter: blur(10px);
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .brand {
      padding: 8px 10px 14px;
      border-bottom: 1px solid var(--line);
    }
    .brand .t1 { font-size: 12px; color: var(--muted); margin-bottom: 3px; }
    .brand .t2 { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
    .nav { display: grid; gap: 6px; margin-top: 4px; }
    .nav button {
      all: unset;
      cursor: pointer;
      border: 1px solid transparent;
      color: #24304a;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 14px;
      font-weight: 700;
      transition: .16s ease;
    }
    .nav button:hover { border-color: var(--line); background: #fff; }
    .nav button.active {
      border-color: rgba(18,115,234,0.38);
      background: linear-gradient(90deg, rgba(18,115,234,0.12), rgba(18,184,234,0.08));
      color: #0c4da8;
    }
    .side-footer {
      margin-top: auto;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      padding: 10px;
      font-family: "IBM Plex Mono", monospace;
      font-size: 11px;
      color: #3e4a65;
      word-break: break-all;
    }
    .main { padding: 22px 22px 128px; }
    .top {
      display: grid;
      grid-template-columns: 1fr auto auto auto auto;
      gap: 10px;
      align-items: center;
      margin-bottom: 14px;
    }
    .input {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px 13px;
      background: #fff;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      width: 100%;
    }
    .btn {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      color: #1f2a44;
      padding: 10px 13px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: .16s ease;
    }
    .btn:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
    .btn.brand { color: #fff; border-color: transparent; background: linear-gradient(120deg, var(--brand), var(--brand-2)); }
    .status { margin: 0 0 14px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: #364463; }
    .hero {
      border: 1px solid #cfd9ea;
      border-radius: 20px;
      background:
        radial-gradient(700px 200px at 30% -40%, rgba(18,115,234,0.22), transparent 70%),
        radial-gradient(700px 200px at 100% 130%, rgba(18,184,234,0.18), transparent 70%),
        #fff;
      padding: 20px;
      margin-bottom: 18px;
      box-shadow: var(--shadow);
    }
    .hero h1 { margin: 0; font-size: 38px; line-height: 1.05; letter-spacing: -0.03em; }
    .hero p { margin: 10px 0 0; color: var(--muted); max-width: 840px; font-size: 15px; line-height: 1.45; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .pill {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
      color: #2c3954;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 800;
    }
    .pill.active { border-color: rgba(18,115,234,0.45); background: rgba(18,115,234,0.09); color: #0b56b4; }
    section { margin-top: 18px; }
    section h2 { margin: 0 0 10px; font-size: 22px; letter-spacing: -0.02em; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 11px;
      box-shadow: var(--shadow);
      transition: .18s ease;
    }
    .card:hover { transform: translateY(-2px); border-color: #becbe2; }
    .cover {
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: 12px;
      background: linear-gradient(130deg, rgba(18,115,234,0.95), rgba(18,184,234,0.9));
      margin-bottom: 10px;
      background-size: cover;
      background-position: center;
    }
    .title { margin: 0 0 3px; font-weight: 800; font-size: 16px; letter-spacing: -0.01em; }
    .meta { margin: 0; color: var(--muted); font-size: 13px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
    .mono { font-family: "IBM Plex Mono", monospace; font-size: 11px; color: #486084; font-weight: 700; }
    .actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 9px; }
    .a-btn {
      border: 1px solid var(--line);
      border-radius: 9px;
      background: #fff;
      color: #233150;
      font-size: 11px;
      font-weight: 800;
      padding: 7px 8px;
      cursor: pointer;
      text-align: center;
    }
    .a-btn.play { border-color: transparent; color: #fff; background: linear-gradient(120deg, var(--brand), var(--brand-2)); }
    .artist-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 10px; align-items: center; margin-top: 8px; }
    .avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid #d7e3f8;
      background: linear-gradient(120deg, #93bcff, #91ecff);
      background-size: cover;
      background-position: center;
    }
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      max-width: 100%;
      height: 100vh;
      background: #fff;
      border-left: 1px solid var(--line);
      box-shadow: -16px 0 34px rgba(17, 31, 55, 0.12);
      transform: translateX(110%);
      transition: .24s ease;
      z-index: 90;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    .drawer.open { transform: translateX(0); }
    .d-head {
      padding: 14px 14px 10px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .d-list { padding: 11px 12px; overflow: auto; display: grid; align-content: start; gap: 9px; }
    .cmt { border: 1px solid var(--line); border-radius: 11px; padding: 9px; background: #fbfcff; }
    .cmt .m1 { font-size: 12px; color: #3f4f70; margin-bottom: 4px; font-weight: 800; }
    .cmt .m2 { font-size: 13px; color: #1f2c47; }
    .d-form {
      border-top: 1px solid var(--line);
      padding: 10px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      background: #fff;
    }
    .player {
      position: fixed;
      left: 268px;
      right: 18px;
      bottom: 14px;
      border: 1px solid #c8d5eb;
      border-radius: 18px;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 12px 30px rgba(25, 41, 70, 0.12);
      padding: 10px 12px;
      z-index: 70;
      display: grid;
      grid-template-columns: 1fr 1.4fr 1fr;
      gap: 10px;
      align-items: center;
    }
    .p-track { display: grid; grid-template-columns: 42px 1fr; gap: 9px; align-items: center; }
    .p-thumb {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(120deg, var(--brand), var(--brand-2));
      background-size: cover;
      background-position: center;
    }
    .p-title { font-size: 14px; font-weight: 800; line-height: 1.2; margin: 0; }
    .p-sub { margin: 2px 0 0; font-size: 12px; color: #516181; }
    .p-mid { display: grid; gap: 7px; }
    .p-ctrl { display: flex; justify-content: center; gap: 7px; }
    .icon-btn {
      border: 1px solid var(--line);
      border-radius: 999px;
      width: 34px;
      height: 34px;
      cursor: pointer;
      background: #fff;
      font-weight: 900;
      color: #2f3d5a;
    }
    .icon-btn.playing { border-color: transparent; color: #fff; background: linear-gradient(120deg, var(--brand), var(--brand-2)); }
    .bar { height: 8px; border-radius: 999px; background: #d8e2f3; overflow: hidden; }
    .bar i { display: block; width: 0%; height: 100%; background: linear-gradient(90deg, var(--brand), var(--brand-2)); }
    .p-right {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      font-family: "IBM Plex Mono", monospace;
      font-size: 11px;
      color: #3f4e6e;
    }
    .vol { width: 88px; }
    @media (max-width: 1200px) {
      .grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
      .top { grid-template-columns: 1fr auto auto; }
      #btn-profile, #btn-register { display: none; }
    }
    @media (max-width: 980px) {
      .app { grid-template-columns: 1fr; }
      .side { display: none; }
      .player { left: 10px; right: 10px; grid-template-columns: 1fr; }
      .grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .main { padding: 12px 12px 186px; }
    }
    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 28px; }
      .top { grid-template-columns: 1fr auto auto; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="side">
      <div class="brand">
        <div class="t1">Sauroraa Ecosystem</div>
        <div class="t2">Music</div>
      </div>
      <nav class="nav" id="menu">
        <button class="active" data-go="home">Home</button>
        <button data-go="discover">Discover</button>
        <button data-go="trending">Trending</button>
        <button data-go="artists">Artists</button>
        <button data-go="library">Library</button>
        <button data-go="search">Search</button>
      </nav>
      <div class="side-footer">API ${apiBase}</div>
    </aside>

    <main class="main">
      <header class="top" id="search">
        <input class="input" id="search-input" placeholder="Search tracks, artists, genres..." />
        <button class="btn" id="btn-login">Connexion</button>
        <button class="btn" id="btn-logout" style="display:none">Logout</button>
        <button class="btn" id="btn-profile">Profil</button>
        <button class="btn brand" id="btn-register">Inscription sur Records</button>
      </header>
      <p class="status" id="auth-status">Session: guest</p>

      <section class="hero" id="home">
        <h1>Clean UX. Tout connecte a Records.</h1>
        <p>
          Connexion partagee, profil unique, artistes unifies, commentaires et stats centralises.
          Chaque action sur Music alimente les memes donnees que Records.
        </p>
        <div class="toolbar">
          <button class="pill active" data-genre="ALL">All</button>
          <button class="pill" data-genre="HOUSE">House</button>
          <button class="pill" data-genre="TECHNO">Techno</button>
          <button class="pill" data-genre="DNB">DNB</button>
          <button class="pill" data-genre="RAP">Rap</button>
        </div>
      </section>

      <section id="discover">
        <h2>Tracks</h2>
        <div class="grid" id="tracks"></div>
      </section>

      <section id="trending">
        <h2>Trending</h2>
        <div class="grid" id="trending-grid"></div>
      </section>

      <section id="artists">
        <h2>Artists</h2>
        <div class="grid" id="artists-grid"></div>
      </section>

      <section id="library">
        <h2>Library / Data Records</h2>
        <div class="card">
          <p class="title" style="margin-bottom:4px">Actions rapides</p>
          <p class="meta">Tout pointe vers ton ecosysteme records pour garder des stats propres.</p>
          <div class="actions" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:10px">
            <button class="a-btn" id="go-records-home">Records Home</button>
            <button class="a-btn" id="go-records-catalog">Records Catalog</button>
            <button class="a-btn" id="go-records-profile">Mon Profil</button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <aside class="drawer" id="comments-drawer">
    <div class="d-head">
      <strong id="comments-title">Commentaires</strong>
      <button class="btn" id="comments-close">Fermer</button>
    </div>
    <div class="d-list" id="comments-list"></div>
    <div class="d-form">
      <input class="input" id="comment-input" placeholder="Ecris un commentaire..." />
      <button class="btn brand" id="comment-send">Publier</button>
    </div>
  </aside>

  <div class="player">
    <div class="p-track">
      <div class="p-thumb" id="player-thumb"></div>
      <div>
        <p class="p-title" id="player-title">Aucun track</p>
        <p class="p-sub" id="player-sub">Selectionne un track</p>
      </div>
    </div>
    <div class="p-mid">
      <div class="p-ctrl">
        <button class="icon-btn" id="prev-btn">&lt;&lt;</button>
        <button class="icon-btn" id="play-btn">&gt;</button>
        <button class="icon-btn" id="next-btn">&gt;&gt;</button>
        <button class="icon-btn" id="shuffle-btn">S</button>
        <button class="icon-btn" id="repeat-btn">R</button>
      </div>
      <div class="bar"><i id="progress"></i></div>
    </div>
    <div class="p-right">
      <span id="player-bpm">BPM ---</span>
      <span id="player-queue">Q 0</span>
      <input class="vol" id="volume" type="range" min="0" max="1" step="0.01" value="0.72" />
      <button class="btn" id="share-now">Share</button>
    </div>
  </div>

  <audio id="audio"></audio>

  <script>
    const API = "/api";
    const RECORDS = "${recordsBase}";
    const state = {
      user: null,
      releases: [],
      trending: [],
      artists: [],
      queue: [],
      currentIndex: -1,
      currentReleaseId: null,
      currentCommentsReleaseId: null,
      genre: "ALL",
      shuffle: false,
      repeat: false
    };

    const audio = document.getElementById("audio");
    const $ = (id) => document.getElementById(id);

    function escapeHTML(v) {
      return String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function api(path, opts = {}) {
      return fetch(API + path, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        ...opts
      });
    }

    function normalizeAudioPath(v) {
      if (!v) return null;
      if (v.startsWith("http://") || v.startsWith("https://")) return v;
      if (v.startsWith("/")) return v;
      return "/uploads/" + v;
    }

    function releaseArtistName(r) {
      return r.artist?.displayName || r.artist?.user?.email || "Unknown artist";
    }

    function cardActions(r) {
      return '<div class="actions">' +
        '<button class="a-btn play" data-action="play" data-id="' + r.id + '">Play</button>' +
        '<button class="a-btn" data-action="comments" data-id="' + r.id + '">Comments</button>' +
        '<button class="a-btn" data-action="share" data-id="' + r.id + '">Share</button>' +
        '<button class="a-btn" data-action="open" data-slug="' + (r.slug || "") + '">Open</button>' +
      '</div>';
    }

    function renderReleases(targetId, list) {
      const root = $(targetId);
      if (!list.length) {
        root.innerHTML = '<div class="card"><p class="meta">No tracks found.</p></div>';
        return;
      }
      root.innerHTML = list.map((r) => {
        const cover = normalizeAudioPath(r.coverPath) || "";
        return '<article class="card" data-title="' + escapeHTML(r.title.toLowerCase()) + '" data-artist="' + escapeHTML(releaseArtistName(r).toLowerCase()) + '">' +
          '<div class="cover" style="background-image:url(\'' + escapeHTML(cover) + '\')"></div>' +
          '<p class="title">' + escapeHTML(r.title) + '</p>' +
          '<p class="meta">' + escapeHTML(releaseArtistName(r)) + '</p>' +
          '<div class="row"><span class="mono">BPM ' + escapeHTML(r.bpm || "---") + '</span><span class="mono">' + escapeHTML(r.genre || "GEN") + '</span></div>' +
          cardActions(r) +
        '</article>';
      }).join("");
    }

    function renderArtists(list) {
      const root = $("artists-grid");
      if (!list.length) {
        root.innerHTML = '<div class="card"><p class="meta">No artists found.</p></div>';
        return;
      }
      root.innerHTML = list.map((a) => {
        const name = a.displayName || [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ") || a.user?.email || "Artist";
        const avatar = a.avatarPath ? normalizeAudioPath(a.avatarPath) : "";
        return '<article class="card">' +
          '<div class="artist-row">' +
            '<div class="avatar" style="background-image:url(\'' + escapeHTML(avatar) + '\')"></div>' +
            '<div><p class="title">' + escapeHTML(name) + '</p><p class="meta">' + escapeHTML(a.genre || "Artist") + '</p></div>' +
            '<button class="btn" data-action="artist-open" data-id="' + a.id + '">Profil</button>' +
          '</div>' +
          '<div class="actions" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
            '<button class="a-btn" data-action="artist-follow" data-id="' + a.id + '">Follow</button>' +
            '<button class="a-btn" data-action="artist-release" data-id="' + a.id + '">Releases</button>' +
          '</div>' +
        '</article>';
      }).join("");
    }

    function updatePlayerMeta(r) {
      $("player-title").textContent = r ? r.title : "Aucun track";
      $("player-sub").textContent = r ? releaseArtistName(r) : "Selectionne un track";
      $("player-bpm").textContent = "BPM " + (r?.bpm || "---");
      $("player-queue").textContent = "Q " + state.queue.length;
      const cover = r ? normalizeAudioPath(r.coverPath) : "";
      $("player-thumb").style.backgroundImage = cover ? "url('" + cover.replaceAll("'", "\\'") + "')" : "";
    }

    async function refreshAuthState() {
      const loginBtn = $("btn-login");
      const logoutBtn = $("btn-logout");
      const txt = $("auth-status");
      try {
        const res = await api("/auth/me");
        if (!res.ok) throw new Error("not-auth");
        const user = await res.json();
        state.user = user;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "";
        txt.textContent = "Session: " + (user.email || user.userId);
      } catch {
        state.user = null;
        loginBtn.style.display = "";
        logoutBtn.style.display = "none";
        txt.textContent = "Session: guest";
      }
    }

    async function loginPrompt() {
      const email = prompt("Email");
      if (!email) return;
      const password = prompt("Mot de passe");
      if (!password) return;
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        alert("Connexion refusee.");
        return;
      }
      await refreshAuthState();
    }

    async function logoutNow() {
      await api("/auth/logout", { method: "POST" });
      await refreshAuthState();
    }

    async function loadReleases() {
      const res = await api("/releases");
      if (!res.ok) throw new Error("releases-failed");
      const data = await res.json();
      state.releases = data;
      state.queue = [...data];
    }

    async function loadTrending() {
      const res = await api("/releases/trending");
      state.trending = res.ok ? await res.json() : [];
    }

    async function loadArtists() {
      const res = await api("/artists");
      state.artists = res.ok ? await res.json() : [];
    }

    function filteredReleases() {
      return state.releases.filter((r) => {
        if (state.genre === "ALL") return true;
        return (r.genre || "").toUpperCase() === state.genre;
      });
    }

    function byId(id) {
      return state.releases.find((r) => r.id === id) || state.trending.find((r) => r.id === id);
    }

    async function trackView(releaseId) {
      if (!releaseId) return;
      await api("/engagement/view", {
        method: "POST",
        body: JSON.stringify({
          releaseId,
          scope: "PREVIEW",
          playlistPath: window.location.pathname
        })
      });
    }

    async function shareRelease(releaseId) {
      if (!releaseId) return;
      const res = await api("/engagement/share", {
        method: "POST",
        body: JSON.stringify({ releaseId })
      });
      if (res.status === 401) {
        alert("Connecte-toi pour partager.");
        return;
      }
      if (!res.ok) {
        alert("Partage indisponible.");
        return;
      }
      alert("Partage enregistre.");
    }

    async function openComments(releaseId) {
      state.currentCommentsReleaseId = releaseId;
      $("comments-drawer").classList.add("open");
      $("comments-title").textContent = "Commentaires";
      $("comments-list").innerHTML = '<div class="cmt"><div class="m2">Chargement...</div></div>';
      const res = await api("/comments?releaseId=" + encodeURIComponent(releaseId));
      if (!res.ok) {
        $("comments-list").innerHTML = '<div class="cmt"><div class="m2">Impossible de charger.</div></div>';
        return;
      }
      const list = await res.json();
      $("comments-list").innerHTML = list.length ? list.map((c) =>
        '<div class="cmt"><div class="m1">' + escapeHTML(c.user?.email || "user") + '</div><div class="m2">' + escapeHTML(c.body) + "</div></div>"
      ).join("") : '<div class="cmt"><div class="m2">Pas encore de commentaire.</div></div>';
    }

    async function sendComment() {
      if (!state.currentCommentsReleaseId) return;
      const body = $("comment-input").value.trim();
      if (!body) return;
      const res = await api("/comments", {
        method: "POST",
        body: JSON.stringify({ releaseId: state.currentCommentsReleaseId, body })
      });
      if (res.status === 401) {
        alert("Connecte-toi pour commenter.");
        return;
      }
      if (!res.ok) {
        alert("Commentaire refuse.");
        return;
      }
      $("comment-input").value = "";
      await openComments(state.currentCommentsReleaseId);
    }

    async function playReleaseById(releaseId) {
      const r = byId(releaseId);
      if (!r) return;
      state.currentReleaseId = r.id;
      const src = normalizeAudioPath(r.previewClip || r.audioPath);
      if (src) {
        audio.src = src;
        await audio.play().catch(() => {});
      }
      $("play-btn").classList.add("playing");
      $("play-btn").textContent = "||";
      updatePlayerMeta(r);
      await trackView(r.id);
      state.currentIndex = state.queue.findIndex((x) => x.id === r.id);
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
        const i = Math.floor(Math.random() * state.queue.length);
        await playAt(i);
        return;
      }
      await playAt(state.currentIndex + 1);
    }

    async function prevTrack() {
      if (!state.queue.length) return;
      await playAt(state.currentIndex - 1);
    }

    function togglePlay() {
      if (!audio.src && state.queue.length) {
        playAt(state.currentIndex >= 0 ? state.currentIndex : 0);
        return;
      }
      if (audio.paused) {
        audio.play().catch(() => {});
        $("play-btn").classList.add("playing");
        $("play-btn").textContent = "||";
      } else {
        audio.pause();
        $("play-btn").classList.remove("playing");
        $("play-btn").textContent = ">";
      }
    }

    function wireMainActions() {
      document.body.addEventListener("click", async (ev) => {
        const btn = ev.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        if (action === "play") await playReleaseById(btn.getAttribute("data-id"));
        if (action === "comments") await openComments(btn.getAttribute("data-id"));
        if (action === "share") await shareRelease(btn.getAttribute("data-id"));
        if (action === "open") {
          const slug = btn.getAttribute("data-slug");
          if (slug) window.open(RECORDS + "/release/" + slug, "_blank");
        }
        if (action === "artist-open") window.open(RECORDS + "/artists", "_blank");
        if (action === "artist-follow") {
          const id = btn.getAttribute("data-id");
          const res = await api("/follows/artist/" + encodeURIComponent(id), { method: "POST" });
          alert(res.ok ? "Follow envoye." : "Follow indisponible.");
        }
        if (action === "artist-release") {
          const id = btn.getAttribute("data-id");
          const list = state.releases.filter((r) => r.artistId === id);
          renderReleases("tracks", list);
          document.getElementById("discover").scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    function wireUi() {
      $("btn-login").addEventListener("click", loginPrompt);
      $("btn-logout").addEventListener("click", logoutNow);
      $("btn-register").addEventListener("click", () => { window.location.href = RECORDS + "/register"; });
      $("btn-profile").addEventListener("click", () => { window.location.href = RECORDS + "/dashboard/artist"; });
      $("share-now").addEventListener("click", () => shareRelease(state.currentReleaseId));
      $("comments-close").addEventListener("click", () => { $("comments-drawer").classList.remove("open"); });
      $("comment-send").addEventListener("click", sendComment);

      $("go-records-home").addEventListener("click", () => { window.location.href = RECORDS + "/"; });
      $("go-records-catalog").addEventListener("click", () => { window.location.href = RECORDS + "/catalog"; });
      $("go-records-profile").addEventListener("click", () => { window.location.href = RECORDS + "/dashboard/artist"; });

      $("search-input").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();
        for (const card of document.querySelectorAll("#tracks .card, #trending-grid .card, #artists-grid .card")) {
          const txt = (card.textContent || "").toLowerCase();
          card.style.display = txt.includes(q) ? "" : "none";
        }
      });

      document.querySelectorAll("[data-genre]").forEach((b) => {
        b.addEventListener("click", () => {
          document.querySelectorAll("[data-genre]").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          state.genre = b.getAttribute("data-genre");
          renderReleases("tracks", filteredReleases());
        });
      });

      document.querySelectorAll("#menu button").forEach((b) => {
        b.addEventListener("click", () => {
          document.querySelectorAll("#menu button").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          const target = b.getAttribute("data-go");
          const el = document.getElementById(target);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

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
      $("volume").addEventListener("input", (e) => {
        audio.volume = Number(e.target.value || 0.72);
      });
    }

    function wireAudio() {
      audio.volume = Number($("volume").value || 0.72);
      audio.addEventListener("timeupdate", () => {
        const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        $("progress").style.width = ratio.toFixed(2) + "%";
      });
      audio.addEventListener("ended", async () => {
        if (state.repeat && state.currentReleaseId) {
          await playReleaseById(state.currentReleaseId);
          return;
        }
        await nextTrack();
      });
    }

    async function boot() {
      wireUi();
      wireMainActions();
      wireAudio();
      await refreshAuthState();
      await Promise.allSettled([loadReleases(), loadTrending(), loadArtists()]);
      renderReleases("tracks", filteredReleases());
      renderReleases("trending-grid", state.trending);
      renderArtists(state.artists);
      updatePlayerMeta(null);
      if (state.queue.length) {
        await playReleaseById(state.queue[0].id);
      }
    }

    boot();
  </script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log("[music-web] listening on :" + port);
});
