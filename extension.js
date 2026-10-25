/* Gacha UI Style v1.10.60 — personal extension for Gacha Forge 1.8.13 on Marinara Engine.
 * Adds "말랑 · 트릭컬풍" to Settings → 화면 → UI 스타일, next to the game's own five, and while it is on:
 *  - its colours: five presets or eight picked colours (the game's theme tokens are derived from them),
 *  - its shapes: thick outlines, buttons that press down, ribbon name tags, polka-dot ground,
 *  - story: an opaque rounded dialogue box, portraits framed as stickers, SD (chibi) standing sprites,
 *  - battle: SD sprites standing on the unit cards, hopping when they act and squashing when hit,
 *  - a loading screen in the Trickcal Revive manner (bouncing SD, tip bubble, a capsule bar an SD runs along),
 *  - an "SD 캐릭터 만들기" panel that draws transparent-background chibis of the world's characters through
 *    the engine's own image connections and keeps them in the gallery.
 * The game draws every screen from theme tokens on .gf-arena, so the look is an adopted stylesheet keyed on
 * attributes of the game's host element: it survives the game rewriting its shadow root on every render and
 * never touches the world's saved HUD style. Picking any of the game's styles turns it off again.
 * Kept: on/off per browser (localStorage); colours, options and SD sprites in this extension's server storage,
 * so every device sees the same. */
(() => {
  "use strict";
  const KEY = "__GF_UI_STYLE_EXTENSION";
  if (typeof window[KEY] === "function") {
    try { window[KEY](); } catch {}
  }

  /* Every request this extension makes carries the admin secret the way Gacha Forge's own requests do. On a
   * device other than the server's own (phone, tablet, another PC) Marinara refuses requests without it —
   * "Invalid or missing X-Admin-Secret header" — and the character list never loaded there. */
  const ADMIN_SECRET_KEY = "marinara_admin_secret";
  function adminHeaders() {
    try { const t = (localStorage.getItem(ADMIN_SECRET_KEY) || "").trim(); return t ? { "X-Admin-Secret": t } : {}; } catch { return {}; }
  }
  const fetch = (url, opts = {}) => window.fetch(url, { ...opts, headers: { ...adminHeaders(), ...(opts.headers || {}) } });

  const HOST_TAG = "marinara-capability-gacha-forge";
  const ATTR = "data-gfx-style";
  const STORE = "gfx-ui-style";
  const CACHE = "gfx-ui-style-cache";
  // Modern full-page extensions receive `marinara`; keep the older `extension.id` fallback for old engines.
  const MARINARA = typeof marinara !== "undefined" && marinara ? marinara : null;
  const EXT_ID = MARINARA?.extension?.id ? String(MARINARA.extension.id) : MARINARA?.extensionId ? String(MARINARA.extensionId)
    : typeof extension !== "undefined" && extension && extension.id ? String(extension.id) : "";
  const FONT_FAMILIES = ["Jua", "Gowun Dodum", "Noto Sans KR", "Nanum Gothic"];
  const FONT_CHOICES = [...FONT_FAMILIES, "system-ui"];
  const STYLES = [["trickcal", "말랑", "트릭컬풍 · 색은 직접 고르기"]];

  /* ═════════════ Settings model ═════════════ */
  const COLOR_FIELDS = [
    ["ink", "바탕"], ["card", "카드"], ["text", "글자"], ["line", "외곽선"],
    ["accent", "강조 버튼"], ["pick", "선택 표시"], ["sky1", "배경 1"], ["sky2", "배경 2"],
  ];
  const PRESETS = [
    ["cream", "크림 코코아", { ink: "#FFF4D9", card: "#FFFDF5", text: "#5A3A24", line: "#6B4528", accent: "#F0763A", pick: "#FFE17A", sky1: "#FFE08A", sky2: "#BDE9DA" }],
    ["berry", "딸기 우유", { ink: "#FFEFF3", card: "#FFFBFC", text: "#6A2E45", line: "#7A3550", accent: "#F2557F", pick: "#FFD3E0", sky1: "#FFC9DA", sky2: "#FFF1C9" }],
    ["mint", "민트 초코", { ink: "#EAF8F1", card: "#FBFFFD", text: "#2F4A3E", line: "#3B5A4B", accent: "#2FA97C", pick: "#C4F2DC", sky1: "#BDEFD9", sky2: "#FFE9B8" }],
    ["lavender", "라벤더", { ink: "#F2EEFF", card: "#FDFCFF", text: "#45386E", line: "#4F3F85", accent: "#8C6CF0", pick: "#E1D6FF", sky1: "#D9CCFF", sky2: "#CDEBFF" }],
    ["night", "밤하늘", { ink: "#2B2F4A", card: "#383D60", text: "#FFF1D6", line: "#14162A", accent: "#FFB347", pick: "#FFD166", sky1: "#3B3F6B", sky2: "#5B3F6E" }],
  ];
  const DEFAULT_COLORS = PRESETS[0][2];
  const OPTION_FIELDS = [
    ["box", "불투명 대화창", "스토리 대화창을 둥근 크림 상자로 바꿉니다. 끄면 대화창은 원래(다른 확장의 투명도 포함)대로입니다."],
    ["sticker", "스티커 초상", "스토리 초상화에 흰 테두리와 외곽선을 둘러 스티커처럼 보이게 합니다."],
    ["motion", "말랑 움직임", "초상과 SD 캐릭터가 숨 쉬듯 움직이고, 등장할 때 통 튀어나옵니다."],
    ["storySd", "스토리에 SD", "SD 캐릭터를 만든 인물은 스토리에서 초상 대신 SD 스탠딩으로 나옵니다."],
    ["battleSd", "전투에 SD", "SD 캐릭터를 만든 인물은 전투 카드 위에 SD로 서 있습니다."],
    ["loading", "로딩 화면", "불러오는 동안 SD 캐릭터와 팁이 나오는 로딩 화면을 띄웁니다."],
  ];
  // Whole-screen makeovers in the Trickcal Revive manner, each its own switch.
  const SCREEN_FIELDS = [
    ["field", "전투 필드", "카드 대신 아군은 왼쪽, 적은 오른쪽 땅 위에 서서 싸웁니다. 행동 버튼은 아래 한 줄로 모입니다. 끄면 원래 카드 전투입니다."],
    ["team", "편성 · 출격 캐릭터", "편성 칸과 전투 시작 화면에 팀 캐릭터가 둥실 떠 있습니다."],
    ["lobby", "홈 로비", "홈 배경 위에 캐릭터들이 서서 돌아다닙니다. 누르면 말을 겁니다. 아래 목록에서 누구를 둘지 고르고, 홈의 [배치] 버튼으로 옮깁니다."],
    ["hidePlate", "홈 대표 카드 숨기기", "홈 왼쪽의 대표 캐릭터 카드를 숨겨 로비를 넓게 씁니다."],
    ["attend", "출석 이벤트", "7일 출석판을 도장 찍는 출석부로 바꾸고, 캐릭터가 옆에서 반겨 줍니다."],
    ["autoScroll", "스토리 자동 스크롤", "챕터 목록과 챕터 지도를 열면 지금 할 차례(계속 · 플레이)로 바로 내려갑니다."],
  ];
  const DEFAULT_OPTS = { box: true, sticker: true, motion: true, storySd: true, battleSd: true, loading: true,
    field: true, team: true, lobby: true, hidePlate: true, attend: true, autoScroll: true };
  const LOBBY_LINES = ["반가워!", "오늘도 힘내자~", "말랑말랑…", "간식 없어?", "같이 모험 가자!", "쿨쿨…", "볼 꼬집지 마!", "어디 가?", "히히, 들켰다!", "출석 도장 찍었어?"];
  const OLD_GEN_TEMPLATE = "5::chibi, chibi only::, solo, Transparent background, full body, standing, looking at viewer, {appearance}";
  const DEFAULT_GEN = {
    connectionId: "",
    template: "4::chibi, chibi only::, solo, Transparent background, 1.2::full body::, shoes, standing, looking at viewer, {appearance}",
    negative: "multiple views, text, watermark, scenery, background",
    size: "832x1216",
  };
  const SIZES = [["832x1216", "세로 832×1216"], ["1024x1024", "정사각 1024"]];
  const TIPS = [
    "스토리 “다시 읽기”는 활력을 쓰지 않아요.",
    "설정 → 말랑 탭에서 색을 마음대로 바꿀 수 있어요.",
    "SD 캐릭터는 설정 → 말랑 탭 → SD 관리에서 만들 수 있어요.",
    "로딩 중인 캐릭터를 눌러 보세요. 말랑해요.",
    "편성할 때 속성 상성을 맞추면 전투가 훨씬 쉬워져요.",
    "활력은 시간이 지나면 다시 차올라요.",
    "대화 기록 버튼으로 지나간 대사를 다시 볼 수 있어요.",
    "투명 배경 SD는 스토리와 전투에서 스티커처럼 서 있어요.",
  ];

  const life = new AbortController();
  // Disposable DOM nodes own their listeners; a global abort signal would retain every redrawn SD/editor.
  const on = (target, type, fn, opts = {}) => target.addEventListener(type, fn,
    target === window || target === document || target instanceof ShadowRoot ? { ...opts, signal: life.signal } : opts);
  let disposed = false;

  function readStyle() {
    try { const v = localStorage.getItem(STORE); return STYLES.some(([id]) => id === v) ? v : ""; }
    catch { return ""; }
  }
  // The pick is kept in this browser for the first frame and in the server prefs for every other device.
  function writeStyle(v, share = true) {
    try { if (v) localStorage.setItem(STORE, v); else localStorage.removeItem(STORE); } catch {}
    if (share && typeof prefs === "object" && prefs) { prefs.style = v || ""; savePrefs(); }
  }
  let current = readStyle();

  // prefs: { colors, preset, opts, gen } — mirrored in localStorage so the first paint already has them.
  const cleanColor = (v, d) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : d);
  function normalizePrefs(p) {
    p = p && typeof p === "object" ? p : {};
    const colors = {};
    for (const [k] of COLOR_FIELDS) colors[k] = cleanColor(p.colors && p.colors[k], DEFAULT_COLORS[k]);
    const opts = {};
    for (const [k] of [...OPTION_FIELDS, ...SCREEN_FIELDS]) opts[k] = p.opts && typeof p.opts[k] === "boolean" ? p.opts[k] : DEFAULT_OPTS[k];
    // home: { runId: { name: { on, x, y, s } } } — x/y are the feet in % of the home screen, s a scale.
    const home = {};
    const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    for (const [run, cast] of Object.entries(p.home && typeof p.home === "object" ? p.home : {})) {
      if (!cast || typeof cast !== "object") continue;
      home[run] = {};
      for (const [name, e] of Object.entries(cast)) {
        if (!e || typeof e !== "object") continue;
        home[run][name] = { on: e.on !== false, x: num(e.x, 0, 100, NaN), y: num(e.y, 0, 100, NaN), s: num(e.s, 0.4, 2.5, 1) };
      }
    }
    const homeScene = {};
    for (const [run, raw] of Object.entries(p.homeScene && typeof p.homeScene === "object" ? p.homeScene : {})) {
      if (!raw || typeof raw !== "object") continue;
      const backY = num(raw.backY, 42, 88, 66);
      const frontY = num(raw.frontY, backY + 8, 96, 94);
      const backL = num(raw.backL, 0, 94, 22), backR = num(raw.backR, backL + 6, 100, 78);
      const frontL = num(raw.frontL, 0, 94, 3), frontR = num(raw.frontR, frontL + 6, 100, 97);
      homeScene[run] = {
        vpX: num(raw.vpX, 0, 100, 50), vpY: num(raw.vpY, 0, Math.max(0, backY - 4), 42),
        backL, backR, backY, frontL, frontR, frontY,
      };
    }
    const g = p.gen && typeof p.gen === "object" ? p.gen : {};
    const gen = {
      connectionId: typeof g.connectionId === "string" ? g.connectionId : "",
      template: typeof g.template === "string" && g.template.trim() && g.template !== OLD_GEN_TEMPLATE ? g.template : DEFAULT_GEN.template,
      negative: typeof g.negative === "string" ? g.negative : DEFAULT_GEN.negative,
      size: SIZES.some(([s]) => s === g.size) ? g.size : DEFAULT_GEN.size,
    };
    const lobbyScale = typeof p.lobbyScale === "number" && Number.isFinite(p.lobbyScale) ? Math.min(2, Math.max(0.5, p.lobbyScale)) : 1;
    const storyCast = [2, 3, 4, 5].includes(p.storyCast) ? p.storyCast : 3;
    const boxOpacity = typeof p.boxOpacity === "number" && Number.isFinite(p.boxOpacity) ? Math.min(100, Math.max(20, Math.round(p.boxOpacity))) : 95;
    const style = typeof p.style === "string" ? p.style : undefined;
    return { questViews: Object.fromEntries(Object.entries(p.questViews || {}).filter(([k,v]) => k && typeof v === "boolean")), font: FONT_CHOICES.includes(p.font) ? p.font : "Jua", colors, preset: typeof p.preset === "string" ? p.preset : "", opts, gen, home, homeScene, lobbyScale, storyCast, boxOpacity, style };
  }
  let prefs = normalizePrefs((() => { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch { return null; } })());

  /* ═════════════ Server storage (this extension's own) ═════════════ */
  const storeUrl = EXT_ID ? "/api/personal-extensions/" + encodeURIComponent(EXT_ID) + "/storage" : "";
  /* null when the read failed (network, server busy) — not the same as "nothing saved". Treating a failed read
   * as empty used to let the next save write an almost empty SD list over the real one: lines and cheeks were
   * wiped while the pictures came back from the gallery. */
  /* Marinara's own storage helper first; if it is refused (from another device — Tailscale, a phone — it may not
   * carry the admin secret), the storage address directly, with the secret and the CSRF header. */
  async function storeGet() {
    if (MARINARA?.storage?.get) {
      try {
        const value = await MARINARA.storage.get();
        return value && typeof value === "object" ? value : {};
      } catch (e) { lastStoreError = e.message; }
    }
    if (!storeUrl) return MARINARA?.storage?.get ? null : {};
    try {
      const res = await fetch(storeUrl, { credentials: "same-origin", headers: CSRF });
      if (!res.ok) { lastStoreError = "HTTP " + res.status; return null; }
      const data = await res.json();
      return data && data.value && typeof data.value === "object" ? data.value : {};
    } catch (e) { lastStoreError = e.message; return null; }
  }
  // Worlds whose SD list was read from the server this session; only those are written back.
  const sdReadOk = new Set();
  let prefsReadOk = false;
  // Server prefs arrive: they win over this device's (unsaved changes still on top), and carry the style pick.
  function adoptPrefs(v) {
    prefsReadOk = true;
    const pend = readPending().prefs;
    // Settings saved before the style pick was shared: take the server's settings, add this device's pick once.
    const unshared = current && !(v.prefs && typeof v.prefs.style === "string") && !(pend && typeof pend.style === "string");
    if (!v.prefs && !pend && !unshared) return false;
    const next = normalizePrefs({ ...(v.prefs || prefs), ...(pend || {}), ...(unshared ? { style: current } : {}) });
    if (unshared) storePatch({ prefs: next });
    let changed = JSON.stringify(next) !== JSON.stringify(prefs);
    prefs = next;
    try { localStorage.setItem(CACHE, JSON.stringify(prefs)); } catch {}
    if (typeof prefs.style === "string" && prefs.style !== current) { current = prefs.style; writeStyle(current, false); changed = true; }
    return changed;
  }
  /* A copy of every world's SD list in this browser. It survives a reinstall of the extension (a new ID starts
   * with empty server storage) and fills in lines, cheeks and the rest wherever the server copy lacks them. */
  const SD_BACKUP = "gfx-ui-style-sd-backup";
  function readSdBackup() { try { return JSON.parse(localStorage.getItem(SD_BACKUP) || "{}") || {}; } catch { return {}; } }
  function writeSdBackup(key, map) { try { const all = readSdBackup(); all[key] = map; localStorage.setItem(SD_BACKUP, JSON.stringify(all)); } catch {} }
  function withBackup(key, map) {
    const back = readSdBackup()[key];
    if (!back || typeof back !== "object") return map;
    const out = { ...map };
    for (const [name, entry] of Object.entries(back)) out[name] = { ...(entry || {}), ...(out[name] || {}) };
    return out;
  }
  /* Marinara rejects a write from a browser that is not on 127.0.0.1 (another device, Tailscale, a proxy)
   * unless it carries this header — its own pages send it on every write. Without it every SD and setting
   * this extension saved from such a device was refused, though the pictures had reached the gallery. */
  const CSRF = { "x-marinara-csrf": "1" };
  const JSON_HEADERS = { "Content-Type": "application/json", ...CSRF };
  // A write that still fails is kept in this browser and sent again, so it is never lost.
  const PENDING = "gfx-ui-style-pending";
  let lastStoreError = "";
  const readPending = () => { try { const v = JSON.parse(localStorage.getItem(PENDING) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
  let storeQueue = Promise.resolve();
  function pendingMatches(sent) {
    try { return JSON.stringify(readPending()) === JSON.stringify(sent); } catch { return false; }
  }
  async function sendStorePatch(patch) {
    for (const [k, v] of Object.entries(patch)) if (k.startsWith("sd:") && v && typeof v === "object") writeSdBackup(k, v);
    const all = { ...readPending(), ...patch };
    try { localStorage.setItem(PENDING, JSON.stringify(all)); } catch {}
    // An SD list for a world not yet read from the server stays in this browser until a read succeeds.
    // Same for the settings: a device that has not read them yet must not push its defaults over them.
    const unread = Object.keys(all).filter((k) => (k.startsWith("sd:") && !sdReadOk.has(k.slice(3))) || (k === "prefs" && !prefsReadOk));
    if (unread.length) {
      const send = { ...all };
      for (const k of unread) delete send[k];
      if (!Object.keys(send).length) { lastStoreError = "서버에서 아직 못 읽어서 이 브라우저에 보관 중"; return false; }
      return sendRaw(send, all);
    }
    return sendRaw(all, all);
  }
  function mergeSdMaps(remote, local) {
    const next = { ...(remote || {}) };
    for (const [name, entry] of Object.entries(local || {})) {
      const other = next[name];
      next[name] = (Number(other?._editedAt) || 0) > (Number(entry?._editedAt) || 0) ? other : { ...(other || {}), ...entry };
    }
    return next;
  }
  async function sendRaw(all, pendingAll) {
    const completeBatch = all === pendingAll;
    const remote = await storeGet();
    if (!remote) return false;
    all = { ...all };
    for (const [key, map] of Object.entries(all)) if (key.startsWith("sd:")) all[key] = mergeSdMaps(remote[key], map);
    if (MARINARA?.storage?.patch) {
      try {
        await MARINARA.storage.patch(all);
        if (completeBatch && pendingMatches(pendingAll)) try { localStorage.removeItem(PENDING); } catch {}
        lastStoreError = "";
        return true;
      } catch (e) { lastStoreError = e.message; }
    }
    // The helper was refused or is missing: the storage address directly.
    if (storeUrl) {
      try {
        const res = await fetch(storeUrl, { method: "PATCH", credentials: "same-origin", headers: JSON_HEADERS, body: JSON.stringify(all) });
        if (res.ok) {
          if (completeBatch && pendingMatches(pendingAll)) try { localStorage.removeItem(PENDING); } catch {}
          lastStoreError = "";
          return true;
        }
        lastStoreError = "HTTP " + res.status + " " + ((await res.json().catch(() => null))?.error || "");
      } catch (e) { lastStoreError = e.message; }
    } else lastStoreError = "확장 ID 없음";
    return false;
  }
  function storePatch(patch) {
    // Journal before the first await, including a browser close during an earlier save.
    const snapshot = JSON.parse(JSON.stringify(patch));
    for (const [key, map] of Object.entries(snapshot)) if (key.startsWith("sd:")) writeSdBackup(key, map);
    try { localStorage.setItem(PENDING, JSON.stringify({ ...readPending(), ...snapshot })); } catch (e) { lastStoreError = "브라우저 백업 실패: " + e.message; }
    const job = () => sendStorePatch({});
    storeQueue = storeQueue.then(job, job);
    return storeQueue;
  }
  const retryTimer = setInterval(() => { if (!disposed && Object.keys(readPending()).length) storePatch({}); }, 15000);
  let saveTimer = 0;
  function savePrefs() {
    try { localStorage.setItem(CACHE, JSON.stringify(prefs)); } catch {}
    clearTimeout(saveTimer);
    const pending = { ...readPending(), prefs: JSON.parse(JSON.stringify(prefs)) };
    try { localStorage.setItem(PENDING, JSON.stringify(pending)); } catch {}
    saveTimer = setTimeout(() => storePatch({}), 500);
  }

  /* ═════════════ The style ═════════════
   * :host([data-gfx-style=…]) .gf-arena is (0,3,0), above the game's .gf-arena[data-style=…] (0,2,0) whatever the
   * base style is, so every token of the base is replaced, not mixed. Options are further host attributes. */
  const H = (extra = "") => ':host([' + ATTR + '="trickcal"]' + extra + ")";
  const T = H();
  const LB = H("[data-gfx-lobby]"), F = H("[data-gfx-field]"), TM = H("[data-gfx-team]"), HP = H("[data-gfx-hideplate]"), AT = H("[data-gfx-attend]");
  const HALO = "0 0 2px var(--gfx-card), 0 0 5px color-mix(in srgb, var(--gfx-card) 95%, transparent), 0 0 12px color-mix(in srgb, var(--gfx-card) 70%, transparent)";
  const STICKER = "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 0.25em 0 color-mix(in srgb, var(--gfx-line) 55%, transparent))";
  const CSS = `
${T} .gf-arena, :host([data-gfx-style="trickcal"][data-gfx-ghost]) {
  --gfx-ink: ${DEFAULT_COLORS.ink}; --gfx-card: ${DEFAULT_COLORS.card}; --gfx-text: ${DEFAULT_COLORS.text};
  --gfx-line: ${DEFAULT_COLORS.line}; --gfx-accent: ${DEFAULT_COLORS.accent}; --gfx-pick: ${DEFAULT_COLORS.pick};
  --gfx-sky1: ${DEFAULT_COLORS.sky1}; --gfx-sky2: ${DEFAULT_COLORS.sky2};

  --scanlines: 0;
  --text: var(--gfx-text);
  --surface: var(--gfx-card);
  --on-surface: var(--gfx-text);
  --on-coral: #FFFFFF;
  --ink: var(--gfx-ink);
  --ink-2: color-mix(in srgb, var(--gfx-ink) 80%, var(--gfx-pick));
  --ink-3: color-mix(in srgb, var(--gfx-ink) 72%, var(--gfx-line));
  --porcelain-2: color-mix(in srgb, var(--gfx-card) 70%, var(--gfx-ink));
  /* Mostly a text and icon colour in the game (light on the dark styles), so here it follows the text. */
  --porcelain-3: color-mix(in srgb, var(--gfx-text) 78%, var(--gfx-ink));
  /* The game's main muted text colour. On a light sheet the outline colour reads as strong text; on a dark one
   * (밤하늘) the outline is darker than the sheet, so the text colour takes its place (see paintVars). */
  --steel: color-mix(in srgb, var(--gfx-strong, var(--gfx-line)) 62%, var(--gfx-ink));
  --steel-dark: color-mix(in srgb, var(--gfx-line) 85%, var(--gfx-ink));
  --steel-faint: color-mix(in srgb, var(--gfx-text) 68%, var(--gfx-ink));
  --coral: var(--gfx-accent);
  --coral-deep: color-mix(in srgb, var(--gfx-accent) 78%, #000);
  --amber: #F2A900; --amber-deep: #C98500;
  --epic: #A274E0; --epic-deep: #7A4FC2;
  --jade: #3DA95A; --alarm: #EE4A5D;
  --af-fire: #F2603C; --af-water: #3E9BE8; --af-wind: #3DA95A;
  --af-earth: #C98A2B; --af-light: #F2B600; --af-dark: #9B6FD4;
  --fire: #F2603C; --water: #3E9BE8; --wind: #3DA95A;
  --earth: #D99A1E; --light: #E8A800; --dark: #9B6FD4;
  --glow-1: var(--gfx-sky1);
  --glow-2: var(--gfx-sky2);
  --ground-1: color-mix(in srgb, var(--gfx-sky1) 45%, var(--gfx-ink));
  --ground-2: color-mix(in srgb, var(--gfx-sky2) 55%, var(--gfx-ink));

  --clip-card: none; --clip-chip: none; --clip-btn: none;
  --plate-clip-right: none; --plate-clip-left: none;
  --emblem-cut: none; --emblem-round: block;
  --pip-rotate: 0deg; --pip-radius: 50%;
  --radius: 18px;
  --radius-sm: 12px;
  --panel-blur: none;
  --panel-shadow: 0 0.32em 0 -0.04em color-mix(in srgb, var(--gfx-line) 32%, transparent);
  --panel-bevel: inset 0 -0.2em 0 color-mix(in srgb, var(--gfx-line) 10%, transparent);

  --body: "Gowun Dodum", "Malgun Gothic", "Segoe UI", system-ui, sans-serif;
  --display: "Jua", "Malgun Gothic", "Segoe UI", system-ui, sans-serif;
  --title: "Jua", "Malgun Gothic", "Segoe UI", system-ui, sans-serif;
  --title-weight: 400;
  --case: none;
  --stretch: normal;
  --track: 0;

  --gfx-dots: radial-gradient(color-mix(in srgb, #fff 55%, transparent) 18%, transparent 19%) 0 0 / 2.2em 2.2em,
              radial-gradient(color-mix(in srgb, #fff 35%, transparent) 18%, transparent 19%) 1.1em 1.1em / 2.2em 2.2em;
}

/* Ground: the game's own gradient underneath, polka dots on top. */
${T} .gf-stage, ${T} .hm-ground {
  background-image: var(--gfx-dots), linear-gradient(160deg, var(--glow-1), var(--ground-1) 45%, var(--glow-2)) !important;
}

/* The top bar's buttons stay inside the bar whatever else styles them (another extension making them round
 * and bigger pushed their tops past the edge of the game screen, where they were cut off). */
${T} .gf-bar { align-items: center !important; }
${T} .gf-bar :is(.icon-button, .currency) { box-sizing: border-box !important; max-height: 100%; align-self: center !important; margin-block: 0 !important; }
/* The bar's buttons press onto shading inside their own outline instead of a drop below it: on a shorter bar the
 * drop ran into the bar's bottom line and their lower edge looked cut off. */
${T} .gf-bar :is(.icon-button, .currency, .back, .sv-q), ${T} :is(.head-id, .gf-bar) > :is(.back, .sv-q) {
  box-shadow: inset 0 -.22em 0 color-mix(in srgb, var(--gfx-line) 70%, transparent), 0 .08em 0 color-mix(in srgb, var(--gfx-line) 25%, transparent) !important; }
${T} .gf-bar :is(.icon-button, .currency, .back, .sv-q):active, ${T} :is(.gf-bar, .head-id) button:active:not(:disabled) {
  transform: none !important; translate: none !important; filter: brightness(.94);
  box-shadow: inset 0 -.06em 0 color-mix(in srgb, var(--gfx-line) 70%, transparent), inset 0 .12em 0 color-mix(in srgb, var(--gfx-line) 18%, transparent) !important; }
/* Chunky outlined pieces: buttons press down onto a hard outline-coloured shadow. */
${T} .currency, ${T} .icon-button, ${T} .hm-chat, ${T} .hm-side, ${T} .hm-slot, ${T} .sv-q,
${T} .st-sect, ${T} .st-chip, ${T} .back, ${T} button.act, ${T} .diff-pill, ${T} .btn {
  border: 2px solid var(--gfx-line) !important;
  box-shadow: 0 0.22em 0 var(--gfx-line) !important;
}
${T} .hm-tile, ${T} .hm-cta, ${T} .st-plate, ${T} .st-sty, ${T} .ev-panel {
  border: 2.5px solid var(--gfx-line) !important;
  box-shadow: 0 0.3em 0 var(--gfx-line), inset 0 -0.25em 0 color-mix(in srgb, var(--gfx-line) 10%, transparent) !important;
}
${T} button.act { border-radius: 999px !important; }
/* Shop: .act there is only the slot that holds the price button (or the locked note), not a button itself. */
${T} .sh-buy { border: 2px solid var(--gfx-line) !important; border-radius: 999px !important; padding: .3em 1em !important;
  background: var(--gfx-accent) !important; color: #fff !important; box-shadow: 0 .18em 0 var(--gfx-line) !important; transition: translate .12s ease; }
${T} .sh-buy:hover:not([disabled]) { background: color-mix(in srgb, var(--gfx-accent) 82%, #000) !important; }
${T} .sh-buy:active:not([disabled]) { translate: 0 .14em; box-shadow: 0 .04em 0 var(--gfx-line) !important; }
${T} .sh-buy[disabled] { background: color-mix(in srgb, var(--gfx-card) 70%, var(--gfx-ink)) !important; color: var(--steel-faint) !important;
  border-color: color-mix(in srgb, var(--gfx-line) 45%, transparent) !important; box-shadow: none !important; }
${T} .sh-soon { white-space: normal !important; text-align: center; line-height: 1.25; color: var(--steel-faint) !important; }
/* The big start buttons: Trickcal's yellow "전투시작!" slab. */
${T} .fstart, ${T} [data-into-battle], ${T} .btn-go {
  background: linear-gradient(180deg, #FFDC5E, #FFB81C) !important; color: #3B2610 !important; text-shadow: 0 0.06em 0 #FFF0B0 !important;
  border: 3px solid #3B2610 !important; border-radius: 14px !important; clip-path: none !important;
  box-shadow: 0 0.28em 0 #8A5A00, inset 0 -0.25em 0 rgba(170, 110, 0, 0.35), inset 0 0.2em 0 rgba(255, 255, 255, 0.55) !important;
  font-family: var(--display) !important; }
${T} .fstart b, ${T} [data-into-battle] small { color: #5A3A10 !important; opacity: 0.85; }
${T} .gf-arena button { transition: transform 90ms ease, translate 90ms ease, box-shadow 90ms ease, filter 120ms ease; }
${T} .gf-arena button:hover:not(:disabled) { filter: brightness(1.04); }
/* The press uses translate, which adds to the game's own transform. Setting transform replaced it: the outfit
 * arrows (centred with translateY(-50%)) jumped down from under the finger, so a short tap was lost. */
${T} .gf-arena button:active:not(:disabled) { translate: 0 0.15em; }

/* The top bar and translucent HUD pieces: opaque so the text never sits on raw art. */
${T} .gf-bar { background: color-mix(in srgb, var(--gfx-ink) 85%, transparent) !important; border-bottom: 2.5px solid var(--gfx-line) !important; }
${T} .currency, ${T} .icon-button, ${T} .hm-chat, ${T} .hm-side, ${T} .hm-slot { background: var(--gfx-card) !important; }

/* Selected states: the "picked" sticker look. */
${T} .st-sect[aria-selected="true"], ${T} .st-chip[aria-pressed="true"], ${T} .st-sty[aria-pressed="true"], ${T} .diff-pill[aria-pressed="true"] {
  background: var(--gfx-pick) !important;
  color: var(--gfx-line) !important;
}
${T} .st-plate > .hd h3 {
  display: inline-block;
  padding: 0.15em 0.9em;
  border: 2px solid var(--gfx-line);
  border-radius: 999px;
  background: var(--gfx-pick);
  color: var(--gfx-line);
  box-shadow: 0 0.18em 0 var(--gfx-line);
}

/* Text over art: the game halos it in black, which on dark-on-light letters reads as a smudge. A card-coloured
   halo instead, the sticker-outline look. These are the game's own rules that write a black text-shadow. */
${T} :is(.sv-q, .sv-id, .sv-figs, .sv-bonus, .nw-id, .nw-figs, .cbt .hpn, .dmg, .dmg .eff, .abanner .big,
  .bname .kicker, .bname h3, .bname p, .float .rates, .float .pity .fig, .float .pity .note,
  .u-art > .u-stars, .u-art > .u-lvl, .u-art > .bond-pip) {
  text-shadow: ${HALO} !important;
}
/* The summon banner: lighter veils so the art is not washed out, and a pastel ground behind no art. */
${T} .show { background: radial-gradient(120% 90% at 70% 0%, var(--glow-1) 0%, var(--glow-2) 55%, var(--ground-2) 100%) !important; }
${T} .show > .veil {
  background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-ink) 90%, transparent) 0%, color-mix(in srgb, var(--gfx-ink) 55%, transparent) 22%, transparent 45%),
              linear-gradient(180deg, color-mix(in srgb, var(--gfx-ink) 70%, transparent) 0%, transparent 30%) !important;
}

/* Background-work badge: a cream pill with the mascot's bob. */
${T} .gb-row { background: var(--gfx-card) !important; border: 2px solid var(--gfx-line) !important; border-radius: 999px !important;
  box-shadow: 0 0.2em 0 var(--gfx-line) !important; color: var(--gfx-text) !important; }

/* ── Story ─────────────────────────────────────────────────────────────────────────────────────── */
${T} .vn-exit, ${T} .vn-tool {
  background: var(--gfx-card) !important; color: var(--gfx-text) !important;
  border: 2px solid var(--gfx-line) !important; border-radius: 999px !important; clip-path: none !important;
  box-shadow: 0 0.18em 0 var(--gfx-line) !important;
}
${T} .vn-caption { background: color-mix(in srgb, var(--gfx-card) 88%, transparent); border: 2px solid var(--gfx-line);
  border-radius: 14px; padding: 0.25em 0.8em; box-shadow: 0 0.18em 0 var(--gfx-line); }
${T} .vn-who {
  background: var(--gfx-accent) !important; color: #fff !important;
  border: 2.5px solid var(--gfx-line) !important; border-radius: 999px !important; clip-path: none !important;
  box-shadow: 0 0.2em 0 var(--gfx-line) !important;
  text-shadow: 0 0.08em 0 color-mix(in srgb, var(--gfx-line) 60%, transparent);
  transform: translate(0.8em, 0.3em) rotate(-2deg); position: relative; z-index: 12;
}
/* The name tag's bar sits above the dialogue box so the tag overlaps the box's rim in front of it. */
${T} .vn-bar { z-index: 6 !important; }
${T} .vn-who[data-narration] { background: var(--gfx-pick) !important; color: var(--gfx-line) !important; text-shadow: none; }
/* The protagonist's thoughts: a lilac cloud with a dashed rim and soft italics, a thought trail off the name tag. */
${T} .vn-who[data-thought] { background: #B9A3E8 !important; color: #fff !important; border-style: dashed !important; rotate: 2deg; }
${T} .vn-who[data-thought]::after { content: ""; position: absolute; left: 12%; top: 100%; width: .5em; height: .5em; border-radius: 50%;
  background: #fff; border: 2px solid var(--gfx-line); box-shadow: -.55em .45em 0 -.08em #fff, -.55em .45em 0 .04em var(--gfx-line); pointer-events: none; }
${H("[data-gfx-box]")} .vn-box[data-thought] {
  background: radial-gradient(circle at 12% 0%, color-mix(in srgb, #D9CCF6 70%, transparent), transparent 45%),
    color-mix(in srgb, #F6F1FF var(--gfx-box-a, 95%), transparent) !important;
  border-style: dashed !important; border-color: #8E74C9 !important; border-radius: 34px !important;
  box-shadow: 0 0.3em 0 color-mix(in srgb, #8E74C9 70%, var(--gfx-line)), inset 0 0 0 0.28em color-mix(in srgb, #E5DAFB 70%, transparent) !important;
}
${H("[data-gfx-box]")} .vn-box[data-thought] .vn-text { font-style: italic; color: #5E4A8C !important; }
${H("[data-gfx-box]")} .vn-box {
  background: color-mix(in srgb, var(--gfx-card) var(--gfx-box-a, 95%), transparent) !important;
  border: 3px solid var(--gfx-line) !important; border-radius: 22px !important; clip-path: none !important;
  box-shadow: 0 0.35em 0 var(--gfx-line), inset 0 0 0 0.28em color-mix(in srgb, var(--gfx-pick) 55%, transparent) !important;
  backdrop-filter: none !important;
}
${H("[data-gfx-box]")} .vn-text { color: var(--gfx-text) !important; text-shadow: none !important; }
${T} .vn-next { color: var(--gfx-accent) !important; }
${T} .vn-continue { border: 2.5px solid var(--gfx-line) !important; border-radius: 999px !important; clip-path: none !important; box-shadow: 0 0.2em 0 var(--gfx-line) !important; }

${H("[data-gfx-sticker]")} .vn-plate:not([data-gfx-sd]) {
  --edge-w: 5px;
  background: #fff !important; padding: 5px !important;
  max-height: calc(100% - 2em) !important; box-sizing: border-box !important; aspect-ratio: var(--gfx-card-ratio, 2 / 3) !important;
  outline: 3px solid var(--gfx-line); outline-offset: -1px;
  border-radius: 20px !important; clip-path: none !important;
  box-shadow: 0 0.45em 0 var(--gfx-line) !important;
}
${H("[data-gfx-sticker]")} .vn-plate:not([data-gfx-sd]) .vn-art { inset: 5px !important; border-radius: 15px !important; clip-path: none !important; }
${H("[data-gfx-sticker]")} .vn-plate:not([data-gfx-sd]) .vn-art::after { display: none; }
${H("[data-gfx-sticker]")} .vn-plate[data-side="left"]:not([data-gfx-sd]) { rotate: -2deg; left: 1.2% !important; bottom: 0.6em !important; }
${H("[data-gfx-sticker]")} .vn-plate[data-side="right"]:not([data-gfx-sd]) { rotate: 2deg; right: 1.2% !important; bottom: 0.6em !important; }

/* SD standing: the plate's frame goes and the transparent sprite stands on the box, outlined like a sticker. */
${T} .vn-plate[data-gfx-sd] { background: transparent !important; box-shadow: none !important; clip-path: none !important; overflow: visible !important; }
${T} .vn-plate[data-gfx-sd] .vn-art { opacity: 0 !important; }
${T} .vn-plate[data-gfx-sd] > img.gfx-sd {
  position: absolute; left: 50%; bottom: -0.4em; height: 104%; width: auto; max-width: 150%;
  translate: -50% 0; object-fit: contain; object-position: 50% 100%;
  filter: ${STICKER}; transform-origin: 50% 100%; pointer-events: none;
}

/* The cast line-up: large SDs standing behind the dialogue box (the box is the game's, untouched). */
${T} .vn-plate[data-gfx-sd] { opacity: 0 !important; }
.gfx-vn-cast { position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; contain: layout paint style; }
/* Feet a little above the bottom edge, so roughly the lower legs pass behind the box; a shorter character
   (키 below 보통) keeps the same feet line and simply stands lower-headed. */
.gfx-vn-cast .who { position: absolute; bottom: 9%; height: 78%; aspect-ratio: 0.68; translate: -50% 0; z-index: 1;
  filter: brightness(0.6) saturate(0.85); scale: 0.94; transform-origin: 50% 100%;
  transition: left 560ms cubic-bezier(.4,0,.2,1), height 450ms cubic-bezier(.4,0,.2,1), filter 250ms ease, scale 250ms ease, opacity 300ms ease; animation: gfx-cast-in 380ms ease both; }
/* Every count stands at the same size: a fuller stage overlaps more instead of shrinking (see layoutCast). */
/* Leaving: the entrance animation's fill held translate in place, so only the fade ran; without it they sink as they fade. */
.gfx-vn-cast .who[data-leaving] { opacity: 0; translate: -50% 4%; animation: none; transition: opacity 340ms ease, translate 340ms cubic-bezier(.4,0,.2,1), left 560ms cubic-bezier(.4,0,.2,1); }
.gfx-vn-cast .who[data-speaking] { filter: none; scale: 1; z-index: 2; }
.gfx-vn-cast .who .body { position: absolute; inset: 0; display: grid; place-items: end center; transform-origin: 50% 100%; scale: calc(var(--hf, 1) * var(--cast-fit, 1)); animation: gfx-breathe 3.4s ease-in-out infinite; will-change: transform; transition: scale 450ms cubic-bezier(.4,0,.2,1); }
/* The talk hop is on the picture, so the body's breathing carries on (restarting it was a visible jolt). */
.gfx-vn-cast .who[data-hop] img { animation: gfx-talk-hop 380ms ease; transform-origin: 50% 100%; }
.gfx-vn-cast img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; filter: ${STICKER}; -webkit-user-drag: none; transition: scale 320ms cubic-bezier(.4,0,.2,1); }
.gfx-vn-cast img.portrait { padding: 0; box-sizing: border-box; object-fit: contain; object-position: center; background: #fff; border: 3px solid #fff; outline: 2.5px solid var(--gfx-line); border-radius: 18px; filter: none; }
.gfx-vn-placeholder { position: absolute; inset: 15% 5% 0; display: flex; flex-direction: column; justify-content: end; align-items: center; color: var(--gfx-text); }
.gfx-vn-placeholder svg { width: 85%; max-height: 85%; }
.gfx-vn-placeholder > span { padding: .3em .8em; border: 2px solid var(--gfx-line); border-radius: 999px; background: var(--gfx-card); }
.vn[data-cg] .gfx-vn-cast { display: none; }
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .gfx-vn-cast { filter: brightness(.88) saturate(.9); }
.vn .vn-choices, .vn .vn-choice, .vn [data-choice] { position: relative; z-index: 8; }
/* The game's cleared-chapter green is a fixed dark colour; on a dark sheet it takes a light one. */
${T} .ch-card.cleared .ch-index, ${T} .diffs span.on { color: var(--gfx-jade-text, #1C6B54) !important; }
/* Gacha Choice's shipped runtime uses gch-menu / gch-opt. */
${T} .vn:has(.gch-menu:not([hidden])) .gfx-vn-cast { filter: brightness(.88) saturate(.9); }
${T} .vn:has(.gch-menu:not([hidden]), .vn-choices:not([hidden])) .vn-plate:not([data-gfx-sd]) { visibility: hidden !important; }
${T} .vn .gch-menu { position: relative; z-index: 12; align-items: stretch !important; max-height: 38cqh;
  overflow-y: auto; overscroll-behavior: contain; gap: .55em !important; padding: .35em .4em .65em; margin-bottom: .3em !important;
  /* A centred column of pills instead of bars across the whole scene. */
  width: min(62%, 52em) !important; min-width: min(100%, 26em); margin-inline: auto !important; align-self: center !important; box-sizing: border-box; }
${T} .vn .gch-menu .gch-opt { display: flex !important; align-items: center; justify-content: center; text-align: center; min-width: 0 !important; width: 100%;
  box-sizing: border-box !important; border: 3px solid var(--gfx-line) !important; border-radius: 999px !important;
  clip-path: none !important; background: var(--gfx-card) !important; color: var(--gfx-text) !important;
  padding: .65em 1.2em !important; box-shadow: 0 .22em 0 var(--gfx-line), inset 0 .12em 0 #fff8 !important;
  opacity: 1 !important; transform: none !important; animation: none !important; line-height: 1.4 !important;
  white-space: normal; overflow-wrap: anywhere; transition: background .14s ease, translate .14s ease !important; }
${T} .vn .gch-menu .gch-opt::before { border-radius: 50%; transform: none !important; background: var(--gfx-accent) !important; }
${T} .vn .gch-menu .gch-opt:is(:hover, :focus-visible, [data-on]) { background: var(--gfx-pick) !important; color: var(--gfx-pick-text) !important; outline: 2px solid var(--gfx-accent) !important; outline-offset: 2px; }
${T} .vn .gch-menu .gch-opt:is(:hover, :focus-visible, [data-on]) * { color: var(--gfx-pick-text) !important; }
${T} .vn .gch-menu .gch-opt:active { translate: 0 .18em; box-shadow: 0 .04em 0 var(--gfx-line) !important; }
${T} .vn[data-cg] .vn-cast { visibility: hidden !important; }
${T} .vn-plate:not([data-gfx-sd]) .vn-art > img { object-fit: contain !important; object-position: center bottom !important; width: 100% !important; height: 100% !important; transform: none !important; animation: none !important; }
${T} .vn-dock { position: relative; z-index: 5; max-height: 58%; }
${T} .vn:has(.gch-menu) .vn-box { max-height: 20cqh; overflow-y: auto; }
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices {
  display: grid; gap: calc(var(--f, 10px) * 0.7); padding: calc(var(--f, 10px) * 0.9) 0; isolation: isolate;
  /* A centred column of pills, not bars across the whole scene, so the picture stays visible around them. */
  width: min(60%, calc(var(--f, 10px) * 56)); min-width: min(100%, calc(var(--f, 10px) * 30)); margin-inline: auto !important;
}
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices .vn-choice,
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices > button {
  justify-content: center; text-align: center; font-size: .92em;
}
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices .vn-choice,
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices > button {
  border: calc(var(--f, 10px) * 0.28) solid var(--gfx-line) !important; border-radius: 999px !important;
  background: color-mix(in srgb, var(--gfx-card) 92%, white) !important; color: var(--gfx-text) !important;
  box-shadow: 0 calc(var(--f, 10px) * 0.5) 0 var(--gfx-line), inset 0 calc(var(--f, 10px) * 0.22) 0 #fff8 !important;
  padding: calc(var(--f, 10px) * 0.75) calc(var(--f, 10px) * 1.8) !important;
  transition: translate .14s ease, scale .14s ease, box-shadow .14s ease, background .14s ease;
}
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices .vn-choice:hover,
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices > button:hover {
  background: var(--gfx-pick) !important; translate: 0 calc(var(--f, 10px) * -0.18); scale: 1.015;
}
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices .vn-choice:active,
.vn:has(.vn-choices:not([hidden]), .vn-choice:not([hidden]), [data-choice]:not([hidden])) .vn-choices > button:active {
  translate: 0 calc(var(--f, 10px) * 0.34); scale: .985; box-shadow: 0 calc(var(--f, 10px) * 0.14) 0 var(--gfx-line) !important;
}
@keyframes gfx-cast-in { from { opacity: 0; translate: -50% 8%; } to { opacity: 1; translate: -50% 0; } }
@keyframes gfx-talk-hop { 0% { transform: translateY(0); } 40% { transform: translateY(-3%) scale(0.98, 1.03); } 100% { transform: none; } }

/* Chapter map: the node's button inside its card, at the card's right end. */
${T} .node-row { position: relative; }
${T} .node-row > .node-card { flex: 1 1 auto !important; padding-right: 8.5em !important; }
${T} .node-row > .node-action { position: absolute !important; right: 0.9em; top: 50%; translate: 0 -50%; margin: 0 !important; z-index: 2; }
${T} .node-row > .node-action .act { padding: 0.25em 1em !important; }

/* ── Battle ────────────────────────────────────────────────────────────────────────────────────── */
${T} .cbt .ava { border: 2.5px solid var(--gfx-line) !important; border-radius: 16px !important; clip-path: none !important;
  background: linear-gradient(170deg, var(--gfx-sky1), var(--gfx-sky2)) !important; }
/* The card's foot is a hardcoded near-black fade under the name and bars: a card-coloured one here. */
${T} .cbt::after { background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-card) 96%, transparent) 14%, color-mix(in srgb, var(--gfx-card) 60%, transparent) 52%, transparent 100%) !important;
  border-radius: 0 0 16px 16px; }
${T} .cbt .nm { color: var(--gfx-text) !important; text-shadow: ${HALO} !important; }
${T} .cbt[data-gfx-sd] .ava { background: radial-gradient(90% 70% at 50% 85%, var(--gfx-pick), var(--gfx-sky2) 70%, var(--gfx-sky1)) !important; }
${T} .cbt[data-gfx-sd] .ava-photo { opacity: 0 !important; }
${T} .cbt[data-gfx-sd] { overflow: visible !important; }
${T} .cbt[data-gfx-sd] > img.gfx-sd {
  position: absolute; left: -6%; right: -6%; bottom: 16%; height: calc(96% * var(--hf, 1)); width: 112%; z-index: 2;
  max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; filter: ${STICKER}; transform-origin: 50% 100%; pointer-events: none;
}

/* ── Motion ────────────────────────────────────────────────────────────────────────────────────── */
@keyframes gfx-breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.015, 0.985); } }
@keyframes gfx-bob { 0%, 100% { transform: translateY(0) scale(1, 1); } 45% { transform: translateY(-3%) scale(0.98, 1.03); } 60% { transform: translateY(0) scale(1.04, 0.95); } 75% { transform: scale(1, 1); } }
@keyframes gfx-pop { 0% { transform: scale(0.6, 0.6); opacity: 0; } 55% { transform: scale(1.08, 0.94); opacity: 1; } 75% { transform: scale(0.96, 1.05); } 100% { transform: scale(1, 1); } }
@keyframes gfx-hop { 0% { transform: translateY(0) scale(1.08, 0.9); } 35% { transform: translateY(-18%) scale(0.94, 1.08); } 70% { transform: translateY(0) scale(1.1, 0.88); } 100% { transform: translateY(0) scale(1, 1); } }
@keyframes gfx-squash { 0%, 100% { transform: scale(1, 1); } 30% { transform: scale(1.18, 0.78) rotate(-4deg); } 60% { transform: scale(0.92, 1.08) rotate(3deg); } }
${H("[data-gfx-motion]")} .vn-plate:not([data-gfx-sd]) .vn-art > img { transform-origin: 50% 100%; animation: gfx-breathe 3.4s ease-in-out infinite; }
${H("[data-gfx-motion]")} .vn-plate[data-open="true"] { animation: gfx-pop 420ms cubic-bezier(.3,1.6,.5,1) both; transform-origin: 50% 100%; }
${H("[data-gfx-motion]")} .vn-plate[data-gfx-sd] > img.gfx-sd { animation: gfx-bob 1.9s ease-in-out infinite; }
${H("[data-gfx-motion]")} .cbt[data-gfx-sd] > img.gfx-sd { animation: gfx-bob 1.7s ease-in-out infinite; will-change: transform; }
${H("[data-gfx-motion]")} .cbt.acting[data-gfx-sd] > img.gfx-sd { animation: gfx-hop 520ms ease-out infinite; }
${H("[data-gfx-motion]")} .cbt.hit[data-gfx-sd] > img.gfx-sd { animation: gfx-squash 320ms ease; }

/* ── Loading screen ────────────────────────────────────────────────────────────────────────────── */
.gfx-load {
  position: absolute; inset: 0; z-index: 2147483000; overflow: hidden; pointer-events: auto;
  /* The size unit from the first frame (the script refines it once it has measured the screen). Without it the
   * SD was drawn at its full picture size until the next measure — a giant face across the whole screen. */
  --u: max(5px, min(1.6cqh, 0.9cqw));
  font-family: "Jua", "Malgun Gothic", system-ui, sans-serif; color: var(--gfx-text, #5A3A24);
  --gfx-ink: ${DEFAULT_COLORS.ink}; --gfx-card: ${DEFAULT_COLORS.card}; --gfx-text: ${DEFAULT_COLORS.text};
  --gfx-line: ${DEFAULT_COLORS.line}; --gfx-accent: ${DEFAULT_COLORS.accent}; --gfx-pick: ${DEFAULT_COLORS.pick};
  --gfx-sky1: ${DEFAULT_COLORS.sky1}; --gfx-sky2: ${DEFAULT_COLORS.sky2};
  --u: 10px; /* set from the overlay's own size while it is up */
  background:
    radial-gradient(color-mix(in srgb, #fff 55%, transparent) 18%, transparent 19%) 0 0 / 2.4em 2.4em,
    radial-gradient(color-mix(in srgb, #fff 35%, transparent) 18%, transparent 19%) 1.2em 1.2em / 2.4em 2.4em,
    linear-gradient(160deg, var(--gfx-sky1), color-mix(in srgb, var(--gfx-sky1) 45%, var(--gfx-ink)) 45%, var(--gfx-sky2));
  animation: gfx-load-in 220ms ease both;
}
.gfx-load-host { position: absolute; inset: 0; z-index: 2147482999; overflow: hidden; pointer-events: none; contain: layout paint; container-type: size; }
.gfx-load-host > .gfx-load { pointer-events: auto; }
${T} .gf-stage:has(> .gfx-load-host), ${T} .gf-arena:has(> .gfx-load-host) { position: relative !important; overflow: hidden !important; }
.gfx-load[data-shown] { animation: none; }
.gfx-load[data-out] { animation: gfx-load-out 260ms ease both; pointer-events: none; }
.gfx-load[data-out][data-fast] { animation-duration: 140ms; }
@keyframes gfx-load-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes gfx-load-out { to { opacity: 0; transform: scale(1.03); } }
.gfx-load-title {
  position: absolute; left: 4%; top: 6%; display: flex; align-items: baseline; gap: 0.05em;
  padding: 0.25em 1em 0.3em; font-size: calc(var(--u) * 3.4); color: #fff; background: var(--gfx-accent);
  border: 3px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 0.14em 0 var(--gfx-line); rotate: -3deg;
  text-shadow: 0 0.07em 0 color-mix(in srgb, var(--gfx-line) 60%, transparent);
}
.gfx-load-title i { font-style: normal; display: inline-block; animation: gfx-dot 1.1s ease-in-out infinite; }
.gfx-load-title i:nth-child(2) { animation-delay: .15s; } .gfx-load-title i:nth-child(3) { animation-delay: .3s; }
@keyframes gfx-dot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-0.3em); } }
.gfx-load-world { position: absolute; right: 4%; top: 7%; max-width: 42%; font-size: calc(var(--u) * 2.1); padding: 0.25em 0.9em;
  color: var(--gfx-line); background: var(--gfx-card); border: 2.5px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 0.14em 0 var(--gfx-line);
  rotate: 2deg; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gfx-load-world:empty { display: none; }
.gfx-load-stage { position: absolute; left: 50%; top: 42%; translate: -50% -50%; width: calc(var(--u) * 34); height: calc(var(--u) * 34);
  display: grid; place-items: end center; cursor: pointer; }
.gfx-load-stage::before { content: ""; position: absolute; inset: 6% 2% 10%; border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, #fff 80%, transparent), transparent 68%); }
.gfx-load-shadow { position: absolute; bottom: 3%; left: 50%; width: 46%; height: 7%; translate: -50% 0; border-radius: 50%;
  background: color-mix(in srgb, var(--gfx-line) 28%, transparent); animation: gfx-shadow 0.9s ease-in-out infinite; }
.gfx-load-hero { position: absolute; left: 0; right: 0; bottom: 6%; height: 88%; display: grid; place-items: end center;
  transform-origin: 50% 100%; animation: gfx-jump 0.9s cubic-bezier(.4,0,.6,1) infinite; }
/* The picture fills the hero box and fits inside it: a max-height in % does not hold inside this grid, so a
 * tall SD used to spill far past the box. */
.gfx-load-hero > img { position: absolute; inset: 0; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; filter: ${STICKER}; -webkit-user-drag: none; user-select: none; }
.gfx-load-hero > svg { width: 78%; height: auto; overflow: visible; }
.gfx-load-stage[data-squish] .gfx-load-hero { animation: gfx-squash 380ms ease; }
@keyframes gfx-jump { 0%, 100% { transform: translateY(0) scale(1.08, 0.92); } 15% { transform: translateY(0) scale(1, 1); }
  50% { transform: translateY(-16%) scale(0.95, 1.06); } 85% { transform: translateY(0) scale(1, 1); } }
@keyframes gfx-shadow { 0%, 100% { scale: 1.1 1; opacity: 1; } 50% { scale: 0.7 1; opacity: 0.6; } }
.gfx-load-pop { position: absolute; top: 4%; right: 6%; font-size: calc(var(--u) * 2.6); color: var(--gfx-accent);
  text-shadow: 0 0 3px #fff, 0 0 6px #fff; animation: gfx-pop-text 600ms ease-out both; pointer-events: none; }
@keyframes gfx-pop-text { from { opacity: 0; transform: translateY(30%) scale(0.6); } 40% { opacity: 1; transform: translateY(-20%) scale(1.15); } to { opacity: 0; transform: translateY(-80%) scale(1); } }
.gfx-load-foot { position: absolute; left: 5%; right: 5%; bottom: 6%; display: flex; flex-direction: column; gap: calc(var(--u) * 6); pointer-events: none; }
.gfx-load-runner { pointer-events: auto; cursor: pointer; }
.gfx-load-runner[data-squish] > :is(img, svg) { animation: gfx-squash 380ms ease; }
.gfx-load-tip { position: relative; display: flex; align-items: center; gap: 0.7em; padding: 0.55em 1.1em;
  font-family: "Gowun Dodum", "Malgun Gothic", system-ui, sans-serif; font-size: calc(var(--u) * 2); line-height: 1.4;
  background: var(--gfx-card); border: 3px solid var(--gfx-line); border-radius: 18px; box-shadow: 0 0.22em 0 var(--gfx-line); }
.gfx-load-tip b { flex: none; font-family: "Jua", "Malgun Gothic", sans-serif; font-weight: 400; padding: 0.05em 0.6em;
  background: var(--gfx-pick); color: var(--gfx-line); border: 2px solid var(--gfx-line); border-radius: 999px; }
.gfx-load-tip span { animation: gfx-load-in 300ms ease both; }
.gfx-load-bar { position: relative; height: calc(var(--u) * 2.6); background: var(--gfx-card); border: 3px solid var(--gfx-line);
  border-radius: 999px; box-shadow: 0 0.2em 0 var(--gfx-line), inset 0 0.2em 0 color-mix(in srgb, var(--gfx-line) 12%, transparent); }
.gfx-load-fill { position: absolute; left: 3px; top: 3px; bottom: 3px; width: 0; border-radius: 999px;
  background: repeating-linear-gradient(-45deg, var(--gfx-accent) 0 0.7em, color-mix(in srgb, var(--gfx-accent) 78%, #fff) 0.7em 1.4em);
  background-size: 200% 100%; animation: gfx-stripe 0.8s linear infinite; transition: width 180ms linear; }
@keyframes gfx-stripe { to { background-position: -1.98em 0; } }
.gfx-load-runner { position: absolute; bottom: 60%; width: calc(var(--u) * 5.5); height: calc(var(--u) * 5.5); translate: -50% 0;
  transition: left 180ms linear; display: block; animation: gfx-run 0.35s ease-in-out infinite; }
.gfx-load-runner > img { width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; filter: ${STICKER}; }
.gfx-load-runner > svg { width: 100%; height: auto; }
@keyframes gfx-run { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-18%) rotate(4deg); } }
.gfx-load-pct { position: absolute; right: 0.8em; top: 50%; translate: 0 -50%; font-size: calc(var(--u) * 1.6); color: var(--gfx-line); }
/* The built-in mascot: a mochi with a sprout, drawn in the style's own colours. */
.gfx-mochi .body { fill: var(--gfx-card); stroke: var(--gfx-line); stroke-width: 5; }
.gfx-mochi .eye { fill: var(--gfx-line); }
.gfx-mochi .shine { fill: #fff; }
.gfx-mochi .blush { fill: #FF8FAB; opacity: 0.6; }
.gfx-mochi .mouth, .gfx-mochi .stem { fill: none; stroke: var(--gfx-line); stroke-width: 4; stroke-linecap: round; }
.gfx-mochi .leaf { fill: #7DD87D; stroke: var(--gfx-line); stroke-width: 3.5; }
/* World creation ("forge") screen: the mascot instead of the spinning emblem. */
${T} .forge-center .forge-emblem { display: none; }
/* The short screen while the game builds a world or writes a chapter. The SD keeps to a fixed box: the size
 * has a fallback for the first frame, and the picture is laid inside the box rather than sized by it (a tall
 * SD otherwise spilled over the whole screen for that moment). */
${T} .gfx-forge-mascot { position: relative; flex: none; width: calc(var(--f, 10px) * 12); height: calc(var(--f, 10px) * 12); max-width: 40cqmin; max-height: 40cqmin; }
${T} .gfx-forge-mascot > img { position: absolute; inset: 0; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; }
${T} .gfx-forge-mascot > svg { position: absolute; left: 11%; bottom: 0; width: 78%; height: auto; }
${T} .gfx-forge-mascot > * { transform-origin: 50% 100%; animation: gfx-jump 0.9s cubic-bezier(.4,0,.6,1) infinite; filter: ${STICKER}; }

/* ── Battle field (Trickcal Revive manner) ────────────────────────────────────────────────────────
   The game keeps its sides and rows; only where things stand changes. Sides and rows stop being boxes,
   so every unit is placed on the arena itself: allies on the left, enemies on the right, three lanes of
   depth, the front row nearer the middle. Clicks, targeting and turns are the game's own, untouched. */
${F} .arena > .side { position: static !important; display: block !important; flex: none !important; padding: 0 !important; z-index: auto !important; }
${F} .arena .row { display: contents !important; }
${F} .arena > .midline { display: none !important; }
${F} .arena .cbt {
  position: absolute !important; margin: 0 !important; width: 9.6% !important; height: 30% !important;
  --lane: 0; --extra: 0; top: calc(21% + var(--lane) * 14%); z-index: calc(10 + var(--lane));
  transition: left 300ms ease, top 300ms ease, transform 200ms ease;
}
${F} .arena .row > .cbt:nth-child(3n+2) { --lane: 1; }
${F} .arena .row > .cbt:nth-child(3n+3) { --lane: 2; }
${F} .arena .row > .cbt:nth-child(n+4) { --extra: 1; }
${F} .side.allies .row.back > .cbt { --col: 6%; }
${F} .side.allies .row.front > .cbt, ${F} .side.allies.no-front .row.back > .cbt { --col: 25%; }
${F} .side.allies .cbt { left: calc(var(--col) + (1 - var(--lane)) * 3.4% - var(--extra) * 11%); }
${F} .side.enemies .row.front > .cbt, ${F} .side.enemies.no-front .row.back > .cbt { --col: 62%; }
${F} .side.enemies .row.back > .cbt { --col: 78%; }
${F} .side.enemies .cbt { left: calc(var(--col) - (1 - var(--lane)) * 2.6% + var(--extra) * 11%); }
${F} .arena .cbt::before { display: none !important; }
/* The ground under each unit, and a soft ground band across the field. */
${F} .arena .cbt::after {
  content: "" !important; top: auto !important; left: 12% !important; right: 12% !important; bottom: -3% !important; height: 9% !important;
  border-radius: 50% !important; z-index: 0 !important;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--gfx-line) 38%, transparent), transparent) !important;
}
${F} .cb-shade { background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-sky2) 55%, transparent) 0%, transparent 42%),
  linear-gradient(180deg, color-mix(in srgb, var(--gfx-sky1) 35%, transparent) 0%, transparent 30%) !important; }
/* A unit with an SD is just the sprite; one without is a small sticker card standing in its place. */
${F} .arena .cbt .ava { inset: 16% 10% 4% !important; width: auto !important; height: auto !important;
  border: 3px solid #fff !important; outline: 2.5px solid var(--gfx-line); border-radius: 14px !important; box-shadow: 0 0.3em 0 var(--gfx-line) !important; }
${F} .arena .cbt[data-gfx-sd] .ava, ${F} .arena .cbt[data-gfx-foe] .ava { background: none !important; border: 0 !important; outline: 0; box-shadow: none !important; }
${F} .arena .cbt[data-gfx-foe] .ava > svg { display: none; }
/* The element badge sat on the (hidden) card's top-right corner and poked out beside the bars; on the field
 * it is a small round chip at the start of the name tag. */
${F} .arena .cbt .aff-badge { top: calc(var(--f, 10px) * -0.35) !important; right: auto !important; left: calc(var(--f, 10px) * -0.6) !important;
  width: calc(var(--f, 10px) * 1.7) !important; height: calc(var(--f, 10px) * 1.7) !important; border-radius: 50% !important; clip-path: none !important;
  background: var(--gfx-card) !important; border: 2px solid var(--gfx-line) !important; box-shadow: 0 .12em 0 var(--gfx-line) !important; z-index: 5; pointer-events: none; }
/* Overlapping foes: only the figure takes a click. The front foe's empty card area and its name, bars and
 * estimate tags let a click through to the foe standing behind it. */
${F} .arena .cbt.enemy { pointer-events: none; }
${F} .arena .cbt.enemy > :is(.gfx-foe, img.gfx-sd, .ava) { pointer-events: auto; }
${F} .arena .cbt.enemy > :is(.nm, .bars, .cbt-est, .fx) { pointer-events: none !important; }
${F} .arena .cbt[data-gfx-sd] > img.gfx-sd { left: -20% !important; right: auto !important; width: 140% !important; height: calc(92% * var(--hf, 1)) !important; bottom: 2% !important; z-index: 1; }
${F} .arena .cbt > .gfx-foe { position: absolute; left: 0; right: 0; bottom: 2%; height: 62%; z-index: 1; display: grid; place-items: end center; pointer-events: none; transform-origin: 50% 100%; }
${F} .arena .cbt > .gfx-foe svg { width: 100%; height: 100%; overflow: visible; filter: ${STICKER}; }
/* Name and HP float over the head as a little plate. */
${F} .arena .cbt .nm { top: 0 !important; bottom: auto !important; left: -8% !important; right: -8% !important; z-index: 4 !important;
  font-size: calc(var(--f) * 0.85 * var(--gf-scale, 1)) !important; padding: 0.1em 0.4em; border-radius: 999px;
  background: var(--gfx-card); border: 2px solid var(--gfx-line); box-shadow: 0 0.12em 0 var(--gfx-line); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* The bars sit just under the name tag (at 10% the tag covered the HP bar's top half). */
${F} .arena .cbt .bars { top: calc(var(--f, 10px) * 1.45 * var(--gf-scale, 1) + 5px) !important; bottom: auto !important; left: 2% !important; right: 2% !important; z-index: 4 !important; }
${F} .arena .cbt .hp, ${F} .arena .cbt .en { border-radius: 999px; outline: 1.5px solid var(--gfx-line); }
${F} .arena .cbt .hpn { display: none !important; }
${F} .arena .cbt .aff-badge { top: -2% !important; right: -14% !important; z-index: 5 !important; }
${F} .arena .cbt .cbt-est { top: 20% !important; bottom: auto !important; z-index: 5; }
/* Acting: the unit steps toward the other side; the game's own lift is replaced. */
${F} .side.allies .cbt.acting { transform: translateX(45%) scale(1.08) !important; z-index: 40 !important; }
${F} .side.enemies .cbt.acting { transform: translateX(-45%) scale(1.08) !important; z-index: 40 !important; }
${F} .arena .cbt.dead { transform: scale(0.85) rotate(-8deg) !important; }
/* Before the fight: dashed placement tiles on the ground, as on the Trickcal field. */
${F} .gfx-tiles { position: absolute; left: 3%; right: 3%; top: 30%; bottom: 20%; z-index: 0; pointer-events: none;
  display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(3, 1fr); gap: 1.4% 1%;
  transform: perspective(60em) rotateX(28deg); transform-origin: 50% 100%; opacity: 0; transition: opacity 400ms ease; }
${F} .gfx-tiles i { border: 2px dashed color-mix(in srgb, #fff 75%, transparent); border-radius: 10px; background: color-mix(in srgb, #fff 14%, transparent); }
${F} .gfx-tiles i:nth-child(8n+5), ${F} .gfx-tiles i:nth-child(8n+6), ${F} .gfx-tiles i:nth-child(8n+7), ${F} .gfx-tiles i:nth-child(8n+8) {
  background: color-mix(in srgb, #F2884B 16%, transparent); border-color: color-mix(in srgb, #FFE1C9 80%, transparent); }
${H('[data-gfx-field][data-gfx-phase="prebattle"]')} .gfx-tiles { opacity: 1; }
/* Before the fight the briefing is in front: the field units (which sit above its blur) and the empty turn
   bar wait out of sight, and the floating team over the start button stands in for them. */
${H('[data-gfx-field][data-gfx-phase="prebattle"]')} .arena .cbt,
${H('[data-gfx-field][data-gfx-phase="prebattle"]')} .cbt-turn-slot { visibility: hidden !important; }
${H('[data-gfx-field][data-gfx-phase="loading"]')} .cbt-turn-slot { visibility: hidden !important; }
${F} .arena .cbt .hp > i { background: linear-gradient(180deg, #FF8A8A, #E0484E) !important; }
${F} .side.allies .cbt .hp > i { background: linear-gradient(180deg, #8EE6A0, #3DA95A) !important; }
${F} .arena .cbt .hp { background: #3B2A22 !important; height: calc(var(--f) * 0.55) !important; }
/* The turn panel: one row along the bottom — the actor's face, then the six actions. */
${F} .cbt-turn-slot { position: absolute !important; left: 12% !important; right: 12% !important; bottom: 0 !important; top: auto !important;
  height: 19% !important; width: auto !important; max-width: none !important; order: 0 !important; z-index: 30 !important; flex: none !important; }
${F} .cbt-turn { position: absolute !important; inset: 0 !important; width: auto !important; height: auto !important; gap: 0.6em !important; align-items: stretch !important;
  padding: 0.45em 0.6em !important; background: color-mix(in srgb, #3B2E26 55%, transparent); border: 0;
  border-radius: 18px 18px 0 0; backdrop-filter: blur(2px); }
${F} .tu-hero { height: 100% !important; width: auto !important; aspect-ratio: 1 !important; border-radius: 50% !important; border: 3px solid var(--gfx-line) !important; clip-path: none !important; flex: none !important; align-self: center !important; }
${F} .tu-hero .tu-id { display: none !important; }
${F} .cbt-acts { flex: 1 1 auto !important; grid-template-columns: repeat(6, minmax(0, 1fr)) !important; grid-template-rows: minmax(0, 1fr) !important; gap: 0.5em !important; height: 100% !important; }
${F} .cbt-act { border: 3px solid #fff !important; outline: 2px solid #3B2E26; border-radius: 10px !important; box-shadow: 0 0.22em 0 #3B2E26 !important;
  background: linear-gradient(160deg, #FFB98A, #F2884B) !important; }
${F} .cbt-act:nth-child(even) { background: linear-gradient(160deg, #A9D4FF, #5B9BE8) !important; }
${F} .cbt-act.locked { filter: grayscale(0.7) brightness(0.9); }
${F} .cbt-act .a-cost, ${F} .cbt-act .a-chip { color: #fff !important; text-shadow: 0 0.08em 0 #3B2E26; }
${F} .cbt-act .cbt-tip { bottom: calc(100% + 0.6em) !important; top: auto !important; }

/* ── Team: formation slots and the battle briefing ──────────────────────────────────────────────── */
/* The SD fits inside its slot now, so the slot trims its contents to its rounded corners again. */
${TM} .slot[data-gfx-sd] { overflow: hidden !important; }
${TM} .slot .slot-art { border-radius: 12px 12px 0 0 !important; }
${TM} .slot[data-gfx-sd] .slot-art { background: radial-gradient(70% 40% at 50% 92%, color-mix(in srgb, var(--gfx-line) 30%, transparent), transparent 70%),
  linear-gradient(170deg, var(--gfx-sky1), var(--gfx-sky2)) !important; }
${TM} .slot[data-gfx-sd] .slot-art img { opacity: 0 !important; }
${TM} .slot[data-gfx-sd] > img.gfx-sd { position: absolute; left: 0; width: 100%; bottom: 14%; height: min(calc(72% * var(--hf, 1)), 76%); object-fit: contain; object-position: 50% 100%;
  max-width: none !important; max-height: none !important; filter: ${STICKER}; pointer-events: none; z-index: 2; animation: gfx-float 2.6s ease-in-out infinite; }
${TM} .slot.filled:nth-child(2) > img.gfx-sd { animation-delay: -0.9s; } ${TM} .slot.filled:nth-child(3) > img.gfx-sd { animation-delay: -1.7s; }
@keyframes gfx-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6%); } }
.gfx-team { display: flex; justify-content: center; align-items: flex-end; gap: 1.2em; height: calc(var(--f, 10px) * 13); margin: 0.4em 0 1.4em; pointer-events: none; }.gfx-team > span { position: relative; height: 100%; aspect-ratio: 2 / 3; display: grid; place-items: end center; animation: gfx-float 2.4s ease-in-out infinite; }
.gfx-team > span:nth-child(2n) { animation-delay: -0.8s; } .gfx-team > span:nth-child(3n) { animation-delay: -1.5s; }
.gfx-team > span::after { content: ""; position: absolute; bottom: -6%; left: 18%; right: 18%; height: 8%; border-radius: 50%;
  background: color-mix(in srgb, var(--gfx-line, #6B4528) 30%, transparent); animation: gfx-shadow 2.4s ease-in-out infinite; }
.gfx-team.win { height: auto; min-height: 0; margin: 0.2em 0 0.6em; }
.gfx-team.win > span { animation: gfx-cheer 0.9s cubic-bezier(.4,0,.6,1) infinite; }
.gfx-team.win > span::after { animation: gfx-shadow 0.9s ease-in-out infinite; }
@keyframes gfx-cheer { 0%, 100% { transform: translateY(0) scale(1.06, 0.94); } 50% { transform: translateY(-22%) scale(0.96, 1.05); } }
.gfx-team img:not(.portrait) { display: block; height: 100%; width: auto; max-width: none !important; max-height: none !important; object-fit: contain; object-position: 50% 100%; scale: var(--hf, 1); transform-origin: 50% 100%; filter: ${STICKER}; }
.gfx-team img.portrait { width: 100%; height: 100%; object-fit: contain; object-position: center bottom; border-radius: 14px; border: 3px solid #fff; outline: 2.5px solid var(--gfx-line, #6B4528); filter: none; }
${TM} .briefing .gfx-team { flex: 0 1 calc(var(--f, 10px) * 17); min-height: 0; width: min(88%, 110cqh); height: 24%; max-height: 26%; gap: .6em; margin: .4em 0 .8em; }
/* Every SD the same height with its feet on one line (a fixed width made wide ones short and tall ones sink). */
${TM} .briefing .gfx-team > span { flex: 0 1 auto; min-width: 0; height: 100%; aspect-ratio: .62; animation: none; }
${TM} .briefing .gfx-team img.portrait { width: 100% !important; max-width: 100% !important; height: 100%; object-fit: contain; }
${TM} .briefing .gfx-team img:not(.portrait) { position: absolute; bottom: 0; left: 50%; translate: -50% 0; width: auto !important; height: 100% !important; scale: var(--hf, 1); }
${TM} .briefing .gfx-team > span::after { bottom: 0; animation: none; }
${TM} .briefing { gap: calc(var(--f, 10px) * .7); overflow: hidden; }
${TM} .slot[data-gfx-sd] > img.gfx-sd { left: 5%; width: 90%; bottom: 18%; height: 70%; }

/* ── Home lobby ─────────────────────────────────────────────────────────────────────────────────── */
${HP} .hm-plate { display: none !important; }
.gfx-lobby { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
/* Lobby mode, as in the Trickcal Revive lobby: the cast stands large across the screen and the home's own
   controls sit over them — round icons with outlined labels, a see-through top bar. */
${LB} .hm-scene, ${LB} .hm-dock { position: relative; z-index: 4; }
/* The scene's wide boxes (the right-hand column spans most of the screen) let the pointer through to the
   lobby; only its real controls take it. */
${LB} .hm-scene, ${LB} .hm-scene * { pointer-events: none !important; }
${LB} .hm-scene button, ${LB} .hm-scene a, ${LB} .hm-scene [role="button"], ${LB} .hm-scene input, ${LB} .hm-scene button * { pointer-events: auto !important; }
${LB} .hm-scene button * { pointer-events: none !important; }
${LB} .gf-stage:has(.hm-screen) .gf-bar { background: linear-gradient(180deg, color-mix(in srgb, var(--gfx-ink) 55%, transparent), transparent) !important; border-bottom: 0 !important; }
${LB} .hm-dock { background: none !important; border: 0 !important; box-shadow: none !important; justify-content: center; gap: 1.2em; }
${LB} .hm-tile { flex: 0 0 auto !important; width: auto !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important;
  gap: 0.1em !important; padding: 0 0.3em !important; background: none !important; border: 0 !important; box-shadow: none !important; }
${LB} .hm-tile { font-size: calc(var(--f) * 1.5) !important; }
${LB} .hm-tile > svg { width: 3.2em !important; height: 3.2em !important; padding: 0.6em; border-radius: 50%; color: #fff;
  background: var(--gfx-tile, var(--gfx-accent)); border: 2.5px solid var(--gfx-line); box-shadow: 0 0.2em 0 var(--gfx-line), inset 0 -0.25em 0 rgba(0,0,0,0.12); }
${LB} .hm-tile.roster { --gfx-tile: #FF8FB1; } ${LB} .hm-tile.formation { --gfx-tile: #6FB2F2; } ${LB} .hm-tile.summon { --gfx-tile: #F7C843; }
${LB} .hm-tile.shop { --gfx-tile: #7FD39A; } ${LB} .hm-tile.inventory { --gfx-tile: #F2884B; }
${LB} .hm-tile .nm, ${LB} .hm-side .lbl > span { font-family: var(--display) !important; color: #fff !important; -webkit-text-stroke: 3px var(--gfx-line); paint-order: stroke fill; letter-spacing: 0; }
${LB} .hm-side { background: none !important; border: 0 !important; box-shadow: none !important; }
${LB} .hm-side .lbl { display: inline-flex; align-items: center; gap: 0.35em; }
${LB} .hm-side .lbl > svg { width: 2em; height: 2em; padding: 0.35em; border-radius: 50%; color: #fff; background: #B48CF0; border: 2.5px solid var(--gfx-line); box-shadow: 0 0.16em 0 var(--gfx-line); }
${LB} .hm-cta { display: none !important; }
${LB} .hm-tile.gfx-battle-tile { --gfx-tile: #F25F5C; }
${LB} .hm-tile.gfx-battle-tile > svg { width: 3.6em !important; height: 3.6em !important; }
/* Events and achievements: a column of round icons down the right edge. */
${LB} .hm-rail { position: absolute !important; right: 1.2% !important; top: 3% !important; left: auto !important; bottom: auto !important;
  width: auto !important; height: auto !important; display: flex !important; flex-direction: column !important; align-items: center; gap: 0.6em !important; z-index: 5; }
${LB} .hm-side { position: relative; flex-direction: column !important; width: auto !important; height: auto !important; min-height: 0 !important; padding: 0 !important; font-size: calc(var(--f) * 1.55) !important;
  font-size: calc(var(--f) * 1.35) !important; }
${LB} .hm-side .lbl { flex-direction: column !important; gap: 0.1em !important; }
${LB} .hm-side .lbl > svg { width: 3.2em !important; height: 3.2em !important; padding: 0.6em !important; }
${LB} .hm-side[data-go="events"] .lbl > svg { background: #FF8FB1 !important; }
${LB} .hm-side[data-go="missions"] .lbl > svg { background: #6FB2F2 !important; }
${LB} .hm-side .hm-dot { position: absolute; top: 0.1em; right: 0.2em; width: 0.7em; height: 0.7em; border: 2px solid #fff; background: #F25F5C !important; }
${LB} .hm-cta-unused { background: linear-gradient(180deg, #FFDC5E, #FFB81C) !important; color: #3B2610 !important; border: 3px solid #3B2610 !important;
  box-shadow: 0 0.3em 0 #8A5A00, inset 0 0.2em 0 rgba(255,255,255,0.55) !important; }
${LB} .hm-cta * { color: #3B2610 !important; }
${LB} .hm-cta { width: auto !important; height: auto !important; min-height: 0 !important; padding: 0.35em 1.4em 0.45em !important; border-radius: 999px !important; align-self: flex-end; }
${LB} .hm-cta .title, ${LB} .hm-cta .nodes { display: none !important; }
${LB} .hm-cta .big { font-size: calc(var(--f) * 2.2) !important; line-height: 1 !important; }
${LB} .hm-slot-bg { opacity: 0.85; }
/* Placed by the roaming loop with a single transform (position, then depth scale round the feet). */
.gfx-lobby .who { position: absolute; left: 0; top: 0; height: calc(40% * var(--hf, 1)); aspect-ratio: 2 / 3; transform-origin: 0 0; will-change: transform;
  pointer-events: auto; cursor: pointer; touch-action: none; }
.gfx-lobby .who .body { position: absolute; inset: 0; display: grid; place-items: end center; transform-origin: 50% 100%; animation: gfx-lobby-bob 1.9s ease-in-out infinite; animation-delay: var(--bdl, 0s); }
/* Keep the feet planted. The old shared bob translated the whole picture upward while its shadow stayed put. */
@keyframes gfx-lobby-bob { 0%, 100% { transform: scale(1, 1) rotate(-0.35deg); } 45% { transform: scale(0.985, 1.015) rotate(0.35deg); } 65% { transform: scale(1.025, 0.975) rotate(-0.25deg); } }
/* The image fills its box exactly; the box takes the image's own proportions (set on load), so the
   [배치] outline, the drag area and the cheek points all match the drawn sprite. */
.gfx-lobby .who img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%;
  max-width: none !important; max-height: none !important; filter: ${STICKER}; -webkit-user-drag: none; user-select: none; }
.gfx-lobby .who::after { content: ""; position: absolute; bottom: -3%; left: 20%; right: 20%; height: 7%; border-radius: 50%; z-index: -1;
  background: color-mix(in srgb, var(--gfx-line) 32%, transparent); }
.gfx-lobby .who[data-squish] .body { animation: gfx-squash 380ms ease; }
.gfx-lobby .who .say { position: absolute; bottom: 102%; left: 50%; translate: -50% 0; white-space: nowrap; padding: 0.3em 0.8em;
  font-family: "Jua", "Malgun Gothic", sans-serif; font-size: calc(var(--f, 10px) * 1.05); color: var(--gfx-text);
  background: var(--gfx-card); border: 2.5px solid var(--gfx-line); border-radius: 14px; box-shadow: 0 0.15em 0 var(--gfx-line); animation: gfx-pop 300ms ease both; }
.gfx-lobby .who .say::after { content: ""; position: absolute; top: 100%; left: 50%; translate: -50% -1px; border: 0.45em solid transparent; border-top-color: var(--gfx-line); }
/* Walking is the box sliding; turning round is only the sprite flipping, so the speech bubble never mirrors. */
.gfx-lobby .who .flip { position: absolute; inset: 0; transition: transform 160ms ease; }
/* Walking is a quicker, bouncier step than standing still. */
.gfx-lobby .who[data-walk] .body { animation: gfx-step 0.44s ease-in-out infinite; }
@keyframes gfx-step { 0%, 100% { transform: scale(1.02, 0.98) rotate(-1deg); } 50% { transform: scale(0.98, 1.03) rotate(1deg); } }
.gfx-lobby .who[data-pinch] .body { animation-play-state: paused !important; cursor: grabbing; }
.gfx-lobby[data-edit] .who { outline: 2.5px dashed var(--gfx-accent); outline-offset: 2px; border-radius: 12px; cursor: grab; }
.gfx-lobby[data-edit] .who .body { animation: none; }
.gfx-lobby[data-edit] .who .flip { transition: none; }
.gfx-lobby[data-edit] .who[data-dragging] { cursor: grabbing; }
.gfx-lobby[data-edit] { background: color-mix(in srgb, var(--gfx-ink) 25%, transparent); pointer-events: auto; z-index: 20; }
${LB} .hm-screen:has(.gfx-lobby[data-floor-edit]) .hm-dock { opacity: 0.14 !important; pointer-events: none !important; filter: grayscale(0.7); }
.gfx-lobby-tools { position: absolute; left: 50%; top: 2%; translate: -50% 0; display: flex; gap: 0.5em; pointer-events: auto; z-index: 500; }
.gfx-lobby-tools button { font-family: "Jua", "Malgun Gothic", sans-serif; font-size: calc(var(--f, 10px) * 0.95); padding: 0.3em 0.9em; cursor: pointer;
  color: var(--gfx-text); background: var(--gfx-card); border: 2px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 0.18em 0 var(--gfx-line); }
.gfx-lobby-tools button[data-main] { background: var(--gfx-accent); color: #fff; }
.gfx-lobby:not([data-edit]) .gfx-lobby-tools { left: 1.6%; top: 10.5%; translate: 0 0; opacity: 0.95; }
.gfx-lobby[data-edit] .gfx-lobby-tools { flex-wrap: wrap; justify-content: center; max-width: 70%; padding: 0.5em 0.7em;
  background: color-mix(in srgb, var(--gfx-card) 92%, transparent); border: 2.5px solid var(--gfx-line); border-radius: 16px; box-shadow: 0 0.2em 0 var(--gfx-line); }
.gfx-lobby-cast { flex-basis: 100%; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4em; }
.gfx-lobby-cast button[aria-pressed="false"] { opacity: 0.55; background: var(--gfx-ink); }
.gfx-lobby-cast button[aria-pressed="true"] { background: var(--gfx-pick); }
.gfx-lobby:not([data-edit]) .gfx-lobby-tools button:not([data-edit-toggle]) { display: none; }
.gfx-lobby-floor { position: absolute; inset: 0; z-index: 420; pointer-events: none; }
.gfx-lobby-floor svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.gfx-lobby-floor polygon { fill: color-mix(in srgb, var(--gfx-pick) 22%, transparent); stroke: var(--gfx-accent); stroke-width: 0.45; stroke-dasharray: 1.2 0.8; vector-effect: non-scaling-stroke; }
.gfx-lobby-floor line { stroke: color-mix(in srgb, var(--gfx-line) 68%, transparent); stroke-width: 0.3; stroke-dasharray: 0.8 0.7; vector-effect: non-scaling-stroke; }
.gfx-lobby-floor [data-floor-handle] { position: absolute; width: calc(var(--f, 10px) * 2.25); aspect-ratio: 1; translate: -50% -50%; pointer-events: auto;
  display: grid; place-items: center; padding: 0; border: 2.5px solid var(--gfx-line); border-radius: 50%; color: var(--gfx-text); background: var(--gfx-card);
  font: 700 calc(var(--f, 10px) * 0.82)/1 "Jua", "Malgun Gothic", sans-serif; box-shadow: 0 0.18em 0 var(--gfx-line); cursor: grab; touch-action: none; }
.gfx-lobby-floor [data-floor-handle="vp"] { width: calc(var(--f, 10px) * 2.8); background: var(--gfx-pick); }
.gfx-lobby-floor [data-floor-handle]:active { cursor: grabbing; scale: 1.08; }
.gfx-floor-edge { position: absolute; height: 0; pointer-events: auto; border-top: calc(var(--f, 10px) * 0.34) solid var(--gfx-accent); touch-action: none; cursor: ns-resize; }
.gfx-floor-edge[data-floor-line="far"] { border-top-color: var(--gfx-accent); }
.gfx-floor-edge[data-floor-line="near"] { border-top-color: var(--gfx-pick); }
.gfx-floor-edge .edge-mid { position: absolute; left: 50%; top: 0; translate: -50% -50%; padding: 0.28em 0.85em; white-space: nowrap; pointer-events: auto;
  border: 2px solid var(--gfx-line); border-radius: 999px; background: var(--gfx-card); color: var(--gfx-text); box-shadow: 0 0.15em 0 var(--gfx-line);
  font: 700 calc(var(--f, 10px) * 0.86)/1.2 "Jua", "Malgun Gothic", sans-serif; cursor: ns-resize; touch-action: none; }
.gfx-floor-edge .edge-end { position: absolute; top: 0; width: calc(var(--f, 10px) * 2.4); aspect-ratio: 1; translate: -50% -50%; padding: 0; pointer-events: auto;
  border: 2.5px solid var(--gfx-line); border-radius: 50%; background: var(--gfx-card); box-shadow: 0 0.15em 0 var(--gfx-line); cursor: ew-resize; touch-action: none; }
.gfx-floor-edge .edge-end[data-side="left"] { left: 0; }
.gfx-floor-edge .edge-end[data-side="right"] { left: 100%; }
.gfx-floor-edge .edge-end::before { content: "↔"; color: var(--gfx-text); font-weight: 900; }
.gfx-lobby[data-floor-edit] .who { pointer-events: none; outline-color: color-mix(in srgb, var(--gfx-line) 22%, transparent); opacity: 0.72; }
.gfx-lobby:not([data-floor-edit]) .gfx-lobby-floor { display: none; }

/* ── 7-day attendance ───────────────────────────────────────────────────────────────────────────── */
${AT} .ev-panel[data-gfx-attendance] { position: relative; overflow: visible !important; background-color: var(--gfx-card) !important; padding-right: 15% !important;
  background-image: radial-gradient(color-mix(in srgb, var(--gfx-pick) 45%, transparent) 14%, transparent 15%) !important; background-size: 1.6em 1.6em !important;
  border: 3px solid var(--gfx-line) !important; border-radius: 26px !important; box-shadow: 0 0.4em 0 var(--gfx-line) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-title { display: inline-block; padding: 0.15em 1em; color: #fff !important; background: var(--gfx-accent); border: 3px solid var(--gfx-line);
  border-radius: 999px; box-shadow: 0 0.15em 0 var(--gfx-line); rotate: -2deg; text-shadow: 0 0.07em 0 color-mix(in srgb, var(--gfx-line) 60%, transparent); }
${AT} .ev-panel[data-gfx-attendance] .ev-day { position: relative; background: #fff !important; border: 2.5px solid var(--gfx-line) !important; border-radius: 16px !important;
  box-shadow: 0 0.22em 0 var(--gfx-line) !important; clip-path: none !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day .item-art { filter: drop-shadow(0 0.1em 0 color-mix(in srgb, var(--gfx-line) 35%, transparent)); }
${AT} .ev-panel[data-gfx-attendance] .ev-day .tick { display: none !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done { background: color-mix(in srgb, var(--gfx-ink) 80%, #ddd) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done > *:not(.tick) { opacity: 0.55; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done::after, ${AT} .ev-panel[data-gfx-attendance] .ev-day.gfx-stamped::after { content: "출석"; position: absolute; left: 50%; top: 42%; width: 62%; aspect-ratio: 1; translate: -50% -50%; rotate: -14deg;
  display: grid; place-items: center; font-family: "Jua", "Malgun Gothic", sans-serif; font-size: 1.15em; color: #E0484E;
  border: 3px solid #E0484E; border-radius: 50%; background: color-mix(in srgb, #fff 55%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, #E0484E 35%, transparent);
  animation: gfx-stamp 420ms cubic-bezier(.3,1.6,.5,1) both; }
@keyframes gfx-stamp { from { scale: 1.8; opacity: 0; } to { scale: 1; opacity: 1; } }
${AT} .ev-panel[data-gfx-attendance] .ev-day.next { border-color: var(--gfx-accent) !important; box-shadow: 0 0.22em 0 var(--gfx-accent), 0 0 0 0.25em color-mix(in srgb, var(--gfx-accent) 25%, transparent) !important;
  animation: gfx-float 1.4s ease-in-out infinite; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.next::before { content: "오늘!"; position: absolute; top: -0.9em; left: 50%; translate: -50% 0; z-index: 2; padding: 0.05em 0.6em;
  font-family: "Jua", "Malgun Gothic", sans-serif; font-size: 0.8em; color: #fff; background: var(--gfx-accent); border: 2px solid var(--gfx-line); border-radius: 999px; white-space: nowrap; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.prize { background: linear-gradient(170deg, #FFF3C4, #FFD97A) !important; border-color: #B8860B !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-n { display: inline-block; margin-top: 0.3em; padding: 0 0.6em; color: var(--gfx-line) !important; background: var(--gfx-pick);
  border: 2px solid var(--gfx-line); border-radius: 999px; font-family: "Jua", "Malgun Gothic", sans-serif; }
${AT} .ev-panel[data-gfx-attendance] .ev-claim { font-family: "Jua", "Malgun Gothic", sans-serif !important; font-size: 1.15em !important; padding: 0.35em 2em !important; color: #fff !important;
  background: var(--gfx-accent) !important; border: 3px solid var(--gfx-line) !important; border-radius: 999px !important; box-shadow: 0 0.25em 0 var(--gfx-line) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-x { border: 2px solid var(--gfx-line) !important; border-radius: 999px !important; background: var(--gfx-card) !important; box-shadow: 0 0.15em 0 var(--gfx-line) !important; }
.gfx-ev-mascot { position: absolute; right: -3%; bottom: 0; width: 19%; height: 104%; display: grid; place-items: end center; pointer-events: none; z-index: 3; }
.gfx-ev-mascot .body { width: 100%; height: 100%; display: grid; place-items: end center; transform-origin: 50% 100%; animation: gfx-bob 2s ease-in-out infinite; }
/* Baked sprites carry their outline already. */
img.baked { filter: none !important; }
.gfx-ev-mascot img, .gfx-ev-mascot svg { max-width: 150%; max-height: 100%; object-fit: contain; filter: ${STICKER}; }
.gfx-ev-mascot .say { position: absolute; top: 2%; right: 70%; white-space: nowrap; padding: 0.3em 0.8em; font-family: "Jua", "Malgun Gothic", sans-serif;
  color: var(--gfx-text); background: #fff; border: 2.5px solid var(--gfx-line); border-radius: 14px; box-shadow: 0 0.15em 0 var(--gfx-line); }

/* ── Settings pieces this extension adds ───────────────────────────────────────────────────────── */
.st-styles:has(> [data-gfx-set]) { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.st-sty[data-gfx-set] .st-mini i { border: 1.5px solid #6B4528; border-radius: 4px; }
.gfx-colors { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6em; margin-top: 0.8em; }
.gfx-color { display: flex; align-items: center; gap: 0.5em; padding: 0.35em 0.6em; cursor: pointer;
  border: 2px solid var(--ink-3); border-radius: 12px; background: var(--ink-2); font-size: var(--t-xs, 12px); }
.gfx-color input { width: 2em; height: 1.6em; padding: 0; border: 2px solid var(--steel-dark); border-radius: 8px; background: none; cursor: pointer; }
.gfx-toggles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6em; margin-top: 0.6em; }
.gfx-toggle { display: flex; flex-direction: column; gap: 0.2em; text-align: left; cursor: pointer; padding: 0.6em 0.8em;
  border: 2px solid var(--ink-3); border-radius: 14px; background: var(--ink-2); color: var(--text); font: inherit; }
.gfx-toggle b { font-family: var(--display); font-weight: 400; font-size: var(--t-sm, 13px); }
.gfx-toggle b::before { content: "○ "; }
.gfx-toggle[aria-pressed="true"] { border-color: var(--coral); }
.gfx-toggle[aria-pressed="true"] b::before { content: "● "; color: var(--coral); }
.gfx-toggle span { font-size: var(--t-tiny, 11px); color: var(--steel-faint); line-height: 1.4; }
.gfx-box-alpha { display: flex; align-items: center; gap: .8em; margin-top: .4em; }
.gfx-box-alpha input { flex: 1; max-width: 22em; accent-color: var(--gfx-accent, #F0763A); }
.gfx-box-alpha b { min-width: 3em; font-weight: 400; }
.gfx-field { display: flex; flex-direction: column; gap: 0.3em; margin-top: 0.7em; font-size: var(--t-xs, 12px); color: var(--steel-faint); }
.gfx-field select, .gfx-field textarea { font: inherit; font-size: var(--t-xs, 12px); color: var(--text); background: var(--surface, #fff);
  border: 2px solid var(--steel-dark); border-radius: 10px; padding: 0.45em 0.6em; }
.gfx-field input { font: inherit; font-size: var(--t-xs, 12px); color: var(--text); background: var(--surface, #fff);
  border: 2px solid var(--steel-dark); border-radius: 10px; padding: 0.4em 0.6em; }
/* Roster cards: the picture gives way so the name and role below always fit (the rounder font is taller
 * and the bottom line was cut off). */
${T} button.u { overflow: hidden; }
${T} button.u > .u-art { flex: 1 1 auto !important; min-height: 0 !important; }
${T} button.u > .u-meta { flex: none !important; padding-bottom: .35em !important; line-height: 1.3; }
/* Formation slots: the name strip was dim text on a near-black fade; a cream plate instead. */
${T} .slot .slot-meta { background: linear-gradient(0deg, color-mix(in srgb, var(--gfx-card) 96%, transparent) 60%, color-mix(in srgb, var(--gfx-card) 0%, transparent)) !important; padding-bottom: .3em !important; }
${T} .slot .slot-name { color: var(--gfx-text) !important; text-shadow: 0 0 3px var(--gfx-card) !important; }
${T} .slot .slot-role { color: var(--steel) !important; text-shadow: none !important; }
/* Chapter map "Start / auto-battle": its big label was white on a light pill and only the small line showed. */
${T} button.act.start { display: inline-flex !important; flex-direction: column; align-items: center; justify-content: center; gap: .05em; line-height: 1.15 !important;
  background: linear-gradient(180deg, var(--gfx-pick), color-mix(in srgb, var(--gfx-pick) 65%, var(--gfx-accent))) !important; color: var(--gfx-line) !important; padding: .35em 1.1em !important; }
${T} button.act.start > span { color: var(--gfx-line) !important; font-size: 1em; }
${T} button.act.start > small { color: color-mix(in srgb, var(--gfx-line) 72%, transparent) !important; font-size: .72em; }
/* SD vault in the editor: small sticker tiles, the one in use outlined. */
.gfx-sd-vault { display: flex; flex-wrap: wrap; gap: .45em; margin: .2em 0 .5em; }
.gfx-sd-pick { position: relative; width: calc(var(--f, 10px) * 5); height: calc(var(--f, 10px) * 6.6); padding: 3px; border: 2px solid var(--gfx-line, #6B4528); border-radius: 12px;
  background: var(--gfx-card, #FFF8E7); box-shadow: 0 .15em 0 var(--gfx-line, #6B4528); cursor: pointer; }
.gfx-sd-pick[aria-pressed="true"] { outline: 3px solid var(--gfx-accent, #F2557F); outline-offset: 1px; cursor: default; }
.gfx-sd-pick img { width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%; display: block; }
.gfx-sd-pick .x { position: absolute; top: -.5em; right: -.5em; width: 1.4em; height: 1.4em; display: grid; place-items: center; border-radius: 50%;
  background: var(--gfx-card, #FFF8E7); border: 2px solid var(--gfx-line, #6B4528); font-size: .8em; line-height: 1; }
/* Small text lines that the rounder font made too tall for their row. */
${T} .slot .slot-role, ${T} .slot .slot-name { line-height: 1.35 !important; overflow: visible !important; padding-bottom: .1em; }
${T} .slot .slot-meta { padding-bottom: .45em !important; }
${T} [data-screen="banner"] .bcard .bt-id :is(b, i) { line-height: 1.35 !important; overflow: visible !important; padding-bottom: .08em; }
/* Summon cards: the frame is the face's; the game's card inside drew a second border and corner of its own,
 * slightly off from the frame. */
${T} [data-screen="reveal"] .rv-front .u { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; clip-path: none !important; }
/* Formation slots: the cream name plate follows the card's rounded bottom (its square corners poked out). */
${T} .slot .slot-meta { border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; padding-bottom: .3em !important; }
/* Breathing room. The top bar's slot was exactly as tall as the back button and cut its outline off at the top
 * and bottom; card lists scrolled flush to their edge and cut the cards' borders and shadows. */
${T} .gf-bar-slot { overflow: clip !important; overflow-clip-margin: .5em; }
${T} :is(.grid-scroll, .rail-scroll) { padding: .55em .5em .75em !important; box-sizing: border-box; }
${T} [data-screen="banner"] .rail-scroll { display: flex; flex-direction: column; gap: .6em; }
${T} .slot { overflow: hidden; }
/* Formation slots: one even outline all round; the rarity colour is a band inside the top edge that the rounded
 * corners trim (a thicker top border in another colour met the sides at an angle and broke the corners). */
${T} .slot.filled { position: relative; border: 2px solid var(--gfx-line) !important; }
${T} .slot.filled::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: max(1.6em, 24px); z-index: 3; pointer-events: none; background: linear-gradient(var(--slot-rare, var(--steel)) 0 .32em, transparent .32em); border-top-left-radius: inherit; border-top-right-radius: inherit; }
${T} .slot.filled.r4 { --slot-rare: #A274E0; }
${T} .slot.filled.r5 { --slot-rare: #F2B600; }
/* Formation: room between a row label and its slots (the slots' coloured top edge ran into the label). */
${T} .board .slots { padding-top: .7em !important; }
${T} .board .row-lab { margin-bottom: .15em !important; }
/* No scrollbars anywhere under 말랑: lists still scroll with the wheel, a finger or a drag. */
${T} .gf-arena, ${T} .gf-arena * { scrollbar-width: none; }
${T} .gf-arena::-webkit-scrollbar, ${T} .gf-arena *::-webkit-scrollbar { display: none; }
/* The settings rail: the extra 말랑 tab made it a little wider than its column and a sideways scrollbar
 * showed. It never scrolls sideways, and a long list scrolls without drawing a bar. */
${T} .st-rail { overflow-x: hidden !important; scrollbar-width: none; }
${T} .st-rail::-webkit-scrollbar { display: none; }
${T} .st-rail > .st-sect { min-width: 0; max-width: 100%; box-sizing: border-box; }
${T} .st-rail > .st-sect .n { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Story: a character stepping in or out, or the place wipe, must never give the scene a sideways scrollbar. */
${T} .vn { overflow-x: clip !important; }
${T} :is(.vn-dock, .vn-bar) { overflow-x: clip !important; }
/* The 말랑 tab's panel: its plates take the place of the game's while it is open. */
.st-pane[data-gfx-tab-open] > :not(.gfx-view) { display: none !important; }
.gfx-view { display: contents; }
.gfx-settings-nav { display: flex; gap: .5em; position: sticky; top: 0; z-index: 20; padding: .45em; margin: .2em 0 .8em; background: color-mix(in srgb, var(--surface, #fff) 94%, transparent); border: 2px solid var(--ink-3); border-radius: 14px; }
.gfx-settings-nav button { flex: 1 1 0; }
[data-gfx-settings-view="ui"] [data-gfx-section="sd"], [data-gfx-settings-view="sd"] [data-gfx-section="ui"] { display: none !important; }
.gfx-sd-edit { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(18em, 0.75fr); gap: 1em; margin-top: 1em; padding: 0.9em;
  border: 2px dashed var(--coral); border-radius: 16px; background: var(--ink-2); }
.gfx-sd-edit[hidden] { display: none; }
.gfx-cheek-pad { position: relative; height: calc(var(--f, 10px) * 38); display: grid; place-items: center; cursor: crosshair; touch-action: none;
  border-radius: 12px; background: radial-gradient(70% 50% at 50% 80%, color-mix(in srgb, var(--coral) 15%, transparent), transparent 70%), var(--ink); }
.gfx-cheek-pad img { position: absolute; inset: 0; margin: auto; max-width: 100%; max-height: 100%; object-fit: contain; -webkit-user-drag: none; user-select: none; }
.gfx-cheek-pad .mark { position: absolute; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; pointer-events: none;
  border: 2px dashed var(--coral); background: color-mix(in srgb, var(--coral) 22%, transparent); }
.gfx-sd-edit-side { display: flex; flex-direction: column; gap: 0.2em; min-width: 0; }
.gfx-sd-edit-side > b { font-family: var(--display); font-weight: 400; font-size: var(--t-md, 15px); }
.gfx-field textarea { min-height: 4.2em; resize: vertical; font-family: ui-monospace, Consolas, monospace; }
.gfx-sd-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5em, 1fr)); gap: 0.7em; margin-top: 0.8em; }
.gfx-sd-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.35em; padding: 0.6em;
  border: 2px solid var(--ink-3); border-radius: 14px; background: var(--ink-2); }
.gfx-sd-thumb { width: 100%; aspect-ratio: 1; display: grid; place-items: end center; border-radius: 10px; overflow: hidden;
  background: radial-gradient(80% 60% at 50% 80%, color-mix(in srgb, var(--coral) 18%, transparent), transparent 70%), var(--ink); }
.gfx-sd-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
.gfx-sd-thumb img.portrait { width: 100%; height: 100%; object-fit: cover; opacity: 0.35; filter: grayscale(0.6); }
.gfx-sd-card .gfx-extra-tag { display: block; margin-top: .15em; font-size: .78em; color: var(--steel-faint); }
.gfx-sd-card[data-extra] { border-style: dashed; }
.gfx-sd-card b { font-family: var(--display); font-weight: 400; font-size: var(--t-xs, 12px); text-align: center; line-height: 1.2; }
.gfx-sd-card .st-chips { justify-content: center; }
.gfx-sd-card .st-chip { font-size: var(--t-tiny, 11px); padding: 0.2em 0.7em; }
.gfx-sd-card[data-busy] .gfx-sd-thumb::after { content: "그리는 중…"; position: absolute; inset: 0.6em 0.6em auto; aspect-ratio: 1;
  display: grid; place-items: center; font-family: var(--display); color: var(--coral); background: color-mix(in srgb, var(--ink) 70%, transparent); border-radius: 10px; }

/* Summon screen: cards, banner and pull controls use the same soft outlined language. */
${T} [data-screen="banner"] .bcard { border: 3px solid var(--gfx-line) !important; border-radius: 20px !important; box-shadow: 0 .28em 0 var(--gfx-line) !important; overflow: hidden; }
${T} [data-screen="banner"] .bcard[aria-pressed="true"] { outline: .3em solid color-mix(in srgb, var(--gfx-pick) 75%, transparent); outline-offset: -.05em; }
/* The banner list cut off the first card's top (its outline and lift reached above the list's edge). */
${T} [data-screen="banner"] .rail-scroll { padding: .45em .45em .6em !important; box-sizing: border-box; }
${T} [data-screen="banner"] .show { border: 3px solid var(--gfx-line); border-radius: 26px; overflow: hidden; box-shadow: 0 .42em 0 var(--gfx-line); }
${T} [data-screen="banner"] .chip { border-radius: 999px !important; background: color-mix(in srgb, var(--gfx-card) 92%, transparent) !important; border: 2px solid var(--gfx-line) !important; }
/* The banner's info block and its pity box are tall: rounded cards, not pills (a pill cut their text). */
${T} [data-screen="banner"] .float { border-radius: 20px !important; background: color-mix(in srgb, var(--gfx-card) 92%, transparent) !important;
  border: 2.5px solid var(--gfx-line) !important; box-shadow: 0 .25em 0 var(--gfx-line) !important; padding: .6em .9em !important; box-sizing: border-box; }
${T} [data-screen="banner"] .float .pity { border-radius: 12px !important; border: 0 !important; background: color-mix(in srgb, var(--gfx-pick) 30%, transparent) !important;
  padding: .45em .7em !important; margin: .35em 0 !important; box-sizing: border-box; }
${T} [data-screen="banner"] .float .pity .track { border-radius: 999px; overflow: hidden; }
${T} [data-screen="banner"] .float .pity .note { white-space: normal !important; line-height: 1.35; }
${T} [data-screen="banner"] .pull { border: 3px solid var(--gfx-line) !important; border-radius: 999px !important; background: linear-gradient(180deg, var(--gfx-pick), var(--gfx-accent)) !important; box-shadow: 0 .28em 0 var(--gfx-line) !important; }
/* Re-entering a screen must not replay entrance animations on every game redraw. */
${T} [data-in] { animation: none !important; opacity: 1 !important; }
/* A home popup (letters, the background picker): no live blur over the moving lobby, and the lobby holds still
 * behind it. Blurring a scene that redraws every frame was what made these popups stutter as they opened. */
${T} .root:has(:is([data-chat-close], .hm-pk-wrap)) :is(.hm-pk, .hm-chat-panel) { backdrop-filter: none !important; }
${T} .root:has(:is([data-chat-close], .hm-pk-wrap)) .hm-pk-veil { backdrop-filter: none !important; background: color-mix(in srgb, var(--gfx-ink) 55%, transparent) !important; }
${T} .root:has(:is([data-chat-close], .hm-pk-wrap)) [data-pop] { animation: none !important; }
${T} .hm-screen:has(:is([data-chat-close], .hm-pk-wrap)) .gfx-lobby .body,
${T} .root:has(:is([data-chat-close], .hm-pk-wrap)) .gfx-lobby .body { animation-play-state: paused !important; }
/* The events tab's scroll boxes are filled to the pixel, so a button dipping as it is pressed overflowed them
 * for a moment and a scrollbar flashed. They keep scrolling (wheel, drag) without drawing a bar; the long
 * battle-pass track keeps a thin one. */
${T} [data-screen="events"] :is(.ev-rail-scroll, .ev-pane, .pv-missions, .sv-fights, .sv-box, .sv-grid) { scrollbar-width: none; }
${T} [data-screen="events"] :is(.ev-rail-scroll, .ev-pane, .pv-missions, .sv-fights, .sv-box, .sv-grid)::-webkit-scrollbar { display: none; }
${T} [data-screen="events"] .pv-track { scrollbar-width: none; }
/* Tidewalk: the pawn's hop on a roll stays drawn but no longer counts as overflow of the panel. */
${T} [data-screen="events"] .bd { overflow: clip; overflow-clip-margin: 2em; }
${T} [data-screen="events"], ${T} [data-screen="events"] > .body, ${T} [data-screen="events"] .ev-cols { min-height: 0; min-width: 0; overflow: hidden !important; }
${T} [data-screen="events"] .ev-pane.pv { display: grid !important; grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0; min-width: 0; overflow: hidden !important; padding-bottom: .45em; }
/* Battle pass, 말랑 manner: roomy reward tiles (the squeezed columns cut their text), soft fade at the track's
 * ends, rounded mission cards. */
${T} [data-screen="events"] .pv-rail { grid-auto-columns: calc(var(--f, 10px) * 10) !important; gap: .5em .5em !important; padding: .2em .6em; }
${T} [data-screen="events"] .pv-track { overflow-x: auto; overflow-y: hidden; min-height: 0; padding: .35em 0 .7em;
  -webkit-mask: linear-gradient(90deg, transparent, #000 2.5%, #000 97.5%, transparent); mask: linear-gradient(90deg, transparent, #000 2.5%, #000 97.5%, transparent); }
${T} [data-screen="events"] .pv-lvl { position: relative; border: 2.5px solid var(--gfx-line) !important; border-radius: 16px !important; clip-path: none !important;
  background: var(--gfx-card) !important; box-shadow: 0 .2em 0 var(--gfx-line) !important; padding: .3em .3em .25em !important; gap: .1em; }
${T} [data-screen="events"] .pv-lvl.prize { background: linear-gradient(170deg, color-mix(in srgb, #FFD34E 38%, var(--gfx-card)), var(--gfx-card) 70%) !important; }
${T} [data-screen="events"] .pv-lvl.ready { background: color-mix(in srgb, var(--gfx-pick) 70%, var(--gfx-card)) !important; border-color: var(--gfx-accent) !important;
  box-shadow: 0 .2em 0 var(--gfx-line), 0 0 0 .2em color-mix(in srgb, var(--gfx-accent) 35%, transparent) !important; }
${T} [data-screen="events"] .pv-lvl.done { background: color-mix(in srgb, var(--gfx-card) 70%, var(--gfx-ink)) !important; box-shadow: none !important; border-color: color-mix(in srgb, var(--gfx-line) 45%, transparent) !important; }
${T} [data-screen="events"] .pv-lvl.off { opacity: .8; }
${T} [data-screen="events"] .pv-lvl .what { min-height: 0; line-height: 1.2; color: var(--gfx-text) !important; }
${T} [data-screen="events"] .pv-lvl img.item-art { width: 46% !important; } ${T} [data-screen="events"] .pv-lvl.done img.item-art { opacity: .6 !important; }
${T} [data-screen="events"] .pv-lvl .amt { color: var(--gfx-text) !important; }
${T} [data-screen="events"] .pv-lvl .tick { top: -.45em !important; right: -.45em !important; width: 1.5em; height: 1.5em; display: grid !important; place-items: center; border-radius: 50%;
  background: var(--gfx-accent); color: #fff !important; border: 2px solid var(--gfx-line); font-size: .8em; line-height: 1; }
${T} [data-screen="events"] .pv-n { padding: 0 .6em; border-radius: 999px; background: color-mix(in srgb, var(--gfx-card) 85%, transparent); border: 1.5px solid color-mix(in srgb, var(--gfx-line) 50%, transparent); color: var(--gfx-text) !important; }
${T} [data-screen="events"] .pv-list { gap: .55em !important; }
${T} [data-screen="events"] .pv-m { border: 2.5px solid var(--gfx-line) !important; border-radius: 16px !important; clip-path: none !important; background: var(--gfx-card) !important;
  box-shadow: 0 .2em 0 var(--gfx-line) !important; padding: .4em .75em !important; min-height: 0 !important; height: auto !important; }
${T} [data-screen="events"] .pv-m.done { background: color-mix(in srgb, var(--gfx-pick) 45%, var(--gfx-card)) !important; }
${T} [data-screen="events"] .pv-m .xp { border-radius: 999px; background: var(--gfx-accent) !important; color: #fff !important; padding: 0 .6em; }
${T} [data-screen="events"] .pv-m .bar, ${T} [data-screen="events"] .pv-xp .bar { border-radius: 999px !important; overflow: hidden; background: color-mix(in srgb, var(--gfx-line) 15%, transparent) !important; }
${T} [data-screen="events"] .pv-m .bar > i, ${T} [data-screen="events"] .pv-xp .bar > i { border-radius: 999px; background: var(--gfx-accent) !important; }
${T} [data-screen="events"] .pv-tab { border-radius: 999px !important; }
${T} [data-screen="events"] .pv-missions { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: .15em .3em .45em; }
${T} [data-screen="events"] .ev-foot { min-height: 0; padding-top: .3em; }
${T} [data-screen="events"] :is(.ev-claim, .sv-draw, .sv-fight) { font-size: calc(var(--f, 10px) * 1.15) !important; min-height: 2.4em; padding: .35em 1.4em !important; }
${T} [data-screen="events"] :is(.pv-reroll, .sv-ms-btn) { font-size: calc(var(--f, 10px) * .85) !important; padding: .25em .8em !important; }
@media (prefers-reduced-motion: reduce) {
  .gfx-vn-cast .who, .gfx-vn-cast .body, .gfx-lobby .body, .gfx-team > span { animation: none !important; transition: none !important; }
}
/* Summon cards. The frame sits on the faces, not the card box (it clipped the rays and glow). Cards fly in from
 * the middle, the back glows in its rarity before turning, and the turn bounces. */
${T} [data-screen="reveal"] .rv-card { border: 0 !important; overflow: visible !important; box-shadow: none !important; }
${T} [data-screen="reveal"] .rv-face { border: 3px solid var(--gfx-line) !important; border-radius: 18px !important; clip-path: none !important; overflow: hidden; box-shadow: 0 .3em 0 var(--gfx-line); }
${T} [data-screen="reveal"] .rv-facedown { background: radial-gradient(circle at 50% 38%, color-mix(in srgb, #fff 55%, transparent), transparent 60%), 
  linear-gradient(160deg, var(--gfx-sky1), var(--gfx-sky2)) !important; display: grid; place-items: center; }
${T} [data-screen="reveal"] .rv-facedown span { width: 46% !important; height: auto !important; aspect-ratio: 1; clip-path: none !important; border: 3px solid var(--gfx-line) !important; border-radius: 50%;
  background: var(--gfx-card) radial-gradient(circle, var(--gfx-pick) 0 30%, transparent 31%); }
${T} [data-screen="reveal"] .rv-card.r4:not(.revealed) .rv-facedown { box-shadow: 0 .3em 0 var(--gfx-line), 0 0 0 .25em #B48CF0, 0 0 1.2em #B48CF0; }
${T} [data-screen="reveal"] .rv-card.r5:not(.revealed) .rv-facedown { box-shadow: 0 .3em 0 var(--gfx-line), 0 0 0 .25em #FFC93C, 0 0 1.6em #FFC93C; animation: gfx-back-glow .8s ease-in-out infinite alternate; }
@keyframes gfx-back-glow { to { filter: brightness(1.15); } }
${T} [data-screen="reveal"].phase-reveal .rv-card { animation: gfx-deal 460ms cubic-bezier(.3,1.4,.5,1) both; animation-delay: calc(var(--i, 0) * 45ms); }
@keyframes gfx-deal { from { opacity: 0; transform: translate(var(--dx, 0), var(--dy, 0)) scale(.4) rotate(-12deg); } to { opacity: 1; transform: none; } }
${T} [data-screen="reveal"] .rv-inner { transition: transform 560ms cubic-bezier(.3,1.45,.5,1) !important; }
${T} [data-screen="reveal"] .rv-card.revealed .rv-inner { animation: gfx-flip-pop 560ms ease; }
@keyframes gfx-flip-pop { 50% { scale: 1.1; } 100% { scale: 1; } }
${T} [data-screen="reveal"] .rv-card.r5.revealed .rv-rays { opacity: .9 !important; animation: rvRays 1100ms ease-out, gfx-spin 6s linear 1100ms infinite !important;
  background: repeating-conic-gradient(from 0deg, color-mix(in srgb, #FFD34E 75%, transparent) 0 10deg, transparent 10deg 24deg) !important; }
@keyframes gfx-spin { to { rotate: 360deg; } }
${T} [data-screen="reveal"] .rv-card.r5.revealed .rv-front::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.7) 50%, transparent 65%) -150% 0 / 250% 100% no-repeat; animation: gfx-shine 1.6s ease 400ms 2; }
@keyframes gfx-shine { to { background-position: 150% 0; } }
${T} [data-screen="reveal"] .rv-card.r5.revealed .rv-face.rv-front { border-color: #E0A100 !important; box-shadow: 0 .3em 0 var(--gfx-line), 0 0 1.4em #FFD34E; }
${T} [data-screen="reveal"] .rv-card.r4.revealed .rv-face.rv-front { border-color: #8E6BD6 !important; box-shadow: 0 .3em 0 var(--gfx-line), 0 0 1em #B48CF0; }
/* Material cards (no portrait): a light sky tile with dots instead of the dark slate one. */
${T} .u-art.mat { background: radial-gradient(circle at 50% 35%, color-mix(in srgb, #fff 55%, transparent), transparent 62%), linear-gradient(160deg, var(--gfx-sky1), var(--gfx-sky2)) !important; }
${T} .u-art.mat svg { filter: drop-shadow(0 .1em 0 color-mix(in srgb, var(--gfx-line) 40%, transparent)); }
/* 5★ spotlight: the character takes the whole screen for a moment. */
.gfx-spot { position: absolute; inset: 0; z-index: 70; display: grid; place-items: center; overflow: hidden; cursor: pointer; container-type: size;
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, #FFD34E 60%, #fff), #F2A93B 55%, #8B4A1C); animation: gfx-load-in 220ms ease both; }
.gfx-spot[data-out] { animation: gfx-load-out 300ms ease forwards; pointer-events: none; }
.gfx-spot::before { content: ""; position: absolute; width: 180cqmax; aspect-ratio: 1; border-radius: 50%;
  background: repeating-conic-gradient(rgba(255,255,255,.45) 0 9deg, transparent 9deg 22deg); animation: gfx-spin 10s linear infinite; }
.gfx-spot img { position: relative; height: 86cqh; max-width: 70cqw; object-fit: contain; filter: drop-shadow(0 0 1.2cqmin #fff) drop-shadow(0 1.4cqmin 0 rgba(90,58,36,.35));
  animation: gfx-spot-in 700ms cubic-bezier(.3,1.4,.5,1) both; }
@keyframes gfx-spot-in { from { opacity: 0; transform: translateX(-30cqw) scale(.9); } to { opacity: 1; transform: none; } }
.gfx-spot .who { position: absolute; left: 6cqw; bottom: 9cqh; display: grid; gap: 1cqh; animation: gfx-pop 520ms cubic-bezier(.3,1.6,.5,1) 380ms both; }
.gfx-spot .who b { font-family: var(--display, "Jua"), sans-serif; font-size: 7cqmin; color: #fff; -webkit-text-stroke: .7cqmin #5A3A24; paint-order: stroke fill; }
.gfx-spot .who i { font-style: normal; font-size: 5cqmin; color: #FFD34E; -webkit-text-stroke: .5cqmin #5A3A24; paint-order: stroke fill; letter-spacing: .1em; }
.gfx-spot .tap { position: absolute; bottom: 3cqh; right: 4cqw; font-size: 2.6cqmin; color: #fff; opacity: .9; animation: rvBlink 1.1s ease-in-out infinite; }
/* Location change: the old cast steps out, a soft wipe names the new place. */
.gfx-vn-cast-out { pointer-events: none; animation: gfx-cast-out 480ms ease forwards; }
@keyframes gfx-cast-out { to { opacity: 0; translate: 0 6%; filter: blur(2px); } }
.gfx-scene-wipe { position: absolute; inset: 0; z-index: 4; pointer-events: none; display: grid; place-items: center;
  background: radial-gradient(circle, color-mix(in srgb, var(--gfx-card) 55%, transparent), color-mix(in srgb, var(--gfx-ink) 85%, transparent));
  animation: gfx-wipe 1.45s ease forwards; }
.gfx-scene-wipe > span { padding: .35em 1.2em; font-family: var(--display, "Jua"), sans-serif; font-size: calc(var(--f, 10px) * 1.6); color: var(--gfx-text);
  background: var(--gfx-card); border: 3px solid var(--gfx-line); border-radius: 999px; box-shadow: 0 .2em 0 var(--gfx-line); animation: gfx-pop 420ms cubic-bezier(.3,1.6,.5,1) both; }
@keyframes gfx-wipe { 0% { opacity: 0; } 22% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
/* Summon capsule. The game's own charge ring is hidden while ours plays. */
${T} [data-screen="reveal"]:has(.gfx-summon) .rv-sigil { visibility: hidden; }
${T} [data-screen="reveal"] .rv-back { background: radial-gradient(circle at 50% 42%, color-mix(in srgb, #fff 60%, transparent), transparent 55%), 
  linear-gradient(160deg, var(--gfx-sky1), var(--gfx-ink) 50%, var(--gfx-sky2)) !important; }
.gfx-summon { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; overflow: hidden; cursor: pointer; container-type: size;
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, #fff 55%, transparent), transparent 55%), 
    radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--cap) 35%, var(--gfx-card, #FFF4D9)), var(--gfx-sky2, #BDE9DA));
  animation: gfx-load-in 200ms ease both; }
.gfx-summon[data-out] { animation: gfx-load-out 300ms ease forwards; pointer-events: none; }
.gfx-cap { width: 34cqmin; aspect-ratio: 1; position: relative; z-index: 2; transform-origin: 50% 90%;
  animation: gfx-cap-drop 480ms cubic-bezier(.3,1.5,.5,1) both, gfx-cap-wobble 560ms ease-in-out 500ms 1 both; }
.gfx-cap svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 1.2cqmin 0 rgba(90,58,36,.35)); }
.gfx-cap g { transform-box: view-box; }
/* The seal pops, the flap flips open over the top, the letter rises out glowing, then the envelope sinks away. */
/* The seal pops, the closed flap folds up out of sight, the open flap rises behind the letter, and the letter
 * slides up out of the pocket glowing. */
.gfx-cap .cap-band { transform-origin: 70px 80px; animation: gfx-cap-pop 260ms ease 880ms both; }
.gfx-cap .cap-top { transform-origin: 70px 40px; animation: gfx-cap-fold 140ms ease-in 960ms both; }
.gfx-cap .cap-open { transform-origin: 70px 42px; animation: gfx-cap-unfold 200ms cubic-bezier(.3,1.5,.5,1) 1090ms both; }
.gfx-cap .cap-letter { animation: gfx-cap-rise 300ms cubic-bezier(.3,1.4,.5,1) 1160ms both; }
.gfx-cap :is(.cap-bot, .cap-front, .cap-open) { transform-box: view-box; }
@keyframes gfx-cap-fold { to { transform: scaleY(0); } }
@keyframes gfx-cap-unfold { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes gfx-cap-rise { to { transform: translateY(-30px) scale(1.06); filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 14px var(--cap, #fff)); } }
@keyframes gfx-cap-pop { 40% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(.2); opacity: 0; } }
@keyframes gfx-cap-drop { 0% { transform: translateY(-120cqh) rotate(-20deg); } 70% { transform: translateY(0) scale(1.08, .9); } 100% { transform: translateY(0) scale(1); } }
@keyframes gfx-cap-wobble { 0%, 100% { rotate: 0deg; } 20% { rotate: -14deg; } 45% { rotate: 12deg; } 70% { rotate: -7deg; } 85% { rotate: 4deg; } }
@keyframes gfx-cap-open { to { transform: translate(-6%, -42%) rotate(-38deg); opacity: 0; } }
@keyframes gfx-cap-sink { to { transform: translateY(18%) scale(.9); opacity: 0; } }
.gfx-cap-rays { position: absolute; width: 160cqmin; aspect-ratio: 1; z-index: 1; opacity: 0;
  background: repeating-conic-gradient(color-mix(in srgb, var(--cap) 70%, #fff) 0 10deg, transparent 10deg 22deg);
  mask: radial-gradient(circle, #000 15%, transparent 62%); -webkit-mask: radial-gradient(circle, #000 15%, transparent 62%);
  animation: gfx-cap-rays 1.2s ease 1080ms both; }
@keyframes gfx-cap-rays { 0% { opacity: 0; transform: scale(.3) rotate(0deg); } 30% { opacity: 1; } 100% { opacity: .85; transform: scale(1) rotate(40deg); } }
.gfx-cap-confetti { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.gfx-cap-confetti i { position: absolute; left: 50%; top: 52%; width: 2.2cqmin; height: 3.4cqmin; border-radius: .6cqmin; background: var(--c); opacity: 0;
  transform: rotate(var(--a)) translateY(0); animation: gfx-cap-burst 700ms cubic-bezier(.2,.8,.4,1) 1100ms both; }
@keyframes gfx-cap-burst { 0% { opacity: 0; transform: rotate(var(--a)) translateY(0) rotate(0deg); } 6% { opacity: 1; } 100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(-1 * var(--d))) rotate(320deg); } }
.gfx-cap-label { position: absolute; z-index: 4; top: 64%; font-family: var(--display, "Jua"), sans-serif; font-size: 7cqmin; color: #fff;
  -webkit-text-stroke: .9cqmin #5A3A24; paint-order: stroke fill; opacity: 0; animation: gfx-pop 380ms cubic-bezier(.3,1.6,.5,1) 1000ms both; }
.gfx-summon[data-rarity="5"] .gfx-cap-label { color: #FFD34E; font-size: 9cqmin; }
${T} [data-screen="reveal"] .rv-foot { background: color-mix(in srgb, var(--gfx-card) 94%, transparent) !important; border-top: 3px solid var(--gfx-line) !important; }

/* Keep replacement plates hidden through game DOM redraws; CG remains untouched. */
${H("[data-gfx-story-sd]")} .vn:has(> .gfx-vn-cast):not([data-cg]) .vn-plate { visibility: hidden !important; }
.gfx-vn-cast .who[data-protagonist] { z-index: 3; }
/* A newcomer stays hidden until the line-up has placed it (it showed for a moment at an even-share spot first). */
.gfx-vn-cast .who:not([data-placed]) { visibility: hidden; }
${AT} .ev-panel[data-gfx-attendance] .ev-day { color: #30251B !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.done { color: var(--gfx-text) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.prize * { color: #30251B !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-n { color: var(--gfx-pick-text) !important; }
${AT} .ev-panel[data-gfx-attendance] .ev-day.next::before, ${AT} .ev-panel[data-gfx-attendance] .ev-claim { color: var(--gfx-accent-text) !important; }
.gfx-ev-mascot img, .gfx-ev-mascot svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-position: center bottom; }
.gfx-ev-mascot .say { color: #30251B; }
.gfx-sd-thumb img { width: 100%; height: 100%; }
.gfx-sd-pick .x { color: var(--gfx-text, #30251B) !important; background: var(--gfx-card, #fff) !important; }
.gfx-sd-edit { grid-template-columns: minmax(12em, .8fr) minmax(0, 1.6fr); align-items: start; container-type: inline-size; }
@media (max-width: 700px) { .gfx-sd-edit { grid-template-columns: minmax(0, 1fr); } }
.gfx-cheek-pad { height: min(55vh, 36em); width: 100%; position: sticky; top: 1em; }
@media (max-width: 700px) { .gfx-cheek-pad { position: relative; top: auto; height: 32vh; } }
.gfx-sd-edit-side { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6em; align-items: start; }
.gfx-sd-edit-side > :is(b,.hint,.st-chips,.gfx-sd-vault,.gfx-field) { grid-column: 1 / -1; }
.gfx-sd-edit-side .gfx-field :is(input,textarea) { width: 100%; box-sizing: border-box; }
@container (min-width: 720px) { .gfx-sd-edit-side { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (max-width: 380px) { .gfx-sd-edit-side { grid-template-columns: minmax(0, 1fr); } }
${F} .side.enemies .row.front > .cbt { --col: 58%; }
${F} .side.enemies .row.back > .cbt { --col: 81%; }
${F} .side.enemies.no-front .row.back > .cbt { --col: 70%; }
${F} .side.enemies .cbt { width: 8.5% !important; height: 23% !important; top: calc(15% + var(--lane) * 26%); }
${F} .side.enemies .cbt > * { pointer-events: none; }
${F} .side.enemies .cbt:is(:hover,:focus-visible) { z-index: 45; outline: 2px solid var(--gfx-pick); outline-offset: 3px; }
${T} .forge-center { border: 3px solid var(--gfx-line); border-radius: 28px; padding: 1.5em; background: radial-gradient(ellipse at top, var(--gfx-sky1), var(--gfx-card)); color: var(--gfx-text); box-shadow: 0 .4em 0 var(--gfx-line); }
${T} .forge-center::before { content: "Now Loading · 이야기를 준비하고 있어요"; display: block; font-family: "Jua", sans-serif; color: var(--gfx-text); margin-bottom: .6em; }
.gfx-forge-mascot { margin-inline: auto; animation: gfx-bob 2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .gfx-forge-mascot { animation: none; } }

/* Full workspace editor: preview stays visible while tabs replace long form sections. */
.gfx-sd-edit:not([hidden]) { position: fixed; inset: 12px; z-index: 2147483005; margin: 0; padding: 16px; box-sizing: border-box; border: 3px solid var(--gfx-line); border-radius: 22px; background: var(--gfx-card); color: var(--gfx-text); box-shadow: 0 0 0 100vmax #0008; font-size: clamp(15px, 1.4vw, 19px); display: grid; grid-template-columns: minmax(200px, .9fr) minmax(340px, 1.3fr); grid-template-rows: auto auto auto minmax(0, 1fr); gap: 12px; overflow: hidden; align-items: stretch; }
.gfx-sd-edit-header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 1em; }
.gfx-sd-edit-header b { font-size: 1.2em; }
.gfx-sd-look-bar { grid-column: 1 / -1; }
.gfx-sd-look-bar select { max-width: 100%; font: inherit; padding: .4em .8em; color: var(--gfx-text); background: var(--gfx-card); border: 2px solid var(--gfx-line); border-radius: 12px; }
.gfx-sd-edit-tabs { grid-column: 2; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.gfx-sd-edit-tabs button { font: inherit; padding: .55em .2em; }
.gfx-sd-edit-tabs [aria-selected="true"] { background: var(--gfx-pick) !important; color: var(--gfx-pick-text) !important; }
.gfx-sd-edit > .gfx-cheek-pad { grid-column: 1; grid-row: 3 / 5; position: relative; top: auto; width: 100%; height: 100%; min-height: 0; }
.gfx-sd-edit-content { grid-column: 2; grid-row: 4; min-height: 0; display: flex; flex-direction: column; overflow: auto; }
.gfx-sd-edit-content > .gfx-sd-edit-side { display: flex; flex-direction: column; gap: .55em; min-height: 0; flex: 1; }
.gfx-sd-edit-content > [hidden] { display: none !important; }
.gfx-sd-edit-side .hint { margin: .2em 0; font-size: .85em; }
.gfx-sd-edit-side button, .gfx-sd-edit-side input, .gfx-sd-edit-side textarea { font-size: 1em; }
.gfx-sd-edit-side .gfx-field { margin: 0; }
.gfx-sd-edit-side[data-panel="prompt"] .gfx-field { display: flex; flex: 1; min-height: 0; flex-direction: column; }
.gfx-sd-edit-side[data-panel="prompt"] textarea { flex: 1; min-height: 6em; resize: none; }
.gfx-sd-edit-side[data-panel="lines"] { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-content: start; gap: .6em; }
.gfx-sd-edit-side[data-panel="lines"] > button:first-child { grid-column: 1 / -1; }
.gfx-sd-edit-side[data-panel="lines"] > .gfx-field { grid-column: 1; }
.gfx-sd-edit-side[data-panel="lines"] > button:not(:first-child) { grid-column: 2; grid-row: var(--line-row); align-self: end; }
@media (max-width: 720px) { .gfx-sd-edit:not([hidden]) { inset: 4px; padding: 10px; grid-template-columns: minmax(100px, .55fr) minmax(0, 1.45fr); font-size: 15px; gap: 8px; } .gfx-sd-edit-tabs { grid-column: 1 / -1; } .gfx-sd-edit > .gfx-cheek-pad { grid-row: 4; } .gfx-sd-edit-tabs button { font-size: 13px; } }

${F} .arena .cbt .aff-badge { visibility: hidden !important; }
.gfx-aff-layer { position: absolute; inset: 0; z-index: 48; pointer-events: none; overflow: visible; }
.gfx-aff-label { position: absolute; translate: 4px -50%; display: flex; align-items: center; justify-content: center; min-width: 1.6em; min-height: 1.6em; box-shadow: 0 .1em 0 var(--gfx-line); padding: .1em .25em; border: 2px solid var(--gfx-line); border-radius: 999px; background: var(--gfx-card); color: var(--gfx-text); }
.gfx-aff-label .aff-badge { position: static !important; width: 1.2em !important; height: 1.2em !important; border: 0 !important; background: none !important; box-shadow: none !important; transform: none !important; margin: 0 !important; visibility: visible !important; }
.gfx-aff-label svg { width: 100%; height: 100%; }

/* Top layer escapes the game header's transformed/clipped stacking contexts. */
.gfx-sd-edit:not([hidden]) { inset: 10px !important; width: calc(100vw - 20px) !important; height: calc(100dvh - 20px) !important; max-width: none !important; max-height: none !important; margin: 0 !important; container-type: normal; }
.gfx-sd-edit::backdrop { background: transparent; }
.gfx-sd-edit:not([hidden]) { box-shadow: 0 .4em 0 var(--gfx-line), 0 12px 30px #0006 !important; }
.gfx-sd-edit-header { min-width: 0; flex-wrap: nowrap; }
.gfx-sd-edit-header > button { flex: none; min-height: 40px; }
.gfx-sd-edit-content, .gfx-sd-edit-side { min-width: 0 !important; width: 100% !important; }
.gfx-sd-edit-content > .gfx-sd-edit-side[data-panel="prompt"] { display: grid; grid-template-rows: auto minmax(140px, 1fr) minmax(180px, 1.3fr); align-items: stretch !important; }
.gfx-sd-edit-side[data-panel="prompt"] .gfx-field { width: 100% !important; max-width: none !important; min-width: 0 !important; align-items: stretch !important; }
.gfx-sd-edit-side[data-panel="prompt"] textarea { display: block; width: 100% !important; max-width: none !important; min-width: 0 !important; height: 100% !important; min-height: 100px !important; box-sizing: border-box; }
.gfx-prompt-actions { display: flex; flex-wrap: wrap; gap: 8px; }
@media(max-width:720px) { .gfx-sd-edit:not([hidden]) { inset: 4px !important; width: calc(100vw - 8px) !important; height: calc(100dvh - 8px) !important; grid-template-columns: minmax(80px,.55fr) minmax(0,1.45fr); } .gfx-sd-edit[data-edit-tab="prompt"] > .gfx-cheek-pad { display:none; } .gfx-sd-edit[data-edit-tab="prompt"] > .gfx-sd-edit-content { grid-column: 1 / -1; } .gfx-sd-edit-header b { font-size: 16px; } }
@media(max-width:560px) { .gfx-sd-edit:not([hidden]) { grid-template-columns: minmax(0,1fr); grid-template-rows: auto auto auto minmax(90px,26dvh) minmax(0,1fr); padding: 8px; gap: 6px; } .gfx-sd-edit > .gfx-cheek-pad { grid-column: 1; grid-row: 4; } .gfx-sd-edit > .gfx-sd-edit-content { grid-column: 1; grid-row: 5; } .gfx-sd-edit[data-edit-tab="prompt"]:not([hidden]) { grid-template-rows: auto auto auto minmax(0,1fr); } .gfx-sd-edit[data-edit-tab="prompt"] > .gfx-sd-edit-content { grid-row: 4; } .gfx-sd-edit-tabs { gap: 4px; } .gfx-sd-edit-tabs button { font-size: 12px; padding: .5em 0; white-space: nowrap; } .gfx-sd-edit-header > button { min-height: 36px; } .gfx-sd-edit-side[data-panel="lines"] { grid-template-columns: minmax(0,1fr); } .gfx-sd-edit-side[data-panel="lines"] > * { grid-column: 1 !important; grid-row: auto !important; } }
`;

const lum = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "")); if (!m) return 1; const n = parseInt(m[1], 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
  let sheet = null, varSheet = null;
  function styleSheet() {
    if (!sheet) { sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); }
    return sheet;
  }
  // The picked colours: a second, tiny sheet rewritten on every change.
  let varText = "";
  function paintVars() {
    if (!varSheet) varSheet = new CSSStyleSheet();
    const c = prefs.colors;

    const dark = lum(c.ink) < 0.45;
    let text = T + ", " + T + " .gf-arena, .gfx-load, :host([data-gfx-style=\"trickcal\"][data-gfx-ghost]) { " + COLOR_FIELDS.map(([k]) => "--gfx-" + k + ": " + c[k] + ";").join(" ")
      + " --gfx-box-a: " + prefs.boxOpacity + "%; --gfx-strong: " + (dark ? "var(--gfx-text)" : "var(--gfx-line)") + "; --gfx-pick-text: " + (lum(c.pick) > 0.5 ? "#241B24" : "#FFFFFF") + "; --gfx-accent-text: " + (lum(c.accent) > 0.5 ? "#241B24" : "#FFFFFF") + "; --gfx-jade-text: " + (dark ? "#86E3B8" : "#1C6B54") + "; }";
    const font = JSON.stringify(prefs.font || "Jua") + ', "Malgun Gothic", sans-serif';
    // Dark presets: no polka dots and no white disc behind the SD (both glared on 밤하늘).
    if (dark) text += '.gfx-load { background: linear-gradient(160deg, var(--gfx-sky1), var(--gfx-ink) 65%, var(--gfx-sky2)) !important; }'
      + ' .gfx-load-stage::before { background: radial-gradient(circle, color-mix(in srgb, var(--gfx-pick) 14%, transparent), transparent 65%) !important; }'
      + ' .gfx-load-pop { text-shadow: 0 0 4px var(--gfx-line) !important; } .gfx-mochi .shine { fill: var(--gfx-text); opacity: .5; }';
    text += T + ' { --display: ' + font + '; --body: ' + font + '; } ' + T + ' :is(button,input,textarea,select,p,span,b,h1,h2,h3,label), .gfx-load { font-family: ' + font + ' !important; }';
    if (text !== varText) { varText = text; varSheet.replaceSync(text); }
    return varSheet;
  }

  /* ═════════════ Fonts ═════════════
   * The page's CSP allows fonts from this server only, so the rounded fonts come through Marinara's own font
   * library (/api/fonts, files in the data folder). Missing ones fall back to Malgun Gothic until the player
   * fetches them with the button in the colour plate. */
  let fonts = { status: "loading", missing: FONT_FAMILIES.slice(), note: "" };
  const addedFaces = new Set();
  async function loadFonts() {
    try {
      const res = await fetch("/api/fonts", { credentials: "same-origin" });
      const list = res.ok ? await res.json() : [];
      for (const f of Array.isArray(list) ? list : []) {
        if (!FONT_FAMILIES.includes(f.family) || addedFaces.has(f.url)) continue;
        addedFaces.add(f.url);
        const desc = { weight: f.weight || "400", style: f.style || "normal" };
        if (f.unicodeRange) desc.unicodeRange = f.unicodeRange;
        try { document.fonts.add(new FontFace(f.family, "url(" + JSON.stringify(f.url) + ")", desc)); } catch {}
      }
      const have = new Set((Array.isArray(list) ? list : []).map((f) => f.family));
      const missing = FONT_FAMILIES.filter((f) => !have.has(f));
      fonts = { status: missing.length ? "missing" : "ok", missing, note: fonts.note };
    } catch {
      fonts = { status: "error", missing: FONT_FAMILIES.slice(), note: "" };
    }
    paintSettings();
  }
  async function fetchFonts() {
    if (fonts.status === "fetching") return;
    const want = fonts.missing.slice();
    fonts = { ...fonts, status: "fetching", note: "" };
    paintSettings();
    let failed = "";
    for (const family of want) {
      try {
        const res = await fetch("/api/fonts/google/download", {
          method: "POST", credentials: "same-origin",
          headers: JSON_HEADERS, body: JSON.stringify({ family }),
        });
        if (!res.ok && res.status !== 409) failed = ((await res.json().catch(() => null))?.error) || "HTTP " + res.status;
      } catch (e) { failed = e.message; }
    }
    fonts.note = failed ? "일부 글꼴을 받지 못했습니다: " + failed : "";
    await loadFonts();
  }

  /* ═════════════ The game ═════════════ */
  function host() { return document.querySelector(HOST_TAG); }
  function gameRoot() { return host()?.shadowRoot || null; }
  const runId = () => { const h = host(); return String(h?._run?.runId || h?._activeRunId || ""); };
  async function gf(path, body) {
    const res = await fetch("/api/gacha-forge" + path, {
      method: "POST", credentials: "same-origin", headers: JSON_HEADERS, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) throw Error((data && data.error) || "HTTP " + res.status);
    return data;
  }

  // Per world: the roster (to match portraits to names) and the SD sprites made for it.
  const worlds = new Map(); // runId -> { cards, byPortrait, outfits, sd: {name: {url, variants,...}}, state }
  const pathOf = (u) => { try { return new URL(u, location.origin).pathname; } catch { return String(u || ""); } };
  function world(id = runId()) {
    if (!id) return null;
    let w = worlds.get(id);
    if (!w) { w = { id, cards: [], byPortrait: new Map(), outfits: new Map(), details: new Map(), detailsLoading: new Set(), sd: {}, state: "new", busy: new Set(), note: "" }; worlds.set(id, w); }
    return w;
  }
  async function loadWorld(force = false) {
    const w = world();
    if (!w || w.state === "loading" || (!force && w.state === "ready")) return w;
    w.state = "loading";
    try {
      const [ro, stored] = await Promise.all([gf("/roster", { runId: w.id }), storeGet()]);
      w.cards = (ro.cards || []).filter((c) => c && c.kind === "character" && c.name);
      const run = host()?._run;
      if (run?.protagonist?.name) addExtras(w, [run.protagonist]);
      if (Array.isArray(host()?._beatCast)) addExtras(w, host()._beatCast);
      w.byPortrait = new Map(w.cards.filter((c) => c.portrait).map((c) => [pathOf(c.portrait), c.name]));
      // Characters the story uses that are not owned yet (banner characters, story-only cast): listed as extras.
      addExtras(w, await bannerCast(w.id));
      for (const name of Object.keys(stored?.["sd:" + w.id] || readSdBackup()["sd:" + w.id] || {})) addExtras(w, [{ name }]);
      const pending = readPending();
      if (stored) sdReadOk.add(w.id);
      const sd = stored?.["sd:" + w.id], waiting = pending["sd:" + w.id];
      w.sd = withBackup("sd:" + w.id, { ...(sd && typeof sd === "object" ? sd : {}), ...(waiting && typeof waiting === "object" ? waiting : {}) });
      // The server lacked something the browser copy had (or was empty after a reinstall): put it back.
      if (stored && JSON.stringify(w.sd) !== JSON.stringify(sd || {})) storePatch({ ["sd:" + w.id]: w.sd });
      else if (stored) writeSdBackup("sd:" + w.id, w.sd);
      for (const [name, entry] of Object.entries(w.sd)) {
        const portraits = Object.keys(entry?.variants || {});
        w.outfits.set(name, new Set(portraits));
        for (const portrait of portraits) w.byPortrait.set(pathOf(portrait), name);
      }
      if (stored) adoptPrefs(stored);
      w.state = "ready";
      // SDs drawn but never recorded (the refused saves): find them in the gallery.
      if (w.cards.some((c) => !w.sd[c.name]?.url)) recoverSd(true);
    } catch (e) {
      w.state = "error";
      w.note = "캐릭터 목록을 읽지 못했습니다: " + e.message;
    }
    refresh();
    return w;
  }
  /* An extra is a character met in the story without a roster card: a banner character not pulled yet, or a
   * story-only cast member. It can have an SD, lines and cheeks like anyone, appears in the story and the SD
   * list, and stays out of the lobby (that is the player's own team). */
  function addExtras(w, list) {
    let added = false;
    for (const x of list || []) {
      const name = String(x?.name || "").trim();
      if (!name) continue;
      const existing = w.cards.find((c) => c.name === name);
      if (existing) {
        if (!existing.look) existing.look = String(x.appearance || x.look || "").trim();
        if (!existing.portrait && (x.portrait || x.art)) { existing.portrait = x.portrait || x.art; w.byPortrait.set(pathOf(existing.portrait), name); }
        if (!existing.id) existing.id = x.id || x.unitId || "";
        continue;
      }
      w.cards.push({ name, id: x.id || x.unitId || "", portrait: x.portrait || x.art || "", kind: "character", extra: true,
        look: String(x.appearance || x.look || "").trim() });
      if (x.portrait || x.art) w.byPortrait.set(pathOf(x.portrait || x.art), name);
      added = true;
    }
    return added;
  }
  async function bannerCast(runId) {
    try {
      const first = await gf("/summon-banner", { runId });
      const ids = (first.banners || []).filter((b) => !b.kind || b.kind === "character" || /char/.test(b.id || "")).map((b) => b.id).filter(Boolean);
      const all = await Promise.all(ids.map((id) => gf("/summon-banner", { runId, bannerId: id }).catch(() => null)));
      const units = [first, ...all].flatMap((r) => [...(r?.banner?.featured || []), ...(r?.banner?.pool || []), ...(r?.banner?.units || [])]);
      return units.filter((u) => u && u.kind === "character" && u.name).map((u) => ({ name: u.name, id: u.id, portrait: u.portrait }));
    } catch { return []; }
  }
  // A character's details: the game's unit when it has one, else what its portrait was drawn from.
  async function unitOf(card, w = world()) {
    // No ID (met only in the story, or listed from saved data): find it on the banners by name.
    const override = w.sd[card.name]?.appearance;
    if (!card.id) { try { const hit = (await bannerCast(w.id)).find((u) => u.name === card.name); if (hit?.id) card.id = hit.id; } catch {} }
    let detail = {};
    if (card.id) { try { const u = (await gf("/unit", { runId: w.id, unitId: card.id })).unit; if (u) detail = u; if (u && String(override || u.appearance || "").trim()) return { ...u, appearance: override || u.appearance }; } catch {} }
    if (override || card.look) return { ...detail, name: card.name, appearance: override || card.look };
    let appearance = "";
    try {
      const list = await fetch("/api/global-gallery", { credentials: "same-origin" }).then((r) => r.json());
      const p = card.portrait && pathOf(card.portrait).split("/").pop();
      const hit = p && (Array.isArray(list) ? list : []).find((g) => String(g.filePath || "").endsWith(p) || String(g.url || "").endsWith(p));
      appearance = String(hit?.prompt || "").replace(/^[^.]*?Canonical appearance:\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 900);
    } catch {}
    return { ...detail, name: card.name, appearance };
  }
  // An outfit's SD entry (older saves kept a bare URL string).
  const sdVariant = (e, key) => { const v = e?.variants?.[key]; return typeof v === "string" ? { url: v } : v || null; };
  // The SD the lobby shows: the outfit picked for the lobby, else the base look.
  const lobbySd = (name) => { const e = sdEntry(name); return (e.lobby && sdVariant(e, e.lobby)?.url) || e.url || ""; };
  /* Switch to a drawing from the vault: the one in use goes back into the vault. key "" is the base look. */
  async function useSd(name, key, url) {
    const e = sdEntry(name), cur = key ? sdVariant(e, key) || {} : e;
    const history = [{ url: cur.url, at: cur.at || 0 }, ...(cur.history || [])].filter((h) => h.url && h.url !== url).slice(0, 8);
    const ent = { ...cur, url, at: Date.now(), history };
    await saveSdEntry(name, key ? { variants: { ...(e.variants || {}), [key]: ent } } : ent);
    paintSettings(); refreshSprites(); refresh();
  }
  async function dropSd(name, key, url) {
    const e = sdEntry(name), cur = key ? sdVariant(e, key) || {} : e;
    const history = (cur.history || []).filter((h) => h.url !== url);
    await saveSdEntry(name, key ? { variants: { ...(e.variants || {}), [key]: { ...cur, history } } } : { history });
    paintSettings();
  }
  const sdUrl = (name, portrait = "") => {
    const w = world(), e = w && name && w.sd[name];
    const activePortrait = portrait || w?.cards.find((c) => c.name === name)?.portrait || "";
    const variant = activePortrait && e?.variants?.[pathOf(activePortrait)];
    return typeof variant === "string" ? variant : variant?.url || e?.url || "";
  };
  const anySd = () => {
    const w = world();
    if (!w) return [];
    return Object.values(w.sd).flatMap((e) => [e?.url, ...Object.values(e?.variants || {}).map((v) => typeof v === "string" ? v : v?.url)]).filter(Boolean);
  };
  async function loadUnitDetails(card, w = world()) {
    if (!w || w.details.has(card.name) || w.detailsLoading.has(card.name)) return;
    w.detailsLoading.add(card.name);
    try {
      const unit = await unitOf(card, w);
      w.details.set(card.name, unit);
      const variants = w.outfits.get(card.name) || new Set();
      for (const outfit of unit.outfits || []) {
        if (!outfit.url) continue;
        const path = pathOf(outfit.url);
        variants.add(path); w.byPortrait.set(path, card.name);
      }
      w.outfits.set(card.name, variants);
      if (!disposed && world() === w) paintSettings();
    } catch (e) { w.note = "의상 정보를 읽지 못했습니다: " + e.message; }
    finally { w.detailsLoading.delete(card.name); }
  }
  let syncBusy = false;
  async function syncStored() {
    if (disposed || syncBusy || document.hidden || !current) return;
    syncBusy = true;
    try {
      const stored = await storeGet(), pending = readPending(), w = world();
      if (!stored) return;
      let changed = false;
      if (w && w.state === "ready" && !sdReadOk.has(w.id)) { sdReadOk.add(w.id); w.sd = withBackup("sd:" + w.id, { ...(stored["sd:" + w.id] || {}), ...w.sd }); storePatch({ ["sd:" + w.id]: w.sd }); changed = true; }
      else if (w && stored["sd:" + w.id]) {
        const next = withBackup("sd:" + w.id, { ...stored["sd:" + w.id], ...(pending["sd:" + w.id] || {}) });
        if (JSON.stringify(next) !== JSON.stringify(w.sd)) { w.sd = next; changed = true; }
      }
      const editing = gameRoot()?.activeElement?.matches("input, textarea, select");
      // Another device changed the settings (or the style pick): follow it.
      if (!prefsReadOk) { if (adoptPrefs(stored)) changed = true; storePatch({}); }
      else if (stored.prefs && !editing && !lobbyEdit && adoptPrefs(stored)) changed = true;
      if (w?.state === "error") await loadWorld();
      if (changed) { refresh(); refreshSprites(); }
    } finally { syncBusy = false; }
  }

  /* ═════════════ Applying ═════════════ */
  /* The game fades a screen out (and holds one in place while redrawing) through a copy in a layer of its own
   * (div.gf-leave / div.gf-hold with its own shadow root and only the game's styles). Without this sheet the copy
   * showed the plain screen washed out, with the lobby's SDs at full picture size. */
  function dressGhost(layer) {
    const h = host(), sr = layer?.shadowRoot;
    if (!h || !sr || layer.hasAttribute("data-gfx-ghost")) return;
    layer.setAttribute("data-gfx-ghost", "");
    for (const a of h.getAttributeNames()) if (a === ATTR || a.startsWith("data-gfx-")) layer.setAttribute(a, h.getAttribute(a));
    sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, styleSheet(), paintVars()];
  }
  function dressGhosts(root) {
    if (!current) return;
    for (const layer of root.querySelectorAll(".gf-stage > .gf-leave, .gf-stage > .gf-hold")) dressGhost(layer);
  }
  function setFlag(h, name, value) {
    if (value) { if (!h.hasAttribute(name)) h.setAttribute(name, ""); }
    else if (h.hasAttribute(name)) h.removeAttribute(name);
  }
  /* The 말랑 quest look is a skin on the quest extension's own frame: same layout, its colours. The frame stays
   * the quest extension's live markup, so a tab change shows straight away (the old rebuilt copy lagged a beat
   * behind and showed the original screen first). Under the skin the frame keeps the base ("modern") layout; the
   * world's own theme comes back when 말랑 is turned off. */
  let questLastWorld = "";
  function questWorldKey(panel) {
    // A render without the world picker must not drop the skin for a frame: the last world stands in.
    const key = panel.querySelector('[data-action="pick-world"][aria-checked="true"]')?.dataset.id || "";
    if (key) questLastWorld = key;
    return key || questLastWorld;
  }
  function questUnskin(panel) {
    if (!panel?.hasAttribute("data-gfx-mallang")) return;
    panel.removeAttribute("data-gfx-mallang");
    if (panel.dataset.gfxTheme) panel.dataset.theme = panel.dataset.gfxTheme;
    delete panel.dataset.gfxTheme;
    for (const b of panel.querySelectorAll('[data-action="pick-theme"][data-gfx-was-pressed]')) { b.setAttribute("aria-pressed", "true"); b.removeAttribute("data-gfx-was-pressed"); }
  }
  function questSelectView(panel, enabled) {
    const key = questWorldKey(panel); if (!key) return;
    prefs.questViews[key] = enabled;
    savePrefs();
    paintQuestTheme();
  }
  function questSkinCss() {
    const c = prefs.colors, dark = lum(c.ink) < 0.45;
    const mix = (a, b, p) => "color-mix(in srgb, " + a + " " + p + "%, " + b + ")";
    const line = dark ? mix(c.text, c.card, 30) : c.line;
    const pickText = lum(c.pick) > 0.5 ? "#241B24" : "#FFFFFF", accentText = lum(c.accent) > 0.5 ? "#241B24" : "#FFFFFF";
    const font = JSON.stringify(prefs.font || "Jua") + ',"Malgun Gothic",sans-serif';
    // [data-theme] keeps these above each quest theme's own rules, whichever theme the world has.
    const P = "#gfq-01-panel[data-gfx-mallang][data-theme]";
    const dots = "radial-gradient(" + mix(c.card, "transparent", dark ? 10 : 55) + " 17%, transparent 18%) 0 0/26px 26px";
    return `
${P}{--paper:${c.ink}!important;--paper2:${mix(c.ink, c.line, 85)}!important;--card:${c.card}!important;--card2:${mix(c.card, c.text, 94)}!important;--hi:${mix(c.pick, c.card, 35)}!important;--ink:${c.text}!important;--sub:${mix(c.text, c.card, 68)}!important;--line:${line}!important;--ind:${c.accent}!important;--ind2:${mix(c.accent, "#fff", 80)}!important;--indd:${mix(c.accent, c.line, 70)}!important;--mark:${c.pick}!important;--amb:${c.pick}!important;--onacc:${accentText}!important;--board:${mix(c.card, c.ink, 85)}!important;--hatch1:${mix(c.card, c.ink, 80)}!important;--hatch2:${mix(c.card, c.ink, 90)}!important;--serif:${font}!important;--cond:${font}!important;--gm-line:${line};--gm-pick:${c.pick};--gm-pick-text:${pickText};
  color:var(--ink)!important;color-scheme:${dark ? "dark" : "light"};background:${c.ink}!important;border:3px solid var(--gm-line)!important;border-radius:26px!important;font-family:${font}!important}
${P} :is(h1,h2,h3,h4,b,button,summary,.gfq-tab-l,.gfq-chip){font-family:${font}!important;letter-spacing:0!important}
${P} .gfq-side{background:linear-gradient(170deg,${c.sky1},${c.sky2})!important;border:0!important;border-right:3px solid var(--gm-line)!important;box-shadow:none!important}
${P} .gfq-side::before,${P} .gfq-side::after,${P} .gfq-card::after,${P} .gfq-main::before,${P} .gfq-main::after{display:none!important}
${P} .gfq-brand{color:${c.text}!important}
${P} .gfq-brand-mark{border:3px solid var(--gm-line)!important;border-radius:50%!important;transform:none!important;background:${c.pick}!important;box-shadow:inset -3px -4px 0 ${mix(c.pick, c.line, 75)}!important}
${P} .gfq-tabs button{background:none!important;border:0!important;box-shadow:none!important;color:var(--ink)!important}
${P} .gfq-tab-ic{border:3px solid var(--gm-line)!important;border-radius:50%!important;background:${c.card}!important;color:var(--ink)!important;box-shadow:0 3px 0 var(--gm-line)!important;transform:none!important}
${P} .gfq-tab-l{clip-path:none!important;text-decoration:none!important;border:3px solid var(--gm-line)!important;border-radius:999px!important;background:${c.card}!important;color:var(--ink)!important;box-shadow:0 3px 0 var(--gm-line)!important}
${P} .gfq-tabs button:hover :is(.gfq-tab-ic,.gfq-tab-l){background:${mix(c.pick, c.card, 40)}!important}
${P} .gfq-tabs button.primary :is(.gfq-tab-ic,.gfq-tab-l){background:var(--gm-pick)!important;color:var(--gm-pick-text)!important;border-color:var(--gm-line)!important;transform:translateY(-2px)!important;box-shadow:0 5px 0 var(--gm-line)!important}
${P} .gfq-main{background:${dots},${c.ink}!important}
${P} .gfq-top{background:${c.ink}!important;border-bottom:3px dashed ${mix(line, "transparent", 55)}!important;box-shadow:none!important}
${P} .gfq-top h2{display:inline-block;padding:.22em .8em .28em!important;background:${c.accent}!important;color:${accentText}!important;border:3px solid var(--gm-line)!important;border-radius:999px!important;box-shadow:0 4px 0 var(--gm-line)!important;rotate:-2deg;text-shadow:none!important}
${P} .gfq-card,${P} :is(.gfq-dossier,.gfq-placecard,.gfq-ticket,.gfq-qdetail,.gfq-qform,.gfq-side-foot,.gfq-cal,.gfq-board,.gfq-receipt){background:${c.card}!important;color:var(--ink)!important;border:3px solid var(--gm-line)!important;border-radius:20px!important;box-shadow:0 5px 0 var(--gm-line)!important;background-image:none!important}
${P} .gfq-card::before{left:14px!important;top:-9px!important;bottom:auto!important;width:46px!important;height:14px!important;border-radius:999px!important;background:var(--gm-pick)!important;border:2.5px solid var(--gm-line)!important}
${P} :is(.gfq-qitem,.gfq-slot,.gfq-face,.gfq-theme,.gfq-rw-tile,.gfq-chcard,.gfq-plate,.gfq-photo){border:2.5px solid var(--gm-line)!important;border-radius:16px!important;box-shadow:0 3px 0 var(--gm-line)!important;background:${c.card}!important;color:var(--ink)!important}
${P} :is(.gfq-qitem,.gfq-slot,.gfq-face,.gfq-theme).on,${P} .gfq-theme[aria-pressed="true"]{background:var(--gm-pick)!important;color:var(--gm-pick-text)!important}
${P} :is(.gfq-qitem,.gfq-slot,.gfq-face,.gfq-theme).on *{color:inherit!important}
${P} :is(#gfq-content,.gfq-top) button:not(.gfq-qitem,.gfq-slot,.gfq-face,.gfq-theme,.gfq-rw-tile,.gfq-chcard,.gfq-seg button,.gfq-drop-menu button){border:2.5px solid var(--gm-line)!important;border-radius:14px!important;background:${c.card}!important;color:var(--ink)!important;box-shadow:0 3px 0 var(--gm-line)!important}
${P} :is(#gfq-content,.gfq-top) button.primary{background:${c.accent}!important;color:${accentText}!important}
${P} :is(#gfq-content,.gfq-top) button:not(:disabled):active{translate:0 2px;box-shadow:0 1px 0 var(--gm-line)!important}
${P} .gfq-close{border-radius:50%!important}
${P} :is(input,select,textarea){border:2.5px solid var(--gm-line)!important;border-radius:12px!important;background:${mix(c.card, c.ink, 92)}!important;color:var(--ink)!important;box-shadow:none!important}
${P} .gfq-seg{border:2.5px solid var(--gm-line)!important;border-radius:999px!important;background:${c.card}!important;box-shadow:0 3px 0 var(--gm-line)!important}
${P} .gfq-seg button{border-radius:999px!important;background:none!important;color:var(--ink)!important}
${P} .gfq-seg button[aria-pressed="true"]{background:var(--gm-pick)!important;color:var(--gm-pick-text)!important}
${P} .gfq-seg button[aria-pressed="true"] *{color:inherit!important}
${P} .gfq-drop summary{border:2.5px solid var(--gm-line)!important;border-radius:999px!important;background:${c.card}!important;color:var(--ink)!important;box-shadow:0 3px 0 var(--gm-line)!important}
${P} .gfq-drop-menu{border:2.5px solid var(--gm-line)!important;border-radius:16px!important;background:${c.card}!important;box-shadow:0 4px 0 var(--gm-line)!important;overflow:hidden}
${P} .gfq-chip{border-radius:999px!important;border:2px solid ${mix(line, "transparent", 60)}!important;background:${mix(c.pick, c.card, 30)}!important;color:var(--ink)!important}
${P} progress{accent-color:${c.accent}}
${P} #gfq-content p{color:var(--ink)!important}
${P} .gfq-muted,${P} small{color:var(--sub)!important}
`;
  }

  const questPopupRoots = new Map();
  const QUEST_POPUPS = "#gfq-01-toasts, #gfq-01-qtoasts, .gfq-01-ask";
  function questPopupCss() {
    const c = prefs.colors, font = JSON.stringify(prefs.font || "Jua") + ',"Malgun Gothic",sans-serif';
    const line = lum(c.ink) < 0.45 ? `color-mix(in srgb, ${c.text} 30%, ${c.card})` : c.line;
    const onAccent = lum(c.accent) > 0.5 ? "#241B24" : "#FFFFFF";
    const P = ':is(#gfq-01-toasts,#gfq-01-qtoasts,.gfq-01-ask)[data-gfx-mallang]';
    return `
${P}{--paper:${c.card}!important;--ink:${c.text}!important;--sub:color-mix(in srgb,${c.text} 68%,${c.card})!important;--serif:${font}!important;--sans:${font}!important;color-scheme:${lum(c.ink) < 0.45 ? "dark" : "light"}}
${P} .gfq-toast,${P}.gfq-01-ask{background:${c.card}!important;color:${c.text}!important;border:3px solid ${line}!important;border-radius:20px!important;box-shadow:0 5px 0 ${line},0 12px 30px #0003!important;font-family:${font}!important}
${P} .gfq-toast{--k:${c.accent}!important;overflow:hidden}
${P} .gfq-t-stub{background:linear-gradient(170deg,${c.sky1},${c.sky2})!important;color:${c.text}!important;border-right:3px dashed ${line}!important}
${P} :is(.gfq-t-body b,.gfq-t-body span,.gfq-ask-msg){font-family:${font}!important;letter-spacing:0!important;color:${c.text}!important}
${P} :is(.gfq-offer-row,.gfq-ask-row){flex-wrap:wrap;gap:8px}
${P} button{font-family:${font}!important;border:2.5px solid ${line}!important;border-radius:14px!important;box-shadow:0 3px 0 ${line}!important}
${P} :is(.gfq-offer-row,.gfq-ask-row) button{background:${c.accent}!important;color:${onAccent}!important}
${P} :is(button[data-o=later],button[value=no]){background:${c.card}!important;color:${c.text}!important}
${P} button[data-o=del]{background:${c.card}!important;color:#a3342a!important;border-color:#a3342a!important}
${P} button:not(:disabled):active{translate:0 2px;box-shadow:0 1px 0 ${line}!important}
${P} :is(input,textarea){background:color-mix(in srgb,${c.card} 92%,${c.ink})!important;color:${c.text}!important;border:2.5px solid ${line}!important;border-radius:12px!important;font-family:${font}!important}
${P} :is(button,input,textarea):focus-visible{outline:3px solid ${c.pick}!important;outline-offset:3px}
${P}.gfq-01-ask::backdrop{background:#0006}
`;
  }
  function paintQuestPopups() {
    if (disposed) return;
    const panel = document.getElementById("gfq-01-panel");
    let key = panel?.querySelector('[data-action="pick-world"][aria-checked="true"]')?.dataset.id;
    if (!key) { try { key = JSON.parse(localStorage.getItem("gf-quest-v1") || "null")?.world; } catch {} }
    const enabled = !!current && !!prefs.questViews[key || questLastWorld];
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    const roots = new Set([document, host()?.shadowRoot, fs?.shadowRoot].filter(Boolean));
    for (const [root, observer] of questPopupRoots) if (root !== document && !root.host?.isConnected) { observer.disconnect(); questPopupRoots.delete(root); }
    for (const root of roots) {
      if (!questPopupRoots.has(root)) {
        const observer = new MutationObserver((records) => {
          if (records.some((r) => Array.from(r.addedNodes).some((n) => n.matches?.(QUEST_POPUPS) || n.querySelector?.(QUEST_POPUPS)))) paintQuestPopups();
        });
        observer.observe(root, { childList: true, subtree: true });
        questPopupRoots.set(root, observer);
      }
      let style = root.querySelector('#gfx-quest-popup-mallang');
      if (enabled) {
        if (!style) { style = document.createElement('style'); style.id = 'gfx-quest-popup-mallang'; (root === document ? document.head : root).append(style); }
        const css = questPopupCss(); if (style.textContent !== css) style.textContent = css;
      } else style?.remove();
      for (const popup of root.querySelectorAll(QUEST_POPUPS)) popup.toggleAttribute('data-gfx-mallang', enabled);
    }
  }
  function paintQuestTheme() {
    paintQuestPopups();
    document.getElementById("gfx-quest-theme")?.remove();
    document.getElementById("gfx-quest-ui-switch")?.remove();
    document.querySelector("[data-gfx-quest-view]")?.remove();
    const panel = document.getElementById("gfq-01-panel");
    if (!panel || !current) { if (panel) { questUnskin(panel); panel.querySelector("[data-gfx-quest-theme]")?.remove(); } return; }
    const frame = panel.querySelector(".gfq-frame");
    if (!frame) { questUnskin(panel); return; }
    if (frame.style.display === "none") frame.style.display = "";
    const enabled = !!prefs.questViews[questWorldKey(panel)];
    const themes = frame.querySelector(".gfq-themes");
    if (themes && !themes.querySelector("[data-gfx-quest-theme]")) {
      const card = el("button", "gfq-theme"); card.type = "button"; card.setAttribute("data-gfx-quest-theme", "");
      const swatch = el("span", "gfq-theme-sw"); swatch.setAttribute("aria-hidden", "true");
      for (const color of [prefs.colors.ink, prefs.colors.accent, prefs.colors.pick]) { const square = el("i"); square.style.background = color; swatch.append(square); }
      card.append(swatch, el("b", "", "말랑"), el("small", "", "둥근 모험 수첩 · 같은 배치, 말랑 디자인"));
      on(card, "click", (ev) => { ev.stopPropagation(); questSelectView(panel, true); });
      themes.append(card);
    }
    const card = themes?.querySelector("[data-gfx-quest-theme]");
    if (card && card.getAttribute("aria-pressed") !== String(enabled)) card.setAttribute("aria-pressed", String(enabled));
    // Picking one of the quest extension's own themes turns the skin off for this world.
    if (!panel._gfxThemePick) {
      panel._gfxThemePick = true;
      // Its own watcher on the panel: a tab change re-renders it and writes the world's theme back, and this puts
      // the skin back in the same task, before the browser paints the original look.
      new MutationObserver(() => { if (!disposed && panel.isConnected) paintQuestTheme(); })
        .observe(panel, { childList: true, attributes: true, attributeFilter: ["data-theme"] });
      panel.addEventListener("click", (ev) => {
        if (current && ev.target.closest?.('[data-action="pick-theme"]') && prefs.questViews[questWorldKey(panel)]) questSelectView(panel, false);
      }, true);
    }
    if (!enabled) { questUnskin(panel); return; }
    let style = document.getElementById("gfx-quest-mallang");
    if (!style) { style = document.createElement("style"); style.id = "gfx-quest-mallang"; document.head.append(style); }
    const css = questSkinCss();
    if (style.textContent !== css) style.textContent = css;
    if (!panel.hasAttribute("data-gfx-mallang")) panel.setAttribute("data-gfx-mallang", "");
    // Each render writes the world's theme back: keep it aside and show the base layout.
    if (panel.dataset.theme && panel.dataset.theme !== "modern") { panel.dataset.gfxTheme = panel.dataset.theme; panel.dataset.theme = "modern"; }
    for (const b of panel.querySelectorAll('[data-action="pick-theme"][aria-pressed="true"]')) { b.setAttribute("aria-pressed", "false"); b.setAttribute("data-gfx-was-pressed", ""); }
  }

  function apply() {
    const h = host(), root = h?.shadowRoot;
    if (!root) return;
    const sheets = root.adoptedStyleSheets, base = styleSheet(), vars = paintVars();
    if (!sheets.includes(base) || !sheets.includes(vars)) {
      root.adoptedStyleSheets = [...sheets.filter((s) => s !== sheet && s !== varSheet), sheet, varSheet];
    }
    if (current) { if (h.getAttribute(ATTR) !== current) h.setAttribute(ATTR, current); }
    else if (h.hasAttribute(ATTR)) h.removeAttribute(ATTR);
    setFlag(h, "data-gfx-story-sd", current && prefs.opts.storySd);
    paintQuestTheme();
    setFlag(h, "data-gfx-box", current && prefs.opts.box);
    setFlag(h, "data-gfx-sticker", current && prefs.opts.sticker);
    setFlag(h, "data-gfx-motion", current && prefs.opts.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    setFlag(h, "data-gfx-field", current && prefs.opts.field);
    setFlag(h, "data-gfx-team", current && prefs.opts.team);
    setFlag(h, "data-gfx-lobby", current && prefs.opts.lobby);
    setFlag(h, "data-gfx-hideplate", current && prefs.opts.lobby && prefs.opts.hidePlate);
    setFlag(h, "data-gfx-attend", current && prefs.opts.attend);
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const MOCHI = '<svg class="gfx-mochi" viewBox="0 0 120 118" aria-hidden="true"><path class="stem" d="M60 30 Q57 16 66 10"/>'
    + '<path class="leaf" d="M66 10 Q78 0 88 8 Q78 18 66 10 Z"/><path class="body" d="M14 86 Q10 32 60 30 Q110 32 106 86 Q104 112 60 112 Q16 112 14 86 Z"/>'
    + '<ellipse class="eye" cx="44" cy="70" rx="5.5" ry="7.5"/><ellipse class="eye" cx="76" cy="70" rx="5.5" ry="7.5"/>'
    + '<circle class="shine" cx="46" cy="67" r="2"/><circle class="shine" cx="78" cy="67" r="2"/>'
    + '<ellipse class="blush" cx="32" cy="84" rx="8" ry="5"/><ellipse class="blush" cx="88" cy="84" rx="8" ry="5"/>'
    + '<path class="mouth" d="M53 82 Q60 89 67 82"/></svg>';
  function heroNode(url) {
    if (url) { const i = el("img"); i.alt = ""; i.draggable = false; setSprite(i, url, false); return i; }
    const s = el("span"); s.innerHTML = MOCHI; return s.firstChild;
  }

  /* ── Baked sprites ──
   * The white sticker outline used to be five stacked drop-shadow filters on every sprite, redrawn each frame
   * while the sprite moves — the cost behind a choppy lobby. Instead each SD is drawn once into a canvas with
   * the outline and a soft under-shadow at the source resolution and kept as a blob: URL. */
  const bakedMap = new Map(); // raw url -> { url, px, py } | "pending" | "failed"
  let bakeQueue = Promise.resolve();
  function bakeInfo(url) {
    const b = bakedMap.get(url);
    if (b === undefined) bake(url);
    return b && typeof b === "object" ? b : null;
  }
  function bake(url) {
    bakedMap.set(url, "pending");
    const job = () => bakeNow(url);
    bakeQueue = bakeQueue.then(job, job);
    return bakeQueue;
  }
  async function bakeNow(url) {
    try {
      const im = new Image();
      im.src = url;
      await im.decode();
      const sc = 1, W = im.naturalWidth, Hh = im.naturalHeight;
      const r = Math.max(2, Math.round(Hh * 0.004)), pad = r * 3;
      const cw = W + pad * 2, ch = Hh + pad * 2;
      const sil = document.createElement("canvas");
      sil.width = cw; sil.height = ch;
      const sx = sil.getContext("2d");
      sx.drawImage(im, pad, pad, W, Hh);
      const rawAlpha = sx.getImageData(0, 0, cw, ch);
      sx.globalCompositeOperation = "source-in";
      sx.fillStyle = "#fff";
      sx.fillRect(0, 0, cw, ch);
      const out = document.createElement("canvas");
      out.width = cw; out.height = ch;
      const ox = out.getContext("2d");
      // The under-shadow: the silhouette, tinted, a little lower.
      ox.save();
      ox.globalAlpha = 0.4;
      ox.filter = "brightness(0.35) sepia(1) saturate(2.2) hue-rotate(-20deg)";
      ox.drawImage(sil, 0, r * 2.2);
      ox.restore();
      for (let a = 0; a < 16; a++) ox.drawImage(sil, Math.cos((a / 16) * Math.PI * 2) * r, Math.sin((a / 16) * Math.PI * 2) * r);
      ox.drawImage(im, pad, pad, W, Hh);
      // Trim the empty margin, so the feet are the picture's bottom edge; keep how much of the drawn picture
      // the character fills (hf), so a small character stays small instead of being blown up to the box.
      // Measured on the raw art (the silhouette before its outline), counting only clearly drawn pixels and
      // only rows and columns with enough of them: generated art leaves faint specks (sparkles, dust) near the
      // edges, and those used to hold the trim at the very bottom, so small characters still floated.
      const sx0 = rawAlpha.data;
      const rowN = new Uint32Array(ch), colN = new Uint32Array(cw);
      for (let y = 0; y < ch; y++) {
        const row = y * cw * 4;
        for (let x = 0; x < cw; x++) if (sx0[row + x * 4 + 3] > 128) { rowN[y]++; colN[x]++; }
      }
      const minRow = Math.max(3, Math.round(W * 0.008)), minCol = Math.max(3, Math.round(Hh * 0.004));
      let y0 = 0, y1 = ch - 1, x0 = 0, x1 = cw - 1;
      while (y0 < ch - 1 && rowN[y0] < minRow) y0++;
      while (y1 > y0 && rowN[y1] < minRow) y1--;
      while (x0 < cw - 1 && colN[x0] < minCol) x0++;
      while (x1 > x0 && colN[x1] < minCol) x1--;
      // Room for the outline all round, and for the soft shadow under the feet.
      const m = Math.ceil(r * 1.5);
      x0 = Math.max(0, x0 - m); x1 = Math.min(cw - 1, x1 + m); y0 = Math.max(0, y0 - m); y1 = Math.min(ch - 1, y1 + Math.ceil(r * 3));
      const kw = x1 - x0 + 1, kh = y1 - y0 + 1;
      const crop = document.createElement("canvas");
      crop.width = kw; crop.height = kh;
      crop.getContext("2d").drawImage(out, -x0, -y0);
      const blob = await new Promise((res) => crop.toBlob(res, "image/png"));
      if (!blob) throw Error("no blob");
      // A point of the raw art (0–1) lands at (ox + x·mx, oy + y·my) of the baked one.
      const info = { url: URL.createObjectURL(blob), mx: W / kw, ox: (pad - x0) / kw, my: Hh / kh, oy: (pad - y0) / kh, hf: Math.min(1, kh / Hh) };
      bakedMap.set(url, info);
      // Every sprite already on screen with the raw art swaps to the baked one in place: no rebuild, no restart.
      for (const img of gameRoot()?.querySelectorAll("img[data-raw]") || []) if (img.dataset.raw === url) setSprite(img, url, img.style.scale === "-1 1");
    } catch {
      bakedMap.set(url, "failed");
    }
  }
  // Which character an SD picture belongs to (for its 키).
  function refreshSprites() {
    for (const img of gameRoot()?.querySelectorAll("img[data-raw]") || []) setSprite(img, img.dataset.raw, img.style.scale === "-1 1");
    for (const box of gameRoot()?.querySelectorAll(".gfx-lobby .who") || []) { const i = box.querySelector("img"); if (i) box.style.setProperty("--hf", i.style.getPropertyValue("--hf") || "1"); }
  }
  function nameOfUrl(url) {
    const w = world();
    if (!w || !url) return "";
    for (const [n, e] of Object.entries(w.sd)) {
      if (e && e.url === url) return n;
      if (Object.values(e?.variants || {}).some((v) => (typeof v === "string" ? v : v?.url) === url)) return n;
    }
    return "";
  }
  function setSprite(img, url, flip) {
    const b = url ? bakeInfo(url) : null;
    const src = b ? b.url : url;
    const was = img.getAttribute("src");
    if (was !== src && img._gfxNext !== src) {
      if (!was || !img.complete || !img.isConnected || !img.closest(".gfx-vn-cast")) { img._gfxNext = null; img.setAttribute("src", src); }
      else {
        // Keep showing the old picture until the new one has decoded, then swap in one frame.
        img._gfxNext = src;
        const pre = new Image(); pre.src = src;
        (pre.decode ? pre.decode() : Promise.resolve()).catch(() => {}).then(() => { if (img._gfxNext === src) { img._gfxNext = null; img.setAttribute("src", src); } });
      }
    }
    img.classList.toggle("baked", !!b);
    for (const k of ["mx", "ox", "my", "oy", "hf"]) { if (b) img.dataset[k] = String(b[k]); else delete img.dataset[k]; }
    // The character's own height: rules size sprites as a share of their box times --hf.
    const tall = Number(sdEntry(nameOfUrl(url)).tall) || 1;
    const hf = String(+(Math.min(1.15, Math.max(0.6, tall))).toFixed(3));
    if (img.style.getPropertyValue("--hf") !== hf) img.style.setProperty("--hf", hf);
    if (img.parentElement?.closest) { const box = img.closest(".gfx-lobby .who, .gfx-vn-cast .who"); if (box && box.style.getPropertyValue("--hf") !== hf) box.style.setProperty("--hf", hf); }
    if (img.dataset.raw !== url) img.dataset.raw = url;
    const scale = flip ? "-1 1" : "";
    if (img.style.scale !== scale) img.style.scale = scale;
  }
  // Which way the art faces (set per SD in its editor); a sprite is mirrored when it should face the other way.
  const faceOf = (name) => { const f = sdEntry(name).face; return f === "left" || f === "front" ? f : "right"; };
  const needFlip = (name, want) => { const f = faceOf(name); return f !== "front" && !!want && f !== want; };

  /* ── Story and battle sprites ── */
  function nameFromImg(img) {
    const w = world();
    if (!w || !img || !img.getAttribute("src")) return "";
    const path = pathOf(img.getAttribute("src"));
    const known = w.byPortrait.get(path);
    if (known) return known;
    const cast = host()?._beatCast;
    const actor = Array.isArray(cast) && cast.find((c) => c?.art && pathOf(c.art) === path);
    if (actor?.name) { w.byPortrait.set(path, actor.name); return actor.name; }
    return "";
  }
  function placeSd(container, url, flip = false) {
    let img = container.querySelector(":scope > img.gfx-sd");
    if (!url) { if (img) img.remove(); if (container.hasAttribute("data-gfx-sd")) container.removeAttribute("data-gfx-sd"); return; }
    if (!img) { img = el("img", "gfx-sd"); img.alt = ""; img.draggable = false; container.append(img); }
    setSprite(img, url, flip);
    if (!container.hasAttribute("data-gfx-sd")) container.setAttribute("data-gfx-sd", "");
  }
  let perfAt = 0;
  function perfStep(label) {
    if (!PERF) return;
    const now = performance.now(), p = window.__gfxPerf;
    if (label && perfAt) { const e = (p.parts ||= {})[label] ||= [0, 0, 0]; const dt = now - perfAt; e[0]++; e[1] += dt; e[2] = Math.max(e[2], dt); }
    perfAt = now;
  }
  function formatDialogue(root) {
    if (!current) return;
    for (const box of root.querySelectorAll(".vn-text")) {
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        const text = node.nodeValue;
        const tokens = text.split(/(<\/?(?:s|del|b|strong|i|em|u)>|<br\s*\/?>)/gi);
        if (tokens.length === 1) continue;
        const open = []; let valid = true;
        for (const token of tokens) {
          const tag = /^<(\/?)(s|del|b|strong|i|em|u|br)\s*\/?>$/i.exec(token);
          if (!tag || tag[2].toLowerCase() === "br") continue;
          const name = tag[2].toLowerCase();
          if (tag[1]) { if (open.pop() !== name) valid = false; }
          else open.push(name);
        }
        // Leave unfinished typewriter tags and malformed text alone.
        if (!valid || open.length) continue;
        const fragment = document.createDocumentFragment(), stack = [fragment];
        for (const token of tokens) {
          const tag = /^<(\/?)(s|del|b|strong|i|em|u|br)\s*\/?>$/i.exec(token);
          if (!tag) { if (token) stack.at(-1).append(document.createTextNode(token)); continue; }
          const name = tag[2].toLowerCase();
          if (tag[1]) {
            if (stack.length > 1 && stack.at(-1).localName === name) stack.pop();
            else stack.at(-1).append(document.createTextNode(token));
          } else {
            const element = document.createElement(name); stack.at(-1).append(element);
            if (name !== "br") stack.push(element);
          }
        }
        node.replaceWith(fragment);
      }
    }
  }
  function paintSprites(root) {
    formatDialogue(root);
    perfStep("");
    const on = !!current;
    const whoEl = root.querySelector(".vn-who");
    const who = whoEl && !whoEl.hasAttribute("data-narration") ? whoEl.textContent.replace(/\s*\(.*?\)\s*$/, "").trim() : "";
    const plates = Array.from(root.querySelectorAll(".vn-plate"));
    const snapshot = storySnapshot(root, whoEl && whoEl.hasAttribute("data-narration") ? "" : who);
    const replaced = new Set(snapshot.slots.map((s) => s.plate).filter(Boolean));
    // Only portraits represented by the reconciled current cast step aside. CG and closed slots stay untouched.
    for (const plate of plates) {
      const art = activePlateImage(plate);
      if (art?.naturalWidth && art.naturalHeight) plate.style.setProperty("--gfx-card-ratio", String(art.naturalWidth / art.naturalHeight));
      const has = on && prefs.opts.storySd && snapshot.mode !== "cg" && replaced.has(plate);
      plate.querySelector(":scope > img.gfx-sd")?.remove();
      if (has !== plate.hasAttribute("data-gfx-sd")) { if (has) plate.setAttribute("data-gfx-sd", ""); else plate.removeAttribute("data-gfx-sd"); }
    }
    paintVnCast(root, on && prefs.opts.storySd, whoEl && whoEl.hasAttribute("data-narration") ? "" : who, snapshot);
    perfStep("story");
    const field = on && prefs.opts.field;
    for (const card of root.querySelectorAll(".cbt")) {
      let url = "", name = "";
      if (on && (prefs.opts.battleSd || field)) {
        name = nameFromImg(card.querySelector(".ava-photo")) || (card.querySelector(".nm")?.textContent || "").trim();
        url = sdUrl(name, card.querySelector(".ava-photo")?.getAttribute("src") || "");
      }
      // Allies look toward the foes on the right, foes toward the left.
      if (url || card.hasAttribute("data-gfx-sd")) placeSd(card, url, url && needFlip(name, card.classList.contains("enemy") ? "left" : "right"));
      // On the field, a foe with no art of its own is a mochi monster in its element's colour.
      const foe = field && !url && card.classList.contains("enemy") && !card.querySelector(".ava-photo");
      placeFoe(card, foe ? card.getAttribute("data-aff") || "" : null);
    }
    for (const arena of root.querySelectorAll(".arena")) {
      const tiles = arena.querySelector(":scope > .gfx-tiles");
      if (field && !tiles) {
        const t = el("div", "gfx-tiles");
        for (let i = 0; i < 24; i++) t.append(el("i"));
        const shade = arena.querySelector(":scope > .cb-shade");
        if (shade) shade.after(t); else arena.prepend(t);
      } else if (!field && tiles) tiles.remove();
    }
    paintEnemyAffinity(root, field);
    perfStep("battle");
    paintScroll(root, on && prefs.opts.autoScroll);
    paintSummon(root, on && prefs.opts.motion);
    perfStep("scroll+summon");
    paintTeam(root, on && prefs.opts.team);
    perfStep("team");
    paintLobby(root, on && prefs.opts.lobby);
    perfStep("lobby");
    paintAttend(root, on && prefs.opts.attend);
    perfStep("attend");
    // World creation: the mascot in place of the emblem.
    for (const center of root.querySelectorAll(".forge-center")) {
      const has = center.querySelector(":scope > .gfx-forge-mascot");
      if (on && !has) { const m = el("div", "gfx-forge-mascot"); m.append(heroNode(pick(anySd()))); center.prepend(m); }
      else if (!on && has) has.remove();
    }
  }
  function paintEnemyAffinity(root, enabled) {
    for (const arena of root.querySelectorAll(".arena")) {
      let layer = arena.querySelector(":scope > .gfx-aff-layer");
      if (!enabled) { layer?.remove(); continue; }
      if (!layer) { layer = el("div", "gfx-aff-layer"); arena.append(layer); }
      const bounds = arena.getBoundingClientRect();
      if (!bounds.width || !bounds.height) continue;
      // Both sides: the element chip sits just right of the unit's HP bar.
      const cards = Array.from(arena.querySelectorAll(".side .cbt"));
      const barOf = (card) => card.querySelector(".bars .hp") || card.querySelector(".bars") || card;
      const key = cards.map((card) => { const r = barOf(card).getBoundingClientRect(); return [card.dataset.aff, r.right, r.top, r.height].join(":"); }).join("|");
      if (layer.dataset.key === key) continue;
      layer.dataset.key = key; layer.replaceChildren();
      for (const card of cards) {
        const badge = card.querySelector(".aff-badge"); if (!badge) continue;
        const r = barOf(card).getBoundingClientRect(), pill = el("div", "gfx-aff-label");
        const icon = badge.cloneNode(true); icon.removeAttribute("id");
        pill.append(icon); pill.setAttribute("aria-label", badge.getAttribute("title") || badge.textContent || card.dataset.aff || "속성");
        pill.style.left = ((r.right - bounds.left) / bounds.width * 100) + "%";
        pill.style.top = ((r.top + r.height / 2 - bounds.top) / bounds.height * 100) + "%";
        layer.append(pill);
      }
    }
  }
  const pick = (list) => (list.length ? list[Math.floor(Math.random() * list.length)] : "");

  /* ── Story lists open at the latest entry ──
   * Once per visit to the chapter list or a chapter's map, the list scrolls so the next thing to play (the
   * chapter with 계속, the node with 플레이) sits in the middle. A list the player has already scrolled is left
   * alone, and the game keeps that position across its own redraws. */
  let scrolledFor = "", scrolledBox = null, scrolledAt = 0;
  function paintScroll(root, enabled) {
    const h = host();
    const view = h && h._hudView;
    const spots = { chapters: [".sel-scroll", ".btn-go", ".btn-enter"], chapter: [".cap-scroll", "[data-play]", "[data-replay]"] };
    const spot = spots[view];
    if (!enabled || !spot) { if (!spot) scrolledFor = ""; return; }
    const key = view + ":" + (view === "chapter" ? String(h._planChapter ?? "") + ":" + (h._difficulty || "") : "");
    const box = root.querySelector(spot[0]);
    if (scrolledFor === key && (box === scrolledBox || !box || box.scrollTop > 8 || performance.now() - scrolledAt > 4000)) return;
    if (!box || box.scrollHeight <= box.clientHeight + 4) return;
    let target = root.querySelector(spot[1]);
    if (!target) { const all = root.querySelectorAll(spot[2]); target = all[all.length - 1]; }
    if (!target) return;
    if (scrolledFor !== key && box.scrollTop > 8) { scrolledFor = key; scrolledBox = box; return; }
    scrolledFor = key; scrolledBox = box; scrolledAt = performance.now();
    const row = target.closest(".node-row, .node, .ch, li, article") || target;
    const top = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 2 + row.getBoundingClientRect().height / 2), behavior: "smooth" });
  }

  /* ── Summon (Trickcal manner) ──
   * The game's reveal screen opens with its own charge (a ring and a flash) before the cards. Under 말랑 that
   * charge is a capsule instead: it drops in and bounces, wobbles twice, and bursts open in the colour of the
   * best card (5★ gold, 4★ violet, 3★ sky) with rays and confetti; then it clears and the cards show. A tap
   * anywhere skips straight to the cards. Played once per reveal screen. */
  const CAPSULE_TOP = { 5: "#FFC93C", 4: "#B48CF0", 3: "#7EC8F2" };
  // A recruitment letter: the flap carries the best card's colour, a heart wax seal holds it shut.
  const CAPSULE_SVG = (col) => '<svg viewBox="0 0 140 120" aria-hidden="true">'
    + '<g class="cap-bot"><rect x="10" y="40" width="120" height="70" rx="10" fill="#F4E2BC" stroke="#5A3A24" stroke-width="5" stroke-linejoin="round"/></g>'
    + '<g class="cap-open"><path d="M12 42 L63 -10 Q70 -16 77 -10 L128 42 Z" style="fill:' + col + '" stroke="#5A3A24" stroke-width="5" stroke-linejoin="round"/>'
    + '<path d="M30 36 L64 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/></g>'
    + '<g class="cap-letter"><rect x="24" y="46" width="92" height="58" rx="6" fill="#FFFDF5" stroke="#5A3A24" stroke-width="4"/>'
    + '<path d="M36 62 H104 M36 74 H96 M36 86 H84" stroke="#C9A97A" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M70 52 l3.2 6.4 7 .9 -5.1 4.9 1.3 7 -6.4-3.4 -6.4 3.4 1.3-7 -5.1-4.9 7-.9z" style="fill:' + col + '" stroke="#5A3A24" stroke-width="2"/></g>'
    + '<g class="cap-front"><path d="M10 50 L70 86 L130 50 V100 Q130 110 120 110 H20 Q10 110 10 100 Z" fill="#FFEFCF" stroke="#5A3A24" stroke-width="5" stroke-linejoin="round"/></g>'
    + '<g class="cap-top"><path d="M10 50 Q10 40 20 40 H120 Q130 40 130 50 L70 88 Z" style="fill:' + col + '" stroke="#5A3A24" stroke-width="5" stroke-linejoin="round"/>'
    + '<path d="M28 48 L70 74" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g>'
    + '<g class="cap-band"><circle cx="70" cy="80" r="12" fill="#E8546B" stroke="#5A3A24" stroke-width="4"/>'
    + '<path d="M70 86 c-6-4-8-7-8-10 a4 4 0 0 1 8-1 a4 4 0 0 1 8 1 c0 3-2 6-8 10z" fill="#FFD3DC"/></g></svg>';
  function paintSummon(root, enabled) {
    for (const screen of root.querySelectorAll('[data-screen="reveal"]')) {
      if (!enabled || screen.hasAttribute("data-gfx-summon")) continue;
      screen.setAttribute("data-gfx-summon", "");
      // Played only for a fresh reveal, not for one the game redraws when it is already showing the cards.
      if (screen.classList.contains("phase-done") && screen.querySelector(".rv-card.revealed")) continue;
      const best = Math.max(3, ...Array.from(screen.querySelectorAll(".rv-card")).map((c) => Number((c.className.match(/\br(\d)\b/) || [])[1]) || 3));
      const fx = el("div", "gfx-summon");
      fx.setAttribute("data-rarity", String(Math.min(5, best)));
      fx.style.setProperty("--cap", CAPSULE_TOP[Math.min(5, best)] || CAPSULE_TOP[3]);
      const ball = el("div", "gfx-cap");
      ball.innerHTML = CAPSULE_SVG(CAPSULE_TOP[Math.min(5, best)] || CAPSULE_TOP[3]);
      const rays = el("div", "gfx-cap-rays");
      const confetti = el("div", "gfx-cap-confetti");
      for (let i = 0; i < 18; i++) {
        const c = el("i");
        c.style.setProperty("--a", (i * 20 + Math.random() * 12).toFixed(0) + "deg");
        c.style.setProperty("--d", (38 + Math.random() * 22).toFixed(0) + "cqmin");
        c.style.setProperty("--c", ["#FF8FB1", "#FFD34E", "#7FD39A", "#6FB2F2", "#B48CF0", "var(--cap)"][i % 6]);
        confetti.append(c);
      }
      const label = el("div", "gfx-cap-label", best >= 5 ? "★★★★★!!" : best >= 4 ? "★★★★!" : "뿅!");
      fx.append(rays, ball, confetti, label);
      let ended = false;
      const end = () => { if (ended) return; ended = true; fx.setAttribute("data-out", ""); setTimeout(() => fx.remove(), 320); };
      // A tap also reaches the game, which skips its charge and turns the cards: both move on together.
      on(fx, "click", () => end());
      screen.append(fx);
      // Cards fly in from the middle of the screen: each gets its offset from there and its turn in the deal.
      const box = screen.getBoundingClientRect();
      screen.querySelectorAll(".rv-card").forEach((card, i) => {
        const b = card.getBoundingClientRect();
        card.style.setProperty("--i", String(i));
        card.style.setProperty("--dx", (box.left + box.width / 2 - (b.left + b.width / 2)).toFixed(0) + "px");
        card.style.setProperty("--dy", (box.top + box.height / 2 - (b.top + b.height / 2)).toFixed(0) + "px");
      });
      // Out just before the game's cards start turning (its reveal begins at ~1.56s).
      setTimeout(end, 1480);
      watchSpotlight(screen);
    }
  }
  /* Each 5★ card, as it turns, gets the screen to itself for a moment: its portrait over golden rays with its
   * name and stars. A tap (or 3.2s) goes back to the cards. One spotlight at a time, in turning order. */
  function watchSpotlight(screen) {
    const shown = new Set(), queue = [];
    let open = null;
    const next = () => { if (!open && queue.length) show(queue.shift()); };
    const show = (card) => {
      const img = card.querySelector(".rv-front img");
      if (!img) return next();
      const spot = el("div", "gfx-spot");
      open = spot;
      const pic = el("img");
      pic.src = img.getAttribute("src"); pic.alt = ""; pic.draggable = false;
      const who = el("div", "who");
      who.append(el("b", "", (card.querySelector(".u-name")?.textContent || "").trim()), el("i", "", "★★★★★"));
      spot.append(pic, who, el("span", "tap", "탭해서 계속"));
      const close = () => {
        if (open !== spot) return;
        open = null;
        spot.setAttribute("data-out", "");
        setTimeout(() => spot.remove(), 300);
        setTimeout(next, 320);
      };
      on(spot, "click", (e) => { e.stopPropagation(); close(); });
      screen.append(spot);
      setTimeout(close, 3200);
    };
    const tick = setInterval(() => {
      if (disposed || !screen.isConnected) { clearInterval(tick); return; }
      for (const card of screen.querySelectorAll(".rv-card.r5.revealed")) {
        const id = card.getAttribute("data-i");
        if (shown.has(id)) continue;
        shown.add(id);
        queue.push(card);
      }
      next();
    }, 90);
  }

  /* ── Story cast line-up (Trickcal manner) ──
   * The current open portrait slots are authoritative. Closed slots leave immediately, unknown full-frame art
   * is treated as CG, and characters without an SD use a contained portrait card in the same stage. */
  const MAX_STORY_CAST = 3;
  // How many stand on the stage at once: a setting (2–5), 3 by default.
  const castMax = () => prefs.storyCast || MAX_STORY_CAST;
  const vnCast = { renderedKey: "" };
  const CAST_X = { 1: [50], 2: [30, 70], 3: [19, 50, 81], 4: [14, 38, 62, 86], 5: [11, 30.5, 50, 69.5, 89] };
  // The protagonist always takes the left-most place, as the player's side of the stage.
  function protagonistName() {
    const w = world(), h = host();
    return (h?._run?.protagonist?.name || w?.cards.find((c) => c.isProtagonist)?.name || "").trim();
  }
  function activePlateImage(plate) {
    const front = plate.getAttribute("data-front") || "a";
    return plate.querySelector('.vn-art[data-art="' + front + '"] > img') || plate.querySelector(".vn-art img, img");
  }
  function visibleChoice(vn) {
    return Array.from(vn.querySelectorAll(".gch-menu, .vn-choices, .vn-choice, [data-choice], .choices"))
      .some((n) => !n.hidden && !n.closest("[hidden]") && n.getClientRects().length > 0
        && getComputedStyle(n).display !== "none" && (n.matches("button, [data-choice]") || n.querySelector("button, [role=button], .vn-choice")));
  }
  // Rebuild presence from the current scene, not from the entire world's cast.
  function storyCastAt(segments, at, cast, max = MAX_STORY_CAST) {
    const normalize = (s) => String(s || "").normalize("NFC").trim().toLocaleLowerCase();
    const find = (s) => {
      const key = normalize(s);
      if (!key) return null;
      const exact = cast.find((c) => normalize(c.name) === key);
      if (exact) return exact;
      if (["you", "player", "protagonist", "나", "주인공"].includes(key)) return cast.find((c) => c.prota) || null;
      const partial = cast.filter((c) => normalize(c.name).split(/\s+/).includes(key));
      return partial.length === 1 ? partial[0] : null;
    };
    // Everyone keeps the place they took on entering: speaking marks them recent but does not reorder the stage
    // (moving each speaker to the end swapped two characters on every line). Past the stage's limit the one who
    // has been quiet longest steps off.
    const present = new Map(), spoke = new Map();
    let place = "";
    for (let i = 0; i <= Math.min(at, segments.length - 1); i++) {
      const segment = segments[i] || {};
      if (segment.place && segment.place !== place) { present.clear(); spoke.clear(); place = segment.place; }
      const text = String(segment.text || "");
      if (!segment.speaker) for (const actor of cast) {
        const start = text.indexOf(actor.name);
        if (start < 0) continue;
        const action = text.slice(start + actor.name.length, start + actor.name.length + 65).split(/[.!?。\n]/)[0];
        if (/(?:퇴장했|퇴장한|나갔|떠났|자리를 떠|사라졌|밖으로 나|물러났|walked away|left the room|exited|departed)/i.test(action)) present.delete(actor.name);
        else if (/(?:들어왔|들어섰|다가왔|나타났|합류했|entered|arrived|joined)/i.test(action)) { if (!present.has(actor.name)) present.set(actor.name, actor); spoke.set(actor.name, i); }
      }
      const actor = find(segment.speaker);
      if (actor) { if (!present.has(actor.name)) present.set(actor.name, actor); spoke.set(actor.name, i); }
    }
    const all = Array.from(present.values());
    if (all.length <= max) return all;
    const keep = new Set(all.slice().sort((a, b) => (spoke.get(b.name) ?? -1) - (spoke.get(a.name) ?? -1)).slice(0, max).map((c) => c.name));
    return all.filter((c) => keep.has(c.name));
  }
  function storySnapshot(root, speaker) {
    const vn = root.querySelector(".vn");
    if (!vn) return { mode: "none", sceneKey: "", slots: [] };
    const choiceActive = visibleChoice(vn);
    const open = Array.from(vn.querySelectorAll('.vn-plate[data-open="true"]'));
    const vr = vn.getBoundingClientRect();
    const largeUnknownArt = open.some((plate) => {
      const image = activePlateImage(plate), pr = plate.getBoundingClientRect();
      return image && !nameFromImg(image) && vr.width > 0 && vr.height > 0 && pr.width > vr.width * 0.55 && pr.height > vr.height * 0.55;
    });
    const cgActive = vn.hasAttribute("data-cg") || largeUnknownArt || !!vn.querySelector('.vn-cg:not([hidden]), .vn-illustration:not([hidden]), .scene-cg:not([hidden]), [data-illustration]:not([hidden]), .vn-art-full:not([hidden])');
    const mode = choiceActive ? "choice" : cgActive ? "cg" : "dialogue";
    const slots = [];
    const h = host(), cast = Array.isArray(h?._beatCast) ? h._beatCast : [];
    { const w = world(); if (w && w.state === "ready" && addExtras(w, cast)) setTimeout(() => paintSettings(), 0); }
    const segments = Array.isArray(h?._beat) ? h._beat : [];
    if (mode !== "cg" && segments.length && cast.length) {
      const count = (vn.querySelector(".vn-count")?.textContent || "").match(/\d+/);
      const at = Math.max(0, Number(count?.[0] || 1) - 1);
      const actors = storyCastAt(segments, at, cast, castMax());
      // A reply branch may use a different speaker than its parent beat.
      const speaking = cast.find((c) => c.name === speaker);
      if (speaking && !actors.some((c) => c.name === speaking.name)) actors.push(speaking);
      for (const actor of actors.slice(-castMax())) {
        const portrait = actor.art || world()?.cards.find((c) => c.name === actor.name)?.portrait || "";
        if (portrait) world()?.byPortrait.set(pathOf(portrait), actor.name);
        slots.push({ id: actor.name, name: actor.name, portrait, plate: open.find((p) => nameFromImg(activePlateImage(p)) === actor.name) || null });
      }
    } else if (mode !== "cg") {
      for (const [i, plate] of open.entries()) {
        const image = activePlateImage(plate);
        const portrait = image?.getAttribute("src") || "";
        const exact = nameFromImg(image);
        const name = exact || (open.length === 1 ? speaker : "");
        if (!name || slots.some((s) => s.name === name)) continue;
        const w = world(), base = w?.cards.find((c) => c.name === name)?.portrait || "";
        if (w && portrait && pathOf(portrait) !== pathOf(base)) {
          if (!w.outfits.has(name)) w.outfits.set(name, new Set());
          w.outfits.get(name).add(pathOf(portrait));
        }
        slots.push({ id: plate.getAttribute("data-side") || String(i), name, portrait, plate });
      }
    }
    const bgImage = root.querySelector(".vn-scene .vn-bg[data-on] img, .vn-scene img, .vn-bg img, .vn-back img, [data-background] img");
    const bgBox = root.querySelector(".vn-scene .vn-bg[data-on], .vn-scene .vn-bg, .vn-bg, .vn-back, [data-background]");
    const bg = bgImage?.getAttribute("src") || bgBox?.style.backgroundImage || (bgBox ? getComputedStyle(bgBox).backgroundImage : "") || "";
    const caption = (root.querySelector(".vn-caption")?.textContent || "").trim();
    const place = segments[Number(h?._beatAt) || 0]?.place || "";
    return { mode, sceneKey: caption + "|" + place + "|" + bg, place: place || caption.split(/\s*·\s*/)[0] || "", slots: slots.slice(-castMax()) };
  }
  /* The line-up stands by each character's real width, not on even fifths of the stage: a small gap between
   * neighbours, the group centred, and a slight overlap when the stage is full. Run after the sprites know
   * their size (once per frame for the whole layer). */
  const castLayoutQueued = new WeakSet();
  function layoutCast(layer) {
    if (castLayoutQueued.has(layer)) return;
    castLayoutQueued.add(layer);
    requestAnimationFrame(() => {
      castLayoutQueued.delete(layer);
      const W = layer.clientWidth;
      const nodes = Array.from(layer.querySelectorAll(":scope > .who:not([data-leaving])")).sort((a, b) => (Number(a.dataset.i) || 0) - (Number(b.dataset.i) || 0));
      if (!W || !nodes.length) return;
      const widths = nodes.map((n) => n.offsetWidth * (Number(getComputedStyle(n).getPropertyValue("--hf")) || 1) * 0.86 / W * 100);
      if (widths.some((w) => !w)) return;
      // Count everyone except the protagonist, including those standing beside them.
      const groupOf = (n) => n.dataset.group || "b";
      const otherCount = nodes.filter((n) => !("protagonist" in n.dataset)).length;
      const rightCount = nodes.filter((n) => groupOf(n) === "b").length;
      const total = widths.reduce((a, b) => a + b, 0);
      const joins = nodes.slice(1).map((n, i) => groupOf(n) === groupOf(nodes[i]) ? "in" : "between");
      const pairW = joins.map((_, i) => Math.min(widths[i], widths[i + 1]));
      // Two others overlap 22%, three 34%, four 46%; allies close in at the same rate.
      const ratio = Math.min(0.70, 0.22 + 0.12 * Math.max(0, otherCount - 2)), apart = 11;
      const span = () => total + joins.reduce((s, j, i) => s + (j === "in" ? -pairW[i] * ratio : apart), 0);
      const groupSpan = (group) => widths.reduce((s, w, i) => s + (groupOf(nodes[i]) === group ? w - (joins[i] === "in" ? pairW[i] * ratio : 0) : 0), 0);
      // The size stays; whatever still does not fit simply runs a little past the edges.
      const fit = 1;
      let x = 50 - span() * fit / 2;
      // Mirror the centres of the two visible groups, accounting for the allies' combined width.
      if (rightCount && rightCount < nodes.length) x -= (groupSpan("a") - groupSpan("b")) / 4;
      nodes.forEach((n, i) => {
        const center = x + widths[i] * fit / 2 + (groupOf(n) === "b" ? Math.min(14, Math.max(0, rightCount - 1) * 3.5) : 0);
        x += (widths[i] + (i < joins.length ? (joins[i] === "in" ? -pairW[i] * ratio : apart) : 0)) * fit;
        n.style.setProperty("--cast-fit", fit.toFixed(3));
        n.dataset.x = center.toFixed(2);
        // A newcomer appears where it belongs; only those already standing glide over.
        if (!n.dataset.placed) { n.dataset.placed = "1"; n.style.transition = "none"; requestAnimationFrame(() => { n.style.transition = ""; }); }
        clampCastPosition(layer, n);
      });
    });
  }
  function clampCastPosition(layer, node) {
    if (!layer.clientWidth || !node.offsetWidth) return;
    const wanted = Number(node.dataset.x) || 50;
    const scale = Number(getComputedStyle(node).getPropertyValue("--hf")) || 1;
    const fit = Number(node.style.getPropertyValue("--cast-fit")) || 1;
    const half = Math.min(45, (node.offsetWidth * scale * fit / layer.clientWidth) * 50 + 1);
    const pokeOut = node.dataset.group === "b" ? half * 0.45 : 0;
    node.style.left = clamp(wanted, half, 100 - half + pokeOut).toFixed(2) + "%";
  }
  function paintVnCast(root, enabled, speaker, snapshot = storySnapshot(root, speaker)) {
    const vn = root.querySelector(".vn");
    // The whole scene, not the strip above the box: the cast stands behind the dialogue box (the dock is above
    // it in the stacking order), so their legs pass behind it the way Trickcal stages its characters.
    const stage = vn;
    let layer = stage && stage.querySelector(":scope > .gfx-vn-cast");
    if (!vn || !enabled || snapshot.mode === "cg" || !snapshot.slots.length) {
      layer?.remove();
      vnCast.renderedKey = "";
      return;
    }
    if (!layer) {
      layer = el("div", "gfx-vn-cast");
      stage.prepend(layer);
    }
    const prota = protagonistName();
    // Left to right: the protagonist, those set to stand by them (주인공 옆), then everyone else.
    const rank = (n) => (n === prota ? 0 : sdEntry(n).ally ? 1 : 2);
    const slots = snapshot.slots.slice().sort((a, b) => rank(a.name) - rank(b.name));
    if (layer.getAttribute("data-scene") !== snapshot.sceneKey) {
      // A new place (or scene): the cast that was there steps out under a soft wipe naming where we are now,
      // instead of vanishing in one frame.
      if (layer.childElementCount && layer.hasAttribute("data-scene") && prefs.opts.motion) {
        const ghost = layer.cloneNode(true);
        ghost.classList.add("gfx-vn-cast-out");
        ghost.removeAttribute("data-key");
        layer.after(ghost);
        setTimeout(() => ghost.remove(), 520);
        const place = String(snapshot.place || "").trim();
        const wipe = el("div", "gfx-scene-wipe");
        if (place) wipe.append(el("span", "", place));
        stage.append(wipe);
        setTimeout(() => wipe.remove(), 1500);
      }
      layer.replaceChildren();
      layer.setAttribute("data-scene", snapshot.sceneKey);
    }
    const key = snapshot.sceneKey + "|" + speaker + "|" + slots.map((s) => [s.id, s.name, s.portrait, sdUrl(s.name, s.portrait), sdEntry(s.name).tall || 1, sdEntry(s.name).ally ? 1 : 0, faceOf(s.name)].join("~")).join(";");
    if (layer.getAttribute("data-key") === key) return;
    layer.setAttribute("data-key", key);
    vnCast.renderedKey = key;
    const xs = CAST_X[slots.length] || [];
    layer.setAttribute("data-n", String(slots.length));
    const ids = new Set(slots.map((s) => s.id));
    // One who leaves fades where they stood while the others glide over, instead of the line-up jumping.
    for (const n of layer.querySelectorAll(":scope > .who:not([data-leaving])")) {
      if (ids.has(n.getAttribute("data-slot"))) continue;
      n.setAttribute("data-leaving", "");
      setTimeout(() => n.remove(), 380);
    }
    slots.forEach((slot, i) => {
      const name = slot.name;
      let n = Array.from(layer.children).find((x) => x.getAttribute("data-slot") === slot.id && !x.hasAttribute("data-leaving"));
      if (!n) {
        n = el("div", "who");
        // Set the inherited body scale before mounting, including uncached/raw sprites.
        n.style.setProperty("--hf", sdUrl(name, slot.portrait) ? String(+Math.min(1.15, Math.max(0.6, Number(sdEntry(name).tall) || 1)).toFixed(3)) : "1");
        // Pushed out: the newcomer steps in as the one leaving fades, not on top of them in the same frame.
        if (layer.querySelector(":scope > .who[data-leaving]")) n.style.animationDelay = "180ms";
        // Never left hidden: if the line-up could not measure it (stage hidden), it shows where it is.
        setTimeout(() => { if (!n.dataset.placed) { n.dataset.placed = "1"; layoutCast(layer); } }, 700);
        n.setAttribute("data-slot", slot.id);
        n.setAttribute("data-name", name);
        const body = el("div", "body"), img = el("img");
        img.alt = name;
        img.draggable = false;
        body.style.animationDelay = (-(performance.now() / 1000) % 3.4).toFixed(2) + "s";
        body.append(img);
        n.append(body);
        layer.append(n);
      }
      n.setAttribute("data-name", name);
      n.dataset.i = String(i);
      n.dataset.group = rank(name) < 2 ? "a" : "b";
      n.toggleAttribute("data-protagonist", name === prota);
      // Where they stand comes from layoutCast; a newcomer starts at its even share until its size is known.
      if (!n.style.left) { n.dataset.x = String(xs[i]); n.style.left = xs[i] + "%"; }
      const im = n.querySelector("img");
      const sd = sdUrl(name, slot.portrait);
      let placeholder = n.querySelector(".gfx-vn-placeholder");
      if (!sd && !slot.portrait) {
        im.hidden = true;
        if (!placeholder) {
          placeholder = el("div", "gfx-vn-placeholder");
          placeholder.append(heroNode(""), el("span", "", name));
          n.querySelector(".body").append(placeholder);
        }
      } else { im.hidden = false; placeholder?.remove(); }
      im.classList.toggle("portrait", !sd);
      // Facing follows the side of the stage, but only turns when the character crosses to the other side:
      // stepping in from the middle keeps the way they already look (a sudden mirror read as a jump).
      const face = n.dataset.group === "a" ? "right" : "left";
      n.dataset.face = face;
      if (sd) setSprite(im, sd, needFlip(name, face));
      else {
        if (im.getAttribute("src") !== slot.portrait) im.src = slot.portrait;
        im.style.scale = "";
        n.style.setProperty("--hf", "1");
      }
      const fit = () => {
        if (im.naturalWidth && im.naturalHeight) n.style.aspectRatio = String(im.classList.contains("portrait") ? im.naturalWidth / im.naturalHeight : Math.min(1.1, im.naturalWidth / im.naturalHeight));
        layoutCast(layer);
      };
      // onload, not a one-off listener: a sprite swapped in later (after its picture decoded) refits too.
      im.onload = fit;
      if (im.complete) fit();
      const speaking = name === speaker;
      if (speaking !== n.hasAttribute("data-speaking")) {
        if (speaking) { n.setAttribute("data-speaking", ""); n.removeAttribute("data-hop"); void n.offsetWidth; n.setAttribute("data-hop", ""); }
        else n.removeAttribute("data-speaking");
      }
    });
  }

  /* ── Mochi foes ── */
  // Mushroom foes, the cap in the element's colour (the Trickcal field's little monsters).
  const AFF_FILL = { fire: "#F2884B", water: "#6FB2F2", wind: "#7FD39A", earth: "#D9A04E", light: "#F7CF4A", dark: "#A07FE0" };
  function foeSvg(aff) {
    const cap = AFF_FILL[aff] || "#F2884B";
    return '<svg class="gfx-mochi" viewBox="0 0 120 120" aria-hidden="true">'
      + '<path class="body" d="M30 70 Q28 112 60 112 Q92 112 90 70 Z"/>'
      + '<path class="body" style="fill:' + cap + '" d="M8 70 Q8 18 60 16 Q112 18 112 70 Q60 82 8 70 Z"/>'
      + '<ellipse class="shine" cx="38" cy="38" rx="9" ry="6" style="opacity:.7"/><ellipse class="shine" cx="80" cy="34" rx="6" ry="4.5" style="opacity:.7"/>'
      + '<ellipse class="shine" cx="62" cy="52" rx="5" ry="3.5" style="opacity:.55"/>'
      + '<ellipse class="eye" cx="48" cy="88" rx="4.5" ry="6"/><ellipse class="eye" cx="72" cy="88" rx="4.5" ry="6"/>'
      + '<circle class="shine" cx="49.5" cy="86" r="1.6"/><circle class="shine" cx="73.5" cy="86" r="1.6"/>'
      + '<ellipse class="blush" cx="38" cy="98" rx="6" ry="3.5"/><ellipse class="blush" cx="82" cy="98" rx="6" ry="3.5"/>'
      + '<path class="mouth" d="M55 99 Q60 103 65 99"/></svg>';
  }
  function placeFoe(card, aff) {
    let n = card.querySelector(":scope > .gfx-foe");
    if (aff === null) { if (n) n.remove(); if (card.hasAttribute("data-gfx-foe")) card.removeAttribute("data-gfx-foe"); return; }
    if (!n || n.getAttribute("data-aff") !== aff) {
      n?.remove();
      n = el("span", "gfx-foe");
      n.setAttribute("data-aff", aff);
      n.innerHTML = foeSvg(aff);
      card.append(n);
    }
    if (!card.hasAttribute("data-gfx-foe")) card.setAttribute("data-gfx-foe", "");
  }

  /* ── Team: formation slots and the briefing before a battle ── */
  function paintTeam(root, enabled) {
    for (const slot of root.querySelectorAll(".slot")) {
      const art = slot.querySelector(".slot-art img"), name = nameFromImg(art);
      const url = enabled && slot.classList.contains("filled") ? sdUrl(name, art?.getAttribute("src") || "") : "";
      if (url || slot.hasAttribute("data-gfx-sd")) placeSd(slot, url);
    }
    // The result screen after a win: the team that fought, jumping for joy.
    for (const verdict of root.querySelectorAll('[data-screen="result"] .rs-verdict')) {
      const screen = verdict.parentElement;
      let row = screen.querySelector(":scope > .gfx-team");
      const won = !verdict.closest(".root.lose");
      const names = [protagonistName(), ...Array.from(screen.querySelectorAll(".rs-b-row .nm"), (n) => n.textContent.trim())];
      const members = enabled && won ? [...new Set(names.filter(Boolean))].map((name) => ({ name, url: sdUrl(name) })).filter((x) => x.url) : [];
      const key = members.map((x) => x.url).join("|");
      if (row && row.getAttribute("data-key") === key) continue;
      row?.remove();
      if (!members.length) continue;
      row = el("div", "gfx-team win");
      row.setAttribute("data-key", key);
      // Sizes on the elements themselves: the game redraws this screen and moves pieces around, and an SD that
      // ended up outside the sheet's reach was drawn at its full picture size across the whole screen.
      members.forEach((member, i) => { const sp = el("span"), im = el("img"); sp.style.setProperty("height", "auto", "important"); im.style.setProperty("height", "clamp(70px, 19vh, 210px)", "important"); im.style.setProperty("width", "auto", "important"); setSprite(im, member.url, false); im.style.setProperty("--hf", String(Number(sdEntry(member.name).tall) || 1)); im.alt = ""; sp.style.animationDelay = (-i * 0.18).toFixed(2) + "s"; sp.append(im); row.append(sp); });
      verdict.after(row);
    }
    for (const brief of root.querySelectorAll(".briefing")) {
      let row = brief.querySelector(":scope > .gfx-team");
      if (!enabled) { row?.remove(); continue; }
      const team = Array.from(root.querySelectorAll(".side.allies .cbt")).map((c) => {
        const img = c.querySelector(".ava-photo");
        const name = nameFromImg(img) || (c.querySelector(".nm")?.textContent || "").trim();
        const portrait = img?.getAttribute("src") || "";
        return { name, url: sdUrl(name, portrait), portrait };
      }).filter((t) => t.url || t.portrait);
      const key = team.map((t) => t.url || t.portrait).join("|");
      if (row && row.getAttribute("data-key") === key) continue;
      row?.remove();
      if (!team.length) continue;
      row = el("div", "gfx-team");
      row.setAttribute("data-key", key);
      for (const t of team) {
        const s = el("span"), i = el("img", t.url ? "" : "portrait");
        if (t.url) { setSprite(i, t.url, false); i.style.setProperty("--hf", String(Number(sdEntry(t.name).tall) || 1)); }
        else i.src = t.portrait;
        i.alt = "";
        s.append(i);
        row.append(s);
      }
      const start = brief.querySelector(".fstart");
      if (start) start.before(row); else brief.append(row);
    }
  }

  /* ── Lines and cheeks, kept per character with its SD entry ──
   * sd[name] = { url, at, lines: [3], pinch: "", cheeks: [{x, y}] (0–1 of the image), cheekR (share of its width) } */
  const PINCH_LINES = ["아야야!", "볼 늘리지 마~!", "으에에…", "말랑하다고 막 당기기야?!"];
  const sdEntry = (name) => { const w = world(); return (w && name && w.sd[name]) || {}; };
  const linesFor = (name) => { const l = sdEntry(name).lines; return Array.isArray(l) && l.filter(Boolean).length ? l.filter(Boolean) : LOBBY_LINES; };
  const pinchFor = (name) => sdEntry(name).pinch || pick(PINCH_LINES);
  const lookOf = (name, look) => (look ? sdVariant(sdEntry(name), look) || {} : sdEntry(name));
  const cheeksOf = (name, look = "") => {
    const c = lookOf(name, look).cheeks;
    return Array.isArray(c) && c.length ? c : null;
  };
  const cheekR = (name, look = "") => { const r = Number(lookOf(name, look).cheekR); return r > 0 ? r : 0.04; };
  // Edits for one look of a character: the base entry, or that outfit inside variants.
  function saveLook(name, look, patch) {
    if (!look) return saveSdEntry(name, patch);
    const e = sdEntry(name);
    return saveSdEntry(name, { variants: { ...(e.variants || {}), [look]: { ...(sdVariant(e, look) || {}), ...patch } } });
  }
  async function saveSdEntry(name, patch) {
    const w = world();
    if (!w) return;
    w.sd = { ...w.sd, [name]: { ...(w.sd[name] || {}), ...patch, _editedAt: Date.now(), _deleted: false } };
    if (!(await storePatch({ ["sd:" + w.id]: w.sd }))) w.note = "이 브라우저에 보관했습니다. 서버 기록은 다시 시도합니다 (" + lastStoreError + ").";
  }
  function talk(who, text, ms = 2400) {
    who.querySelector(":scope > .say")?.remove();
    const say = el("span", "say", text);
    who.setAttribute("data-talk", "");
    who.append(say);
    setTimeout(() => { say.remove(); if (!who.querySelector(":scope > .say")) who.removeAttribute("data-talk"); }, ms);
  }

  /* ── Cheek pinch ──
   * Pressing near a cheek point swaps the sprite for a canvas copy whose cheek follows the pointer, the skin
   * round it stretching smoothly after it (see render). Letting go springs it back with a wobble. */
  function mirroredIn(node, stop) {
    let m = false;
    for (let n = node; n && n !== stop; n = n.parentElement) { const t = getComputedStyle(n).transform; if (t && t.startsWith("matrix(-")) m = !m; }
    return m;
  }
  const PINCH_RETURN_MS = 420, PINCH_FOLLOW = 0.24;
  const pinchCleanups = new Set();
  function startPinch(img, e, cheeks, rFrac, stop, done, allowFree = true) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    // No cheek set for this SD: any press in the top part (the head of a chibi) pinches right where it lands.
    if (!cheeks || !cheeks.length) {
      if (!allowFree) return false;
      const b0 = img.getBoundingClientRect();
      const fy = (e.clientY - b0.top) / b0.height;
      if (!b0.height || fy < 0.08 || fy > 0.55) return false;
      cheeks = [{ x: 0.5, y: fy, free: true }];
      rFrac = Math.max(rFrac, 0.04);
      img.dataset.freePinch = "1";
    } else delete img.dataset.freePinch;
    const mx = Number(img.dataset.mx), my = Number(img.dataset.my), ox = Number(img.dataset.ox) || 0, oy = Number(img.dataset.oy) || 0;
    if (mx && my && !cheeks[0].free) { cheeks = cheeks.map((c) => ({ x: ox + c.x * mx, y: oy + c.y * my })); rFrac *= mx; }
    const box = img.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    const mirrored = mirroredIn(img, stop);
    const lx = mirrored ? box.right - e.clientX : e.clientX - box.left, ly = e.clientY - box.top;
    const rPx = rFrac * box.width;
    let best = null, bestD = Infinity;
    for (const c of cheeks) { const d = c.free ? 0 : Math.hypot(c.x * box.width - lx, c.y * box.height - ly); if (d < bestD) { bestD = d; best = c; } }
    if (!best || bestD > rPx * 1.6) return false;
    if (best.free) best = { x: lx / box.width, y: ly / box.height };
    const w = img.offsetWidth, h = img.offsetHeight, sc = box.width / w;
    // Preserve the exact source resolution while pulling, including enlarged lobby SDs.
    const cw = img.naturalWidth, ch = img.naturalHeight, dpr = cw / w;
    const canvas = el("canvas", "gfx-pinch");
    canvas.width = cw; canvas.height = ch;
    canvas.style.cssText = "position:absolute;left:" + img.offsetLeft + "px;top:" + img.offsetTop + "px;width:" + w + "px;height:" + h + "px;pointer-events:none;filter:" + getComputedStyle(img).filter;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let src;
    try { ctx.drawImage(img, 0, 0, cw, ch); src = ctx.getImageData(0, 0, cw, ch); } catch { return false; }
    const out = ctx.createImageData(cw, ch);
    out.data.set(src.data);
    // The skin moves with the finger: a point q of the original art goes to q + d·g(|q − c|), g a gaussian
    // round the cheek. Each output pixel p finds the q that lands on it (q = p − d·g(|q − c|), a few fixed-point
    // steps; it converges while |d| stays under ~1.6σ, so the pull is soft-limited there) and is read with
    // bilinear filtering. Far from the cheek g is ~0 and the face stays exactly as drawn.
    // The gaussian is an ellipse turned along the pull: long that way (the stretch), narrow across it, so an
    // eye or mouth beside the cheek barely moves.
    const cx = best.x * cw, cy = best.y * ch, R = rFrac * cw, sig = R * 1.65, sigQ = R * 1.15, maxLen = sig * 1.2;
    const invP = 1 / (2 * sig * sig), invQ = 1 / (2 * sigQ * sigQ);
    const s = src.data, o = out.data;
    const reach = Math.ceil(sig * 3 + maxLen + R * 1.4);
    const dirtyX = Math.max(0, Math.floor(cx - reach)), dirtyY = Math.max(0, Math.floor(cy - reach));
    const dirtyW = Math.min(cw - dirtyX, Math.ceil(cx + reach) - dirtyX);
    const dirtyH = Math.min(ch - dirtyY, Math.ceil(cy + reach) - dirtyY);
    function sample(qx, qy, oi) {
      const x0 = Math.floor(qx), y0 = Math.floor(qy), fx = qx - x0, fy = qy - y0;
      const xa = Math.min(cw - 1, Math.max(0, x0)), xb = Math.min(cw - 1, Math.max(0, x0 + 1));
      const ya = Math.min(ch - 1, Math.max(0, y0)), yb = Math.min(ch - 1, Math.max(0, y0 + 1));
      const i00 = (ya * cw + xa) * 4, i10 = (ya * cw + xb) * 4, i01 = (yb * cw + xa) * 4, i11 = (yb * cw + xb) * 4;
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      // Premultiplied by alpha, so the transparent margin does not bleed a dark fringe into the edge.
      const a00 = s[i00 + 3] * w00, a10 = s[i10 + 3] * w10, a01 = s[i01 + 3] * w01, a11 = s[i11 + 3] * w11, a = a00 + a10 + a01 + a11;
      if (a < 0.5) { o[oi + 3] = 0; return; }
      for (let k = 0; k < 3; k++) o[oi + k] = (s[i00 + k] * a00 + s[i10 + k] * a10 + s[i01 + k] * a01 + s[i11 + k] * a11) / a;
      o[oi + 3] = a;
    }
    function render(dx, dy) {
      // Soft limit: past maxLen the cheek keeps giving a little, never tearing.
      const raw = Math.hypot(dx, dy);
      if (raw > 0) { const len = maxLen * Math.tanh(raw / maxLen); dx *= len / raw; dy *= len / raw; }
      const len = Math.hypot(dx, dy);
      for (let y = dirtyY; y < dirtyY + dirtyH; y++) {
        const start = (y * cw + dirtyX) * 4;
        o.set(s.subarray(start, start + dirtyW * 4), start);
      }
      if (len > 0.3) {
        const ux = dx / len, uy = dy / len;
        const ext = sig * 3;
        const x0 = Math.max(0, Math.floor(Math.min(cx, cx + dx) - ext)), x1 = Math.min(cw - 1, Math.ceil(Math.max(cx, cx + dx) + ext));
        const y0 = Math.max(0, Math.floor(Math.min(cy, cy + dy) - ext)), y1 = Math.min(ch - 1, Math.ceil(Math.max(cy, cy + dy) + ext));
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            let qx = x - dx, qy = y - dy;
            for (let it = 0; it < 5; it++) {
              const ex = qx - cx, ey = qy - cy, pu = ex * ux + ey * uy, pv = ey * ux - ex * uy, g = Math.exp(-(pu * pu * invP + pv * pv * invQ));
              qx = x - dx * g; qy = y - dy * g;
            }
            if (Math.abs(qx - x) < 0.02 && Math.abs(qy - y) < 0.02) continue;
            sample(qx, qy, (y * cw + x) * 4);
          }
        }
      }
      ctx.putImageData(out, 0, 0, dirtyX, dirtyY, dirtyW, dirtyH);
      // A stretched cheek flushes pink — painted only where the art is (source-atop).
      if (len > 0.3) {
        const t = Math.min(1, len / maxLen), gx = cx + dx * 0.7, gy = cy + dy * 0.7;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 1.4);
        grad.addColorStop(0, "rgba(255,120,140," + (0.38 * t).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(255,120,140,0)");
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = grad;
        ctx.fillRect(gx - R * 1.4, gy - R * 1.4, R * 2.8, R * 2.8);
        ctx.restore();
      }
    }
    ctx.putImageData(src, 0, 0);
    img.parentElement.append(canvas);
    img.style.visibility = "hidden";
    let targetDx = 0, targetDy = 0, currentDx = 0, currentDy = 0, frame = 0;
    let released = false, releaseX = 0, releaseY = 0, releaseAt = 0, pulled = false;
    const cleanup = () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
      canvas.remove(); img.style.visibility = "";
      pinchCleanups.delete(cleanup);
    };
    const animate = (now) => {
      frame = 0;
      if (disposed || !canvas.isConnected) { cleanup(); return; }
      if (released) {
        const t = now - releaseAt, k = Math.exp(-t / 105) * Math.cos(t / 72);
        currentDx = releaseX * k; currentDy = releaseY * k;
        render(currentDx, currentDy);
        if (t < PINCH_RETURN_MS) frame = requestAnimationFrame(animate);
        else { cleanup(); done && done(pulled); }
        return;
      }
      currentDx += (targetDx - currentDx) * PINCH_FOLLOW;
      currentDy += (targetDy - currentDy) * PINCH_FOLLOW;
      render(currentDx, currentDy);
      frame = requestAnimationFrame(animate);
    };
    const move = (ev) => {
      ev.preventDefault();
      targetDx = ((ev.clientX - e.clientX) / sc) * dpr * (mirrored ? -1 : 1);
      targetDy = ((ev.clientY - e.clientY) / sc) * dpr;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
      pulled = Math.hypot(targetDx, targetDy) > R * 0.35;
      if (!pulled) {
        if (frame) cancelAnimationFrame(frame);
        cleanup();
        done && done(false);
        return;
      }
      // Release from the visible, lagged position: a short soft overshoot, not a rubber-band snap.
      released = true; releaseX = currentDx; releaseY = currentDy; releaseAt = performance.now();
      if (!frame) frame = requestAnimationFrame(animate);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", up, { once: true });
    pinchCleanups.add(cleanup);
    frame = requestAnimationFrame(animate);
    e.preventDefault();
    return true;
  }

  /* ── AI-written lines ──
   * One call to the world's own text connection writes three lobby lines and one pinch reaction per character,
   * from the personality and profile Gacha Forge keeps for each. */
  let linesBusy = false;
  function modelText(v, depth = 0) {
    if (depth > 6 || v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map((x) => modelText(x, depth + 1)).filter(Boolean).join("\n");
    if (typeof v !== "object" || ["reasoning", "thinking", "redacted_thinking"].includes(v.type)) return "";
    for (const k of ["content", "text", "output_text", "output", "response", "message", "choices", "data", "result"]) { const t = modelText(v[k], depth + 1); if (t) return t; }
    return "";
  }
  async function makeLines(onlyMissing, targetName = "", lineIndex = null) {
    const w = world(), run = host()?._run;
    if (!w || !run || linesBusy) return;
    const targets = w.cards.filter((c) => (!targetName || c.name === targetName) && (!onlyMissing || !(Array.isArray(w.sd[c.name]?.lines) && w.sd[c.name].lines.length)));
    if (!targets.length) { w.note = "모든 캐릭터에 이미 대사가 있습니다."; paintSettings(); return; }
    linesBusy = true;
    w.note = "캐릭터 대사를 쓰는 중입니다…";
    paintSettings();
    try {
      const units = await Promise.all(targets.map((c) => unitOf(c, w).catch(() => ({}))));
      const cut = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
      const profiles = targets.map((c, i) => "- " + c.name + " (" + (units[i].role || c.role || "") + ")\n  성격: " + cut(units[i].personality, 400) + "\n  설정: " + cut(units[i].description, 400)).join("\n");
      const system = "너는 트릭컬 리바이브 같은 귀엽고 유쾌한 모바일 수집형 게임의 로비 대사 작가다. 캐릭터마다 성격과 말투를 살려, 로비에서 플레이어가 캐릭터를 눌렀을 때 하는 짧은 대사 3개와, 볼을 꼬집혀 쭉 늘어났을 때의 반응 1개를 한국어로 쓴다. 각 대사는 25자 이내, 이모지·따옴표 없이, 서로 다른 내용으로. 반드시 JSON 하나만 출력한다: {\"캐릭터 이름\": {\"lines\": [\"대사1\", \"대사2\", \"대사3\"], \"pinch\": \"반응\"}}";
      const user = "세계: " + cut(run.name, 80) + "\n" + cut(run.scenario, 600) + "\n\n캐릭터:\n" + profiles;
      const res = await fetch("/api/generate/raw", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "content-type": "application/json", "x-marinara-csrf": "1" },
        body: JSON.stringify({ connectionId: run.connectionId, runId: w.id, streaming: false,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          parameters: { maxTokens: 2400, temperature: 0.9 } }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw Error(String(body?.error || body?.message || "HTTP " + res.status));
      const text = modelText(body);
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      let n = 0;
      const next = { ...w.sd };
      for (const c of targets) {
        const got = json[c.name];
        if (!got || !Array.isArray(got.lines)) continue;
        const generated = got.lines.map((l) => cut(l, 60)).filter(Boolean).slice(0, 3);
        if (!generated.length) continue;
        const old = next[c.name] || {};
        if (lineIndex !== null) {
          const lines = (old.lines || []).slice(0, 3);
          while (lines.length < 3) lines.push("");
          if (lineIndex === "pinch") next[c.name] = { ...old, pinch: cut(got.pinch, 60) || old.pinch || "" };
          else { lines[lineIndex] = generated[0]; next[c.name] = { ...old, lines }; }
        } else next[c.name] = { ...old, lines: generated, pinch: cut(got.pinch, 60) };
        next[c.name]._editedAt = Date.now();
        n++;
      }
      w.sd = next;
      await storePatch({ ["sd:" + w.id]: w.sd });
      w.note = n + "명의 대사를 만들었습니다. 편집에서 고칠 수 있습니다.";
    } catch (e) {
      w.note = "대사 만들기 실패: " + e.message;
    } finally {
      linesBusy = false;
      sdEditKey = "";
      linesRev++;
      paintSettings();
    }
  }

  /* ── Home lobby ── */
  let lobbyEdit = false, floorEdit = false, lobbyPicked = "";
  const DEFAULT_FLOOR = { vpX: 50, vpY: 42, backL: 22, backR: 78, backY: 66, frontL: 3, frontR: 97, frontY: 94 };
  function lobbyScene() {
    const w = world(), raw = w && prefs.homeScene[w.id];
    return raw || DEFAULT_FLOOR;
  }
  function setLobbyScene(patch) {
    const w = world();
    if (!w) return;
    prefs.homeScene[w.id] = { ...DEFAULT_FLOOR, ...(prefs.homeScene[w.id] || {}), ...patch };
  }
  function floorBoundsAt(y, scene = lobbyScene()) {
    const t = Math.min(1, Math.max(0, (y - scene.backY) / Math.max(1, scene.frontY - scene.backY)));
    return {
      left: scene.backL + (scene.frontL - scene.backL) * t,
      right: scene.backR + (scene.frontR - scene.backR) * t,
    };
  }
  function clampToFloor(x, y, scene = lobbyScene()) {
    const cy = Math.min(scene.frontY, Math.max(scene.backY, y));
    const edge = floorBoundsAt(cy, scene);
    return { x: Math.min(edge.right, Math.max(edge.left, x)), y: cy };
  }
  function autoFloorPoint(i, n, back) {
    const scene = lobbyScene(), y = back ? scene.backY + (scene.frontY - scene.backY) * 0.35 : scene.frontY - 4;
    const edge = floorBoundsAt(y, scene), t = n === 1 ? 0.5 : 0.08 + (i / (n - 1)) * 0.84;
    return { x: edge.left + (edge.right - edge.left) * t, y };
  }
  function homeCast() {
    const w = world();
    if (!w) return [];
    const mine = prefs.home[w.id] || {};
    const list = w.cards.filter((c) => !c.extra && sdUrl(c.name) && (mine[c.name] ? mine[c.name].on : true));
    return list.map((c, i) => {
      const e = mine[c.name] || {};
      // Two rows: the front row low and large, the back row higher up between them.
      const n = list.length, back = n > 2 && i % 2 === 1;
      const auto = autoFloorPoint(i, n, back);
      const placed = clampToFloor(Number.isFinite(e.x) ? e.x : auto.x, Number.isFinite(e.y) ? e.y : auto.y);
      return { name: c.name, url: lobbySd(c.name) || sdUrl(c.name), x: placed.x, y: placed.y, s: Number.isFinite(e.s) ? e.s : 1 };
    });
  }
  function setHome(name, patch) {
    const w = world();
    if (!w) return;
    const cast = (prefs.home[w.id] = prefs.home[w.id] || {});
    cast[name] = { on: true, x: NaN, y: NaN, s: 1, ...cast[name], ...patch };
  }
  const SWORDS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path d="m11 19-6-6M8 16l-4 4M5 21l-2-2"/></svg>';
  // The lobby last built. The game rebuilds the home screen on every return, which dropped the lobby with it;
  // it was then built again from nothing (sprites, sizes, roaming) — the stall on coming home.
  let keptLobby = null;
  function paintLobby(root, enabled) {
    // The big story card leaves the lobby; its button lives in the menu row instead, like Trickcal's 전투.
    for (const dock of root.querySelectorAll(".hm-dock")) {
      let tile = dock.querySelector(":scope > .gfx-battle-tile");
      if (!enabled) { tile?.remove(); continue; }
      if (tile) continue;
      tile = el("button", "hm-tile gfx-battle-tile");
      tile.type = "button";
      tile.innerHTML = SWORDS;
      tile.append(el("span", "nm", "전투"));
      on(tile, "click", (e) => { e.stopPropagation(); root.querySelector(".hm-cta")?.click(); });
      dock.append(tile);
    }
    for (const screen of root.querySelectorAll(".hm-screen")) {
      let lobby = screen.querySelector(":scope > .gfx-lobby");
      if (!enabled) { lobby?.remove(); continue; }
      const cast = homeCast();
      const floorKey = Object.values(lobbyScene()).map((v) => Number(v).toFixed(1)).join(",");
      const key = (lobbyEdit ? "E:" + (floorEdit ? "F:" : "C:") : "") + floorKey + ":" + cast.map((c) => [c.name, c.url, faceOf(c.name)].join(",")).join("|");
      if (lobby && lobby.getAttribute("data-key") === key) { cast.forEach(roamState); continue; }
      // Same cast and floor as before: the kept lobby goes straight back in.
      if (!lobby && keptLobby && keptLobby.getAttribute("data-key") === key) {
        const scene = screen.querySelector(":scope > .hm-scene");
        if (scene) scene.after(keptLobby); else screen.append(keptLobby);
        cast.forEach(roamState);
        startRoam(keptLobby);
        continue;
      }
      if (!lobby) lobby = el("div", "gfx-lobby");
      keptLobby = lobby;
      lobby.setAttribute("data-key", key);
      lobby.setAttribute("data-count", String(cast.length));
      lobby.toggleAttribute("data-edit", lobbyEdit);
      lobby.toggleAttribute("data-floor-edit", lobbyEdit && floorEdit);
      const wanted = new Set(cast.map((c) => c.name));
      for (const who of lobby.querySelectorAll(":scope > .who")) if (!wanted.has(who.getAttribute("data-name"))) who.remove();
      cast.forEach((c, i) => {
        let who = Array.from(lobby.children).find((n) => n.classList.contains("who") && n.getAttribute("data-name") === c.name);
        if (!who) { who = makeWho(c, i); lobby.append(who); }
        else { roamState(c); setSprite(who.querySelector("img"), c.url, false); }
      });
      lobby.querySelector(":scope > .gfx-lobby-floor")?.remove();
      lobby.querySelector(":scope > .gfx-lobby-tools")?.remove();
      if (lobbyEdit && floorEdit) lobby.append(floorGuide(lobby));
      lobby.append(lobbyTools());
      const scene = screen.querySelector(":scope > .hm-scene");
      if (!lobby.isConnected) { if (scene) scene.after(lobby); else screen.append(lobby); }
      startRoam(lobby);
    }
  }
  /* ── Lobby roaming ──
   * Each character wanders the floor round the spot it was given in [배치]: walks to a random point, waits,
   * walks on. The higher its feet stand, the further away it is — smaller, slower, and behind the ones lower
   * down — and it faces the way it walks. State is kept by name, so a lobby the game redraws carries on from
   * where everyone was. Only one transform per character is written per frame; nothing is laid out again. */
  const roam = new Map(); // name -> { x, y, tx, ty, ax, ay, s, face, wait, dir }
  const RANGE = { x: 24, y: 18 };
  let lobbySize = { w: 0, h: 0 }, lobbyRO = null, roamFrame = 0, roamLast = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function depthOf(x, y, scene = lobbyScene()) {
    const bx = (scene.backL + scene.backR) / 2, fx = (scene.frontL + scene.frontR) / 2;
    const dist = Math.hypot((x - scene.vpX) * 0.45, y - scene.vpY);
    const far = Math.hypot((bx - scene.vpX) * 0.45, scene.backY - scene.vpY);
    const near = Math.hypot((fx - scene.vpX) * 0.45, scene.frontY - scene.vpY);
    return clamp((dist - far) / Math.max(1, near - far), 0, 1);
  }
  function roamState(c) {
    let st = roam.get(c.name);
    if (!st) { st = { x: c.x, y: c.y, tx: c.x, ty: c.y, wait: 0.4 + Math.random() * 2.6, dir: Math.random() < 0.5 ? -1 : 1 }; roam.set(c.name, st); }
    // A moved anchor (from [배치]) takes the character there.
    if (st.ax !== undefined && (st.ax !== c.x || st.ay !== c.y)) { st.x = st.tx = c.x; st.y = st.ty = c.y; st.wait = 1 + Math.random() * 2; }
    const safe = clampToFloor(st.x, st.y);
    st.x = safe.x; st.y = safe.y;
    const target = clampToFloor(st.tx, st.ty);
    st.tx = target.x; st.ty = target.y;
    st.ax = c.x; st.ay = c.y; st.s = c.s; st.face = faceOf(c.name);
    return st;
  }
  function placeWho(who, st) {
    const { w, h } = lobbySize;
    if (!w || !h) return;
    const wantedScale = st.s * (prefs.lobbyScale || 1) * (0.5 + 0.5 * depthOf(st.x, st.y));
    const size = who._gfxSize || (who._gfxSize = { h: who.offsetHeight || h * 0.4, w: who.offsetWidth || h * 0.27 });
    const ownHeight = size.h, ownWidth = size.w;
    const k = Math.max(0.1, Math.min(wantedScale, (st.y / 100 * h - 8) / ownHeight, w * .94 / ownWidth));
    const halfWidth = ownWidth * k * .5;
    const visualX = Math.min(w - halfWidth, Math.max(halfWidth, st.x / 100 * w));
    const transform = "translate(" + visualX.toFixed(1) + "px," + ((st.y / 100) * h).toFixed(1) + "px) scale(" + k.toFixed(3) + ") translate(-50%,-100%)";
    if (who.style.transform !== transform) who.style.transform = transform;
    const z = String(Math.round(st.y * 10));
    if (who.style.zIndex !== z) who.style.zIndex = z;
    // Art facing right is mirrored to walk left, art facing left to walk right; front-facing art never turns.
    const flip = st.face === "right" ? st.dir < 0 : st.face === "left" ? st.dir > 0 : false;
    const f = flip ? "scaleX(-1)" : "", fl = who.firstElementChild;
    if (fl && fl.style.transform !== f) fl.style.transform = f;
  }
  function pickTarget(st) {
    const scene = lobbyScene(), y = scene.backY + Math.random() * (scene.frontY - scene.backY);
    const edge = floorBoundsAt(y, scene);
    const p = clampToFloor(edge.left + Math.random() * (edge.right - edge.left), y);
    st.tx = p.x; st.ty = p.y;
  }
  let roamPopupAt = 0, roamPopup = false;
  function roamTick(t) {
    roamFrame = 0;
    const lobby = gameRoot()?.querySelector(".gfx-lobby");
    if (!lobby || disposed) { roamLast = 0; return; }
    const dt = roamLast ? Math.min(0.1, (t - roamLast) / 1000) : 0;
    roamLast = t;
    // A popup over the home (letters, the background picker) holds everyone still; checked every 250ms.
    if (t - roamPopupAt > 250) { roamPopupAt = t; roamPopup = !!gameRoot()?.querySelector("[data-chat-close], .hm-pk-wrap"); }
    const popup = roamPopup;
    for (const who of lobby.children) {
      if (!who.classList.contains("who")) continue;
      const st = roam.get(who.getAttribute("data-name"));
      if (!st) continue;
      const busy = popup || document.hidden || !prefs.opts.motion || lobbyEdit || who.hasAttribute("data-talk") || who.hasAttribute("data-pinch");
      let walking = false;
      if (!busy && dt) {
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) pickTarget(st); }
        else {
          // Depth counts for more than width, so a walk "into" the room is slower on screen, as it should be.
          const dx = st.tx - st.x, dy = (st.ty - st.y) * 1.7, dist = Math.hypot(dx, dy);
          const step = 5.5 * (0.6 + 0.4 * depthOf(st.x, st.y)) * dt;
          if (dist <= step) { st.x = st.tx; st.y = st.ty; st.wait = 1.4 + Math.random() * 3.6; }
          else {
            st.x += (dx / dist) * step;
            st.y += ((dy / dist) * step) / 1.7;
            if (Math.abs(dx) > 0.4) st.dir = dx > 0 ? 1 : -1;
            walking = true;
          }
        }
      }
      if (walking !== who.hasAttribute("data-walk")) { if (walking) who.setAttribute("data-walk", ""); else who.removeAttribute("data-walk"); }
      placeWho(who, st);
    }
    roamFrame = requestAnimationFrame(roamTick);
  }
  function startRoam(lobby) {
    if (!lobbyRO) lobbyRO = new ResizeObserver((entries) => {
      for (const e of entries) {
        lobbySize = { w: e.contentRect.width, h: e.contentRect.height };
        for (const who of e.target.querySelectorAll(":scope > .who")) who._gfxSize = null;
      }
    });
    lobbyRO.disconnect();
    lobbyRO.observe(lobby);
    lobbySize = { w: lobby.clientWidth, h: lobby.clientHeight };
    for (const who of lobby.querySelectorAll(":scope > .who")) { const st = roam.get(who.getAttribute("data-name")); if (st) placeWho(who, st); }
    if (!roamFrame) roamFrame = requestAnimationFrame(roamTick);
  }
  function makeWho(c, i) {
    const who = el("div", "who");
    who.setAttribute("data-name", c.name);
    // The idle bob's delay comes from the clock, so a redrawn lobby carries on mid-bob.
    who.style.setProperty("--bdl", (-((performance.now() / 1000 + i * 0.7) % 1.9)).toFixed(2) + "s");
    const st = roamState(c);
    if (lobbyEdit && c.name === lobbyPicked) who.style.outlineStyle = "solid";
    const flip = el("div", "flip"), body = el("div", "body"), img = el("img");
    const fit = () => {
      if (img.naturalWidth && img.naturalHeight) who.style.aspectRatio = img.naturalWidth + " / " + img.naturalHeight;
      who._gfxSize = null;
      who.style.setProperty("--hf", img.style.getPropertyValue("--hf") || "1");
    };
    img.addEventListener("load", fit);
    setSprite(img, c.url, false);
    if (img.complete) fit();
    img.alt = c.name;
    img.draggable = false;
    body.append(img);
    flip.append(body);
    who.append(flip);
    on(who, "pointerdown", (e) => {
      e.stopPropagation();
      if (!lobbyEdit) {
        // A press on a cheek pulls it; let go and it snaps back with a word from them.
        who.setAttribute("data-pinch", "");
        const look = sdEntry(c.name).lobby || "";
        const started = startPinch(img, e, cheeksOf(c.name, look), cheekR(c.name, look), who, (pulled) => {
          who.removeAttribute("data-pinch");
          who.removeAttribute("data-squish"); void who.offsetWidth; who.setAttribute("data-squish", "");
          talk(who, pulled ? pinchFor(c.name) : pick(linesFor(c.name)), 2600);
        });
        if (started) who.setAttribute("data-pinched", ""); else who.removeAttribute("data-pinch");
        return;
      }
      if (floorEdit) return;
      e.preventDefault();
      lobbyPicked = c.name;
      who.setAttribute("data-dragging", "");
      const box = who.parentElement.getBoundingClientRect();
      who.setPointerCapture(e.pointerId);
      // The feet keep the offset they had from the pointer, so the character does not jump under it.
      const at = (ev) => [((ev.clientX - box.left) / box.width) * 100, ((ev.clientY - box.top) / box.height) * 100];
      const [px0, py0] = at(e), ox = st.x - px0, oy = st.y - py0;
      const move = (ev) => {
        const [px, py] = at(ev);
        const p = clampToFloor(px + ox, py + oy);
        c.x = st.x = st.tx = p.x;
        c.y = st.y = st.ty = p.y;
        placeWho(who, st);
      };
      let ended = false;
      const up = () => {
        if (ended) return;
        ended = true;
        who.removeAttribute("data-dragging");
        who.removeEventListener("pointermove", move);
        who.removeEventListener("pointerup", up);
        who.removeEventListener("pointercancel", up);
        who.removeEventListener("lostpointercapture", up);
        setHome(c.name, { x: st.x, y: st.y });
        st.ax = st.x; st.ay = st.y;
        savePrefs();
        refresh();
      };
      who.addEventListener("pointermove", move);
      who.addEventListener("pointerup", up);
      who.addEventListener("pointercancel", up);
      who.addEventListener("lostpointercapture", up);
    });
    on(who, "click", (e) => {
      e.stopPropagation();
      if (lobbyEdit) return;
      if (who.hasAttribute("data-pinched")) { who.removeAttribute("data-pinched"); return; }
      who.removeAttribute("data-squish");
      void who.offsetWidth;
      who.setAttribute("data-squish", "");
      talk(who, pick(linesFor(c.name)), 2400);
    });
    on(who, "wheel", (e) => {
      if (!lobbyEdit) return;
      e.preventDefault();
      e.stopPropagation();
      resizeLobby(e.deltaY < 0 ? 1.06 : 0.94);
    }, { passive: false });
    return who;
  }
  // The lobby's size, all at once; the loop reads it every frame, so nothing is rebuilt.
  function resizeLobby(f) {
    prefs.lobbyScale = Math.min(2, Math.max(0.5, +((prefs.lobbyScale || 1) * f).toFixed(3)));
    savePrefs();
  }
  function floorGuide(lobby) {
    const guide = el("div", "gfx-lobby-floor");
    const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    const area = document.createElementNS(ns, "polygon");
    const rays = [0, 1, 2, 3].map(() => document.createElementNS(ns, "line"));
    svg.append(area, ...rays);
    guide.append(svg);
    const vp = el("button", "", "소실점");
    vp.type = "button"; vp.setAttribute("data-floor-handle", "vp"); vp.setAttribute("data-floor-drag", "vp");
    guide.append(vp);
    const edges = new Map();
    for (const [id, label] of [["far", "멀리 걷는 선"], ["near", "가까이 걷는 선"]]) {
      const edge = el("div", "gfx-floor-edge");
      edge.setAttribute("data-floor-line", id);
      const left = el("button", "edge-end"); left.type = "button"; left.setAttribute("data-side", "left"); left.setAttribute("data-floor-drag", "left");
      const mid = el("button", "edge-mid", label); mid.type = "button"; mid.setAttribute("data-floor-drag", "mid");
      const right = el("button", "edge-end"); right.type = "button"; right.setAttribute("data-side", "right"); right.setAttribute("data-floor-drag", "right");
      edge.append(left, mid, right); guide.append(edge); edges.set(id, edge);
    }
    const draw = () => {
      const s = lobbyScene(), corners = [[s.backL, s.backY], [s.backR, s.backY], [s.frontR, s.frontY], [s.frontL, s.frontY]];
      area.setAttribute("points", corners.map((p) => p.join(",")).join(" "));
      corners.forEach((p, i) => {
        rays[i].setAttribute("x1", String(s.vpX)); rays[i].setAttribute("y1", String(s.vpY));
        rays[i].setAttribute("x2", String(p[0])); rays[i].setAttribute("y2", String(p[1]));
      });
      vp.style.left = s.vpX + "%"; vp.style.top = s.vpY + "%";
      const far = edges.get("far"), near = edges.get("near");
      far.style.left = s.backL + "%"; far.style.width = (s.backR - s.backL) + "%"; far.style.top = s.backY + "%";
      near.style.left = s.frontL + "%"; near.style.width = (s.frontR - s.frontL) + "%"; near.style.top = s.frontY + "%";
      for (const who of lobby.querySelectorAll(":scope > .who")) {
        const name = who.getAttribute("data-name"), st = roam.get(name);
        if (!st) continue;
        const p = clampToFloor(st.x, st.y, s), tp = clampToFloor(st.tx, st.ty, s);
        st.x = p.x; st.y = p.y; st.tx = tp.x; st.ty = tp.y;
        placeWho(who, st);
      }
    };
    for (const h of guide.querySelectorAll("[data-floor-drag]")) {
      on(h, "pointerdown", (e) => {
        e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
        const edge = h.closest("[data-floor-line]"), line = edge?.getAttribute("data-floor-line") || "", mode = h.getAttribute("data-floor-drag");
        const move = (ev) => {
          const box = lobby.getBoundingClientRect();
          let x = clamp(((ev.clientX - box.left) / box.width) * 100, 0, 100);
          let y = clamp(((ev.clientY - box.top) / box.height) * 100, 0, 96);
          const s = lobbyScene(), patch = {};
          if (mode === "vp") { patch.vpX = x; patch.vpY = clamp(y, 0, s.backY - 4); }
          else if (mode === "mid" && line === "far") patch.backY = clamp(y, 42, s.frontY - 8);
          else if (mode === "mid" && line === "near") patch.frontY = clamp(y, s.backY + 8, 96);
          else if (mode === "left" && line === "far") patch.backL = clamp(x, 0, s.backR - 6);
          else if (mode === "right" && line === "far") patch.backR = clamp(x, s.backL + 6, 100);
          else if (mode === "left" && line === "near") patch.frontL = clamp(x, 0, s.frontR - 6);
          else if (mode === "right" && line === "near") patch.frontR = clamp(x, s.frontL + 6, 100);
          setLobbyScene(patch);
          draw();
        };
        const up = () => {
          h.removeEventListener("pointermove", move); h.removeEventListener("pointerup", up);
          h.removeEventListener("pointercancel", up); h.removeEventListener("lostpointercapture", up);
          for (const [name, st] of roam) setHome(name, { x: st.x, y: st.y });
          savePrefs(); refresh();
        };
        h.addEventListener("pointermove", move); h.addEventListener("pointerup", up);
        h.addEventListener("pointercancel", up); h.addEventListener("lostpointercapture", up);
      });
    }
    draw();
    return guide;
  }
  function lobbyTools() {
    const tools = el("div", "gfx-lobby-tools");
    const btn = (text, fn, attr) => {
      const b = el("button", "", text);
      b.type = "button";
      if (attr) b.setAttribute(attr, "");
      on(b, "click", (e) => { e.stopPropagation(); fn(); });
      on(b, "pointerdown", (e) => e.stopPropagation());
      return b;
    };
    if (lobbyEdit) {
      tools.append(btn("완료", () => { lobbyEdit = false; floorEdit = false; lobbyPicked = ""; refresh(); }, "data-main"),
        btn(floorEdit ? "캐릭터 배치" : "소실점 · 바닥", () => { floorEdit = !floorEdit; lobbyPicked = ""; refresh(); }),
        btn("모두 크게", () => resizeLobby(1.1)), btn("모두 작게", () => resizeLobby(0.9)),
        btn("자동 배치", () => { const w = world(); if (w) { for (const e of Object.values(prefs.home[w.id] || {})) { e.x = NaN; e.y = NaN; e.s = 1; } savePrefs(); refresh(); } }));
      if (floorEdit) tools.append(btn("바닥 초기화", () => { setLobbyScene(DEFAULT_FLOOR); savePrefs(); refresh(); }));
      // Who stands in the lobby: every character with an SD, pressed ones are out.
      const w = world(), mine = (w && prefs.home[w.id]) || {};
      const cast = el("div", "gfx-lobby-cast");
      for (const c of w ? w.cards.filter((x) => !x.extra && sdUrl(x.name)) : []) {
        const shown = mine[c.name] ? mine[c.name].on : true;
        const b = btn((shown ? "✓ " : "") + c.name, () => { setHome(c.name, { on: !shown }); savePrefs(); refresh(); });
        b.setAttribute("aria-pressed", String(shown));
        cast.append(b);
      }
      tools.append(cast);
    } else tools.append(btn("✥ 배치", () => { lobbyEdit = true; floorEdit = false; refresh(); }, "data-edit-toggle"));
    return tools;
  }

  const chatter = setInterval(() => {
    if (disposed || lobbyEdit || !current || !prefs.opts.lobby) return;
    const cast = Array.from(gameRoot()?.querySelectorAll(".gfx-lobby .who:not([data-talk])") || []);
    const who = pick(cast);
    if (!who || document.hidden || who.hasAttribute("data-pinch")) return;
    talk(who, pick(linesFor(who.getAttribute("data-name"))), 2600);
  }, 7000);

  /* ── Attendance ── */
  // One listener on the game's root: the game redraws the board often, so a listener on the button goes stale.
  const boundRoots = new WeakSet();
  function bindAttend(root) {
    if (boundRoots.has(root)) return;
    boundRoots.add(root);
    on(root, "click", (e) => {
      const claim = e.target.closest?.('.ev-panel[data-gfx-attendance] [data-events-claim]');
      if (!current || !prefs.opts.attend || !claim) return;
      // The stamp lands at once; when the game has taken the claim, the board closes by itself.
      root.querySelector(".ev-panel .ev-day.next")?.classList.add("gfx-stamped");
      const t0 = performance.now();
      const wait = setInterval(() => {
        const live = root.querySelector(".ev-panel");
        const done = !live || !live.querySelector("[data-events-claim]:not(:disabled)") || !live.querySelector(".ev-day.next");
        if (!done && performance.now() - t0 < 6000) return;
        clearInterval(wait);
        setTimeout(() => root.querySelector("[data-events-close]")?.click(), 550);
      }, 120);
    }, { capture: true });
  }
  function paintAttend(root, enabled) {
    bindAttend(root);
    for (const panel of root.querySelectorAll(".ev-panel")) {
      let m = panel.querySelector(":scope > .gfx-ev-mascot");
      const attendance = enabled && !!panel.querySelector(".ev-day");
      if (attendance) panel.setAttribute("data-gfx-attendance", "");
      else panel.removeAttribute("data-gfx-attendance");
      if (!attendance) { m?.remove(); continue; }

      if (m) continue;
      m = el("div", "gfx-ev-mascot");
      const body = el("div", "body");
      body.append(heroNode(pick(anySd())));
      const claimed = panel.querySelector(".ev-day.next") ? "오늘 도장 찍으러 왔구나!" : "내일도 꼭 와야 해~";
      m.append(body, el("span", "say", claimed));
      panel.append(m);
    }
  }

  /* ── Loading screen ──
   * The game shows its own short loading states per screen; the screen's state field says when. The overlay
   * lives in the game's shadow root (the game element itself is what goes fullscreen), so it is put back
   * straight away whenever the game rewrites the root. */
  const LOADING_BY_VIEW = {
    combat: (h) => h._combatPhase === "loading", beat: (h) => h._beatState === "loading",
    chapters: (h) => h._chaptersState === "loading", chapter: (h) => h._planState === "loading",
    summon: (h) => h._summonBannerState === "loading", tower: (h) => h._towerState === "loading",
    farm: (h) => h._farmState === "loading", roster: (h) => h._rosterState === "loading",
    inventory: (h) => h._inventoryState === "loading", formation: (h) => h._formationState === "loading",
  };
  // Returns false, "heavy" (boot, writing a story beat), "battle" (entering a battle) or "light" (a menu fetching its list).
  const HEAVY_VIEWS = new Set(["beat"]);
  function loadingNow(h) {
    if (!h || !h.shadowRoot) return false;
    if (h._hudView === "beat" || (h._activeStoryNode && h._beatState === "loading")) return false;
    if (h._boot === "idle" || h._boot === "loading") return "heavy";
    const test = LOADING_BY_VIEW[h._hudView];
    try { return test && test(h) ? (h._hudView === "combat" ? "battle" : HEAVY_VIEWS.has(h._hudView) ? "heavy" : "light") : false; } catch { return false; }
  }
  let load = null; // { node, since, progress, tipAt, shownAt, ending }
  function makeLoad() {
    const node = el("div", "gfx-load");
    node.setAttribute("data-gfx-ui", "");
    const title = el("div", "gfx-load-title", "Now Loading");
    for (let i = 0; i < 3; i++) title.append(el("i", "", "."));
    const name = host()?._run?.name;
    const worldName = el("div", "gfx-load-world", name ? String(name) : "");
    const stage = el("div", "gfx-load-stage");
    const hero = el("div", "gfx-load-hero");
    const sds = anySd();
    hero.append(heroNode(pick(sds)));
    stage.append(el("i", "gfx-load-shadow"), hero);
    const react = (target, e) => {
      e.stopPropagation();
      target.removeAttribute("data-squish");
      void target.offsetWidth;
      target.setAttribute("data-squish", "");
      clearTimeout(target._gfxSquishTimer);
      target._gfxSquishTimer = setTimeout(() => target.removeAttribute("data-squish"), 380);
      const pop = el("span", "gfx-load-pop", pick(["말랑!", "꾹!", "몰캉~", "뿌잉"]));
      target.append(pop);
      setTimeout(() => pop.remove(), 650);
    };
    on(stage, "click", (e) => react(stage, e));
    const foot = el("div", "gfx-load-foot");
    const tip = el("div", "gfx-load-tip");
    tip.append(el("b", "", "TIP"), el("span", "", pick(TIPS)));
    const bar = el("div", "gfx-load-bar");
    const fill = el("i", "gfx-load-fill");
    const runner = el("div", "gfx-load-runner");
    runner.append(heroNode(pick(sds)));
    on(runner, "click", (e) => react(runner, e));
    bar.append(fill, runner, el("em", "gfx-load-pct", "0%"));
    foot.append(tip, bar);
    node.append(title, worldName, stage, foot);
    return node;
  }
  function paintLoad() {
    if (!load) return;
    const box = load.node.getBoundingClientRect();
    if (box.width) load.node.style.setProperty("--u", Math.max(5, Math.min(box.height * 0.016, box.width * 0.009)).toFixed(2) + "px");
    const p = Math.round(load.progress);
    const fill = load.node.querySelector(".gfx-load-fill"), runner = load.node.querySelector(".gfx-load-runner");
    if (fill) fill.style.width = "calc((100% - 6px) * " + p / 100 + ")";
    if (runner) runner.style.left = "calc(3px + (100% - 6px) * " + p / 100 + ")";
    const pct = load.node.querySelector(".gfx-load-pct");
    if (pct) pct.textContent = p + "%";
  }
  const entryHooks = new Map();
  let chapterEnteredAt = 0, chapterMutationAt = 0;
  function hookChapterEntry(h) {
    if (!h || entryHooks.has(h)) return;
    const saved = {};
    for (const key of ["_openChapter"]) {
      const original = h[key]; if (typeof original !== "function") continue;
      const wrapped = function(...args) {
        if (current && prefs.opts.loading && this._run && (key !== "_openPrologueIfOwed" || this._prologue)) {
          chapterEnteredAt = chapterMutationAt = performance.now();
          if (!load) load = { node: makeLoad(), progress: 4, tipAt: chapterEnteredAt, shownAt: chapterEnteredAt, ending: 0, external: true };
          load.external = true; load.ending = 0; mountChapterPopup();
        }
        return original.apply(this, args);
      };
      saved[key] = {original, wrapped}; h[key] = wrapped;
    }
    entryHooks.set(h, saved);
  }
  function chapterPopupView(h) { return h?._hudView === "chapter"; }
  function mountChapterPopup() {
    if (!load) return;
    if (!load.popup) {
      const popup = document.createElement("div");
      popup.id = "gfx-chapter-loading"; popup.setAttribute("data-gfx-ui", "");
      popup.setAttribute("popover", "manual"); popup.setAttribute("role", "status"); popup.setAttribute("aria-label", "챕터를 준비하는 중");
      popup.style.cssText = "position:fixed;inset:0;margin:auto;width:100vw;height:100dvh;padding:0;border:0;border-radius:0;overflow:hidden;z-index:2147483004;box-shadow:0 12px 60px #0009;background:transparent";
      const shadow = popup.attachShadow({ mode: "open" });
      shadow.adoptedStyleSheets = [styleSheet(), paintVars()];
      const mount = el("div", "gfx-load-host"); mount.style.cssText = "position:relative;width:100%;height:100%";
      shadow.append(mount); document.body.append(popup);
      load.popup = popup; load.popupMount = mount;
      if (typeof popup.showPopover === "function") popup.showPopover();
      else popup.removeAttribute("popover");
    }
    if (load.node.parentNode !== load.popupMount) load.popupMount.append(load.node);
  }
  function ensureLoadMounted() {
    if (load && (load.external || chapterPopupView(host()))) {
      load.external = true;
      const oldMount = load.node.parentElement;
      mountChapterPopup();
      if (oldMount?.classList.contains("gfx-load-host") && oldMount !== load.popupMount && !oldMount.childElementCount) oldMount.remove();
      return;
    }
    const root = gameRoot();
    if (!root) return;
    const target = root.querySelector(".gf-stage") || root.querySelector(".gf-arena");
    if (!target) return;
    // On a fresh open this timer can find the game before the style pass has dressed it: without the sheet
    // the SD was drawn at its full picture size for a moment (a face across the whole screen). The sheet goes
    // on first, and the screen waits if it still is not there.
    apply();
    if (!root.adoptedStyleSheets.includes(styleSheet())) return;
    let mount = target.querySelector(":scope > .gfx-load-host");
    if (!load) { if (mount && !mount.childElementCount) mount.remove(); return; }
    if (!mount) { mount = el("div", "gfx-load-host"); target.append(mount); }
    if (load.node.parentNode !== mount) mount.append(load.node);
  }
  /* A screen change (chapter list → chapter) loads in short bursts, and the game redraws its stage between them.
   * The screen used to open on each burst and replay its fade-in each time the redraw re-attached it — a blink
   * every few frames. Now: a menu's own short fetch gets the screen only past 1s (boot and story past 0.35s);
   * a gap under 0.45s between bursts counts as the same load; the fade-in plays once.
   * Entering a battle usually takes about a second, so the screen used to pop in and straight out again. A battle
   * gets the screen only past 1.4s, and once shown it stays at least 0.9s. */
  let loadingSince = 0, lastWantAt = 0;
  const LOAD_AFTER = { heavy: 350, battle: 1400, light: 1000 }, LOAD_GAP = 450, LOAD_MIN = 900;
  // The game tags a thought "Name (thought)" as it turns each line; under 말랑 it reads "Name (속마음)".
  function relabelThought(h) {
    const who = current && h?._beatState === "ready" ? h.shadowRoot?.querySelector(".vn-who[data-thought]") : null;
    if (!who) return;
    const t = who.textContent;
    if (/\(thought\)\s*$/i.test(t)) who.textContent = t.replace(/\(thought\)\s*$/i, "(속마음)");
    else if (/^\s*Thought\s*$/i.test(t)) who.textContent = "속마음";
  }
  function tickLoading() {
    if (disposed || document.hidden) return;
    if (sdEditing) placeSdEditor();
    const h = host();
    if (h?._hudView === "beat") relabelThought(h);
    if (h?._hudView === "beat" && load) { load.popup?.remove(); load.node.remove(); load = null; chapterEnteredAt = 0; lastWantAt = 0; loadingSince = 0; }
    // The battle phase as a host attribute, for rules that differ before and during the fight.
    const phase = h && h._hudView === "combat" ? String(h._combatPhase || "") : "";
    if (h && (h.getAttribute("data-gfx-phase") || "") !== phase) { if (phase) h.setAttribute("data-gfx-phase", phase); else h.removeAttribute("data-gfx-phase"); }
    const entering = chapterEnteredAt && (performance.now() - chapterEnteredAt < 220 || performance.now() - chapterMutationAt < 120);
    const kind = !!current && prefs.opts.loading && h?._hudView !== "beat" && (entering ? "heavy" : loadingNow(h));
    const now = performance.now();
    if (kind) lastWantAt = now;
    const want = !!kind || (lastWantAt && now - lastWantAt < LOAD_GAP);
    if (want) {
      if (!loadingSince) loadingSince = now;
      // Short waits stay quiet: only a load still running past its threshold gets the screen (a stuck one only once).
      if (!load && kind && now - loadingSince > LOAD_AFTER[kind] && now - loadingSince < 25000) {
        load = { node: makeLoad(), progress: 4, tipAt: now, shownAt: now, ending: 0 };
        ensureLoadMounted();
      }
    } else loadingSince = 0;
    if (!load) return;
    ensureLoadMounted();
    // The fade-in once: re-attaching after a redraw must not replay it.
    if (!load.node.hasAttribute("data-shown") && now - load.shownAt > 240) load.node.setAttribute("data-shown", "");
    // A state the game never clears (an error it shows on its own screen) must not hide that screen: 25s at most.
    if (!load.ending && ((!want && now - load.shownAt > (load.external ? 200 : LOAD_MIN)) || (!load.external && now - load.shownAt > 25000))) load.ending = now;
    if (load.ending) {
      // The chapter-entry screen fills and leaves at once; the others still finish their bar.
      load.progress = load.external ? 100 : Math.min(100, load.progress + 30);
      if (load.progress >= 100 && (load.external || now - load.ending > 120)) {
        const node = load.node, popup = load.popup;
        node.setAttribute("data-out", "");
        if (load.external) node.setAttribute("data-fast", "");
        load = null;
        const mount = node.parentElement;
        setTimeout(() => { node.remove(); popup?.remove(); if (mount && !mount.childElementCount) mount.remove(); }, node.hasAttribute("data-fast") ? 150 : 280);
        return;
      }
    } else {
      // The chapter-entry bar fills at its own random pace each time, in uneven steps (a short pause, a spurt).
      if (load.external) { load.rate ??= 0.025 + Math.random() * 0.07; load.progress += (92 - load.progress) * load.rate * (Math.random() < 0.15 ? 0 : 0.4 + Math.random() * 1.6); }
      else load.progress += (92 - load.progress) * 0.035;
      if (now - load.tipAt > 4200) {
        load.tipAt = now;
        const span = load.node.querySelector(".gfx-load-tip span");
        if (span) { const n = el("span", "", pick(TIPS.filter((t) => t !== span.textContent))); span.replaceWith(n); }
      }
    }
    paintLoad();
  }

  /* ═════════════ Settings → 화면 → UI 스타일 ═════════════ */
  function makeCard([id, label, desc]) {
    const c = prefs.colors;
    const b = el("button", "st-sty");
    b.type = "button";
    b.setAttribute("data-gfx-set", id);
    const mini = el("span", "st-mini");
    mini.style.background = c.sky1;
    for (const [l, t, w, hgt, bg] of [[8, 10, 84, 14, c.card], [8, 31, 50, 34, c.card], [62, 31, 30, 15, c.accent], [8, 72, 84, 18, c.card]]) {
      const i = el("i");
      i.style.cssText = "left:" + l + "%;top:" + t + "%;width:" + w + "%;height:" + hgt + "%;background:" + bg;
      mini.append(i);
    }
    const lbl = el("span", "st-swlbl");
    lbl.append(el("b", "", label), el("span", "", desc));
    b.append(mini, el("span", "st-tick", "✓"), lbl);
    on(b, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disposed) return;
      current = id;
      writeStyle(current);
      refresh();
      loadWorld();
    });
    return b;
  }
  let settingsView = "ui";
  function plate(title, key) {
    const p = el("div", "st-plate");
    p.setAttribute("data-gfx-plate", key);
    p.setAttribute("data-gfx-section", key === "sd" ? "sd" : "ui");
    const hd = el("div", "hd");
    hd.append(el("h3", "", title));
    p.append(hd);
    return p;
  }
  function settingsNav(container) {
    const nav = el("div", "gfx-settings-nav");
    nav.setAttribute("data-gfx-plate", "nav");
    nav.setAttribute("data-gfx-settings-nav", "");
    for (const [id, label] of [["ui", "UI 설정"], ["sd", "SD 관리"]]) {
      const b = chip(label, () => {
        settingsView = id;
        container?.setAttribute("data-gfx-settings-view", settingsView);
        for (const x of nav.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x === b));
        if (id === "sd") { loadConnections(); loadWorld(); paintSettings(true); }
      });
      b.setAttribute("aria-pressed", String(settingsView === id));
      nav.append(b);
    }
    return nav;
  }
  function hint(text, key) {
    const p = el("p", "hint", text);
    p.style.cssText = "display:block;margin:.7em 0 0";
    if (key) p.setAttribute("data-gfx-note", key);
    return p;
  }
  function chip(text, fn, attrs = {}) {
    const b = el("button", "st-chip", text);
    b.type = "button";
    for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
    on(b, "click", (e) => { e.stopPropagation(); fn(b); });
    return b;
  }

  function colorPlate() {
    const p = plate("말랑 색상", "colors");
    const row = el("div", "st-chips");
    for (const [id, label, colors] of PRESETS) {
      row.append(chip(label, () => { prefs.colors = { ...colors }; prefs.preset = id; savePrefs(); apply(); refresh(); }, { "data-gfx-preset": id }));
    }
    const grid = el("div", "gfx-colors");
    for (const [k, label] of COLOR_FIELDS) {
      const lab = el("label", "gfx-color");
      const input = el("input");
      input.type = "color";
      input.setAttribute("data-gfx-color", k);
      on(input, "input", () => { prefs.colors[k] = cleanColor(input.value, prefs.colors[k]); prefs.preset = ""; apply(); paintVars(); });
      on(input, "change", () => { savePrefs(); paintSettings(); });
      on(lab, "click", (e) => e.stopPropagation());
      lab.append(input, el("span", "", label));
      grid.append(lab);
    }
    const fontRow = el("div", "st-chips");
    fontRow.style.marginTop = ".7em";
    const fontSelect = el("select"); fontSelect.setAttribute("aria-label", "말랑 글꼴"); fontSelect.setAttribute("data-gfx-font-select", "");
    for (const family of FONT_CHOICES) { const option = el("option", "", family === "system-ui" ? "기기 기본 글꼴" : family); option.value = family; fontSelect.append(option); }
    fontSelect.value = prefs.font;
    on(fontSelect, "change", () => { prefs.font = fontSelect.value; savePrefs(); apply(); });
    fontRow.append(fontSelect);
    fontRow.append(chip("글꼴 받기", () => fetchFonts(), { "data-gfx-font-get": "" }));
    p.append(row, grid, hint("", "fonts"), fontRow);
    return p;
  }
  function optionPlate() {
    const p = plate("스토리 · 전투 이미지", "opts");
    const grid = el("div", "gfx-toggles");
    for (const [k, label, desc] of OPTION_FIELDS) {
      const b = el("button", "gfx-toggle");
      b.type = "button";
      b.setAttribute("data-gfx-opt", k);
      b.append(el("b", "", label), el("span", "", desc));
      on(b, "click", (e) => { e.stopPropagation(); prefs.opts[k] = !prefs.opts[k]; savePrefs(); refresh(); });
      grid.append(b);
    }
    const cast = el("div", "st-chips");
    cast.style.marginTop = ".7em";
    for (const n of [2, 3, 4, 5]) cast.append(chip(n + "명", () => { prefs.storyCast = n; savePrefs(); paintSettings(); refresh(); }, { "data-gfx-cast": String(n) }));
    // How much of the scene shows through the dialogue box (100% = solid).
    const boxRow = el("label", "gfx-box-alpha");
    const boxRange = el("input"); boxRange.type = "range"; boxRange.min = "20"; boxRange.max = "100"; boxRange.step = "5";
    boxRange.value = String(prefs.boxOpacity); boxRange.setAttribute("data-gfx-box-alpha", ""); boxRange.setAttribute("aria-label", "대사칸 불투명도");
    const boxValue = el("b", "", prefs.boxOpacity + "%");
    on(boxRange, "input", () => { prefs.boxOpacity = Number(boxRange.value); boxValue.textContent = boxRange.value + "%"; paintVars(); });
    on(boxRange, "change", () => savePrefs());
    on(boxRow, "click", (e) => e.stopPropagation());
    boxRow.append(boxRange, boxValue);
    p.append(grid, hint("스토리에 한 번에 서는 최대 인원 (넘으면 가장 오래 말하지 않은 인물이 물러납니다)"), cast,
      hint("대사칸 불투명도 (낮출수록 배경이 비쳐 보입니다)"), boxRow);
    return p;
  }

  function toggleGrid(fields) {
    const grid = el("div", "gfx-toggles");
    for (const [k, label, desc] of fields) {
      const b = el("button", "gfx-toggle");
      b.type = "button";
      b.setAttribute("data-gfx-opt", k);
      b.append(el("b", "", label), el("span", "", desc));
      on(b, "click", (e) => { e.stopPropagation(); prefs.opts[k] = !prefs.opts[k]; savePrefs(); refresh(); });
      grid.append(b);
    }
    return grid;
  }
  function screenPlate() {
    const p = plate("트릭컬 화면", "screens");
    p.append(toggleGrid(SCREEN_FIELDS), hint("홈 로비에 둘 캐릭터 (SD가 있는 캐릭터만 나옵니다)"));
    const list = el("div", "st-chips");
    list.setAttribute("data-gfx-home-list", "");
    p.append(list, hint("", "home"));
    return p;
  }
  function paintHomeList(root) {
    const w = world();
    const cards = w ? w.cards.filter((c) => sdUrl(c.name)) : [];
    const mine = (w && prefs.home[w.id]) || {};
    for (const list of root.querySelectorAll("[data-gfx-home-list]")) {
      const key = cards.map((c) => c.name + ":" + (mine[c.name] ? mine[c.name].on : true)).join("|");
      if (list.getAttribute("data-key") === key) continue;
      list.setAttribute("data-key", key);
      list.textContent = "";
      for (const c of cards) {
        const b = chip(c.name, () => { setHome(c.name, { on: !(mine[c.name] ? mine[c.name].on : true) }); savePrefs(); refresh(); });
        b.setAttribute("aria-pressed", String(mine[c.name] ? mine[c.name].on : true));
        list.append(b);
      }
    }
    const text = !cards.length ? "아직 SD가 있는 캐릭터가 없습니다. 아래 SD 캐릭터 만들기에서 먼저 그려 주세요."
      : "누른 캐릭터가 홈에 섭니다. 홈 왼쪽 위 [✥ 배치]를 누르면 끌어서 옮기고, 휠이나 [크게]·[작게]로 크기를 바꿉니다.";
    for (const n of root.querySelectorAll('[data-gfx-note="home"]')) n.textContent = text;
  }

  let connections = null; // [{id, name, model}]
  async function loadConnections() {
    if (connections) return;
    connections = [];
    try {
      const list = await fetch("/api/connections", { credentials: "same-origin" }).then((r) => r.json());
      connections = (Array.isArray(list) ? list : []).filter((c) => c && c.provider === "image_generation")
        .map((c) => ({ id: String(c.id), name: String(c.name || c.model || c.id), model: String(c.model || "") }));
    } catch {}
    paintSettings(true);
  }
  function sdPlate() {
    const p = plate("SD 캐릭터 만들기", "sd");
    p.append(hint("세계의 캐릭터 외형으로 투명 배경 SD(치비) 이미지를 그려 스토리 · 전투 · 로딩 화면에 씁니다. 이미지는 갤러리에 저장되고, 그릴 때마다 이미지 연결의 사용량(NovelAI는 Anlas)이 듭니다."));
    const conn = el("label", "gfx-field");
    conn.append(el("span", "", "이미지 연결"));
    const sel = el("select");
    sel.setAttribute("data-gfx-conn", "");
    on(sel, "change", () => { prefs.gen.connectionId = sel.value; savePrefs(); });
    on(sel, "click", (e) => e.stopPropagation());
    conn.append(sel);
    const tpl = el("label", "gfx-field");
    tpl.append(el("span", "", "프롬프트 ({appearance} = 캐릭터 외형, {name} = 이름)"));
    const ta = el("textarea");
    ta.setAttribute("data-gfx-tpl", "");
    ta.value = prefs.gen.template;
    on(ta, "change", () => { prefs.gen.template = ta.value.trim() || DEFAULT_GEN.template; savePrefs(); });
    on(ta, "click", (e) => e.stopPropagation());
    tpl.append(ta);
    const neg = el("label", "gfx-field");
    neg.append(el("span", "", "네거티브 프롬프트"));
    const nta = el("textarea");
    nta.setAttribute("data-gfx-neg", "");
    nta.style.minHeight = "2.4em";
    nta.value = prefs.gen.negative;
    on(nta, "change", () => { prefs.gen.negative = nta.value.trim(); savePrefs(); });
    on(nta, "click", (e) => e.stopPropagation());
    neg.append(nta);
    const sizes = el("div", "st-chips");
    sizes.style.marginTop = ".7em";
    for (const [s, label] of SIZES) sizes.append(chip(label, () => { prefs.gen.size = s; savePrefs(); paintSettings(); }, { "data-gfx-size": s }));
    sizes.append(chip("프롬프트 기본값", () => { prefs.gen.template = DEFAULT_GEN.template; prefs.gen.negative = DEFAULT_GEN.negative; savePrefs(); paintSettings(true); }));
    const all = el("div", "st-chips");
    all.style.marginTop = ".7em";
    all.append(chip("없는 캐릭터 전부 그리기", () => makeAll(), { "data-gfx-all": "" }),
      chip("갤러리에서 되찾기", () => recoverSd(false)),
      chip("대사 만들기 (AI)", () => makeLines(false), { "data-gfx-lines": "" }),
      chip("없는 대사만", () => makeLines(true), { "data-gfx-lines": "" }));
    const list = el("div", "gfx-sd-list");
    list.setAttribute("data-gfx-sd-list", "");
    const edit = el("div", "gfx-sd-edit");
    edit.setAttribute("data-gfx-sd-edit", "");
    edit.hidden = true;
    p.append(conn, tpl, neg, sizes, all, hint("", "sd"),
      hint("[대사 만들기]는 이 세계의 AI 연결로 캐릭터마다 성격에 맞는 로비 대사 3개와 볼 꼬집기 반응을 씁니다. 캐릭터의 [편집]에서 볼 위치와 대사를 고칩니다."), list, edit);
    return p;
  }

  function paintSdList(root) {
    const w = world();
    for (const list of root.querySelectorAll("[data-gfx-sd-list]")) {
      const cards = w ? w.cards : [];
      const keyNow = sdEditing + "/" + cards.map((c) => c.name + ":" + (w.sd[c.name]?.url || "") + ":" + JSON.stringify(w.sd[c.name]?.variants || {}) + ":" + (w.busy.has(c.name) ? 1 : 0) + ":" + (w.sd[c.name]?.ally ? 1 : 0)).join("|");
      if (list.getAttribute("data-key") === keyNow) continue;
      list.setAttribute("data-key", keyNow);
      list.textContent = "";
      for (const c of cards) {
        const card = el("div", "gfx-sd-card");
        if (w.busy.has(c.name)) card.setAttribute("data-busy", "");
        const thumb = el("div", "gfx-sd-thumb");
        const url = w.sd[c.name]?.url;
        const img = el("img", url ? "" : "portrait");
        img.alt = "";
        if (url || c.portrait) img.src = url || c.portrait;
        thumb.append(img);
        const chips = el("div", "st-chips");

        chips.append(chip("편집", () => { sdEditing = sdEditing === c.name ? "" : c.name; sdEditKey = ""; sdEditLook = ""; paintSettings(); }, { "aria-pressed": String(sdEditing === c.name) }));
        // Stands with the protagonist in the story line-up (the left group) instead of across from them.
        if (c.name !== protagonistName()) chips.append(chip("주인공 옆", async () => { await saveSdEntry(c.name, { ally: !w.sd[c.name]?.ally }); paintSettings(); refresh(); }, { "aria-pressed": String(!!w.sd[c.name]?.ally), title: "스토리에서 주인공 쪽에 살짝 겹쳐 섭니다" }));
        const title = el("b", "", c.name);
        if (c.extra) { card.setAttribute("data-extra", ""); title.append(el("small", "gfx-extra-tag", "스토리 등장")); }
        card.append(thumb, title, chips);
        list.append(card);
      }
    }
    paintSdEditor(root);
  }

  /* ── One character's editor: cheek points on the sprite, its three lines and its pinch reaction ── */
  // linesRev moves when the AI rewrites lines, so the editor shows them; typing never rebuilds it.
  let sdEditing = "", sdEditKey = "", sdEditLook = "", sdEditTab = "pose", linesRev = 0;
  function paintSdEditor(root) {
    const w = world();
    const c = w && w.cards.find((x) => x.name === sdEditing);
    for (const box of root.querySelectorAll("[data-gfx-sd-edit]")) {
      const e = c ? sdEntry(c.name) : {};
      if (c) loadUnitDetails(c, w);
      const allOutfits = c ? Array.from(w.outfits.get(c.name) || []) : [];
      const madeLooks = allOutfits.filter((k) => sdVariant(e, k)?.url);
      const look = allOutfits.includes(sdEditLook) ? sdEditLook : "";
      const lookUrl = look ? sdVariant(e, look)?.url : e.url;
      const lookName = (k) => w.details.get(c.name)?.outfits?.find((o) => pathOf(o.url) === k)?.name || "의상 " + (allOutfits.indexOf(k) + 1);
      const key = c ? [c.name, look, e.url || "", JSON.stringify(e.variants || {}), JSON.stringify(e.history || []), e.lobby || "", Array.from(w.outfits.get(c.name) || []).join(","), JSON.stringify(e.cheeks || []), cheekR(c.name), faceOf(c.name), e.tall || 1, JSON.stringify(w.details.get(c.name) || {}), linesRev].join("|") : "";
      if (box.getAttribute("data-key") === key) continue;
      box._gfxMarkerRO?.disconnect();
      box._gfxMarkerRO = null;
      box.setAttribute("data-key", key);
      box.textContent = "";
      box.hidden = !c;
      if (!c) { if (box.matches(":popover-open")) box.hidePopover(); continue; }
      box.setAttribute("popover", "manual");
      const pad = el("div", "gfx-cheek-pad");
      const content = el("div", "gfx-sd-edit-content");
      const header = el("div", "gfx-sd-edit-header");
      const close = () => { sdEditing = ""; paintSettings(); };
      header.append(el("b", "", c.name + " · SD 편집"), chip("닫기 ×", close));
      const nav = el("div", "gfx-sd-edit-tabs");
      nav.setAttribute("role", "tablist");
      const panels = {};
      const tabs = [["pose", "볼·배치"], ["wardrobe", "의상·보관함"], ["prompt", "프롬프트"], ["lines", "대사"]];
      const selectTab = (id) => {
        sdEditTab = id; box.dataset.editTab = id;
        for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== id;
        for (const b of nav.children) { const active = b.dataset.tab === id; b.setAttribute("aria-selected", String(active)); b.tabIndex = active ? 0 : -1; }
      };
      for (const [id, label] of tabs) {
        const panel = el("div", "gfx-sd-edit-side"); panel.dataset.panel = id;
        panel.id = "gfx-sd-panel-" + id; panel.setAttribute("role", "tabpanel");
        panels[id] = panel;
        const b = chip(label, () => selectTab(id)); b.dataset.tab = id;
        b.id = "gfx-sd-tab-" + id; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", b.id);
        on(b, "keydown", (ev) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
          ev.preventDefault(); ev.stopPropagation();
          const index = tabs.findIndex(([key]) => key === id);
          const next = ev.key === "Home" ? 0 : ev.key === "End" ? 3 : (index + (ev.key === "ArrowRight" ? 1 : 3)) % 4;
          selectTab(tabs[next][0]); nav.children[next].focus();
        });
        nav.append(b); content.append(panel);
      }
      const lookBar = el("div", "gfx-sd-look-bar");
      const selector = el("select"); selector.setAttribute("aria-label", "편집할 의상");
      for (const k of ["", ...allOutfits]) { const option = el("option", "", k ? lookName(k) : "기본 의상"); option.value = k; selector.append(option); }
      selector.value = look;
      on(selector, "change", () => { sdEditLook = selector.value; paintSettings(); });
      lookBar.append(selector);
      box.append(header, lookBar, nav, pad, content);
      box.onkeydown = (ev) => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); } };
      selectTab(sdEditTab);
      let side = panels.pose;
      if (lookUrl) {
        const img = el("img");
        img.src = lookUrl;
        img.alt = c.name;
        img.draggable = false;
        pad.append(img);
        const marks = () => {
          for (const m of pad.querySelectorAll(".mark")) m.remove();
          for (const p of cheeksOf(c.name, look) || []) {
            const m = el("i", "mark");
            m.style.cssText = "left:" + (img.offsetLeft + p.x * img.offsetWidth) + "px;top:" + (img.offsetTop + p.y * img.offsetHeight) + "px;width:" + cheekR(c.name, look) * 2 * img.offsetWidth + "px";
            pad.append(m);
          }
        };
        if (img.complete) requestAnimationFrame(marks); else img.addEventListener("load", marks, { once: true });
        const markerRO = new ResizeObserver(marks);
        markerRO.observe(pad);
        box._gfxMarkerRO = markerRO;
        let pinched = false;
        on(pad, "pointerdown", (ev) => {
          ev.stopPropagation();
          if (pad.dataset.mode === "preview") pinched = startPinch(img, ev, cheeksOf(c.name, look), cheekR(c.name, look), pad, (pulled) => { if (pulled) setEditNote(pinchFor(c.name)); }, false);
        });
        on(pad, "click", (ev) => {
          ev.stopPropagation();
          if (pinched || pad.dataset.mode === "preview") { pinched = false; return; }
          const r = img.getBoundingClientRect();
          const p = { x: +((ev.clientX - r.left) / r.width).toFixed(3), y: +((ev.clientY - r.top) / r.height).toFixed(3) };
          if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return;
          const now = (cheeksOf(c.name, look) || []).slice();
          // Two cheeks at most: a third tap moves the nearer one.
          if (now.length >= 2) now.splice(now.findIndex((q, i, a) => Math.hypot(q.x - p.x, q.y - p.y) === Math.min(...a.map((z) => Math.hypot(z.x - p.x, z.y - p.y)))), 1, p);
          else now.push(p);
          saveLook(c.name, look, { cheeks: now });
          sdEditKey = "";
          paintSettings();
        });
      } else pad.append(el("p", "hint", "먼저 SD를 그려 주세요."));
      const mode = chip("볼 위치 편집 · 당기기 미리보기로 전환", () => {
        const preview = pad.dataset.mode !== "preview";
        pad.dataset.mode = preview ? "preview" : "edit";
        mode.textContent = preview ? "당기기 미리보기 · 볼 위치 편집으로 전환" : "볼 위치 편집 · 당기기 미리보기로 전환";
      });
      side.append(mode, hint("선택한 의상에만 저장됩니다. 그림을 눌러 볼 두 곳을 지정하거나 옮기세요.", ""));
      const size = el("div", "st-chips");
      for (const [r, label] of [[0.025, "볼 작게"], [0.04, "보통"], [0.055, "볼 크게"]]) {
        const b = chip(label, () => { saveLook(c.name, look, { cheekR: r }); sdEditKey = ""; paintSettings(); });
        b.setAttribute("aria-pressed", String(Math.abs(cheekR(c.name, look) - r) < 0.001));
        size.append(b);
      }
      size.append(chip("볼 지우기", () => saveLook(c.name, look, { cheeks: [] }).then(() => paintSettings())));
      side.append(size);
      side.append(hint("그림 속 캐릭터가 바라보는 쪽", ""));
      const face = el("div", "st-chips");
      for (const [f, label] of [["left", "← 왼쪽을 봄"], ["front", "정면"], ["right", "오른쪽을 봄 →"]]) {
        const b = chip(label, () => saveSdEntry(c.name, { face: f }).then(() => { paintSettings(); refresh(); }));
        b.setAttribute("aria-pressed", String(faceOf(c.name) === f));
        face.append(b);
      }
      side.append(face);
      side.append(hint("키", ""));
      const tall = el("div", "st-chips");
      for (const [t, label] of [[0.8, "작게"], [0.9, "조금 작게"], [1, "보통"], [1.15, "크게"]]) {
        const b = chip(label, () => saveSdEntry(c.name, { tall: t }).then(() => { paintSettings(); refreshSprites(); }));
        b.setAttribute("aria-pressed", String(Math.abs((Number(e.tall) || 1) - t) < 0.001));
        tall.append(b);
      }
      side.append(tall);
      side = panels.wardrobe;
      const outfits = Array.from(w.outfits.get(c.name) || []);
      const outfitName = (key, i) => w.details.get(c.name)?.outfits?.find((o) => pathOf(o.url) === key)?.name || "의상 " + (i + 1);
      // The SD vault: the drawing in use and earlier ones, for the base look and each outfit. Tap one to use it.
      const vault = (label, key) => {
        const ent = key ? sdVariant(e, key) : e;
        if (!ent?.url) return;
        const urls = [ent.url, ...(ent.history || []).map((h) => h.url)].filter((u, i, a) => u && a.indexOf(u) === i);
        const row = el("div", "gfx-sd-vault");
        urls.forEach((u, i) => {
          const b = el("button", "gfx-sd-pick");
          b.type = "button";
          b.setAttribute("aria-pressed", String(i === 0));
          b.title = i === 0 ? "지금 쓰는 SD" : "이 SD로 바꾸기";
          const im = el("img");
          im.src = u; im.alt = ""; im.loading = "lazy"; im.draggable = false;
          b.append(im);
          on(b, "click", (ev) => { ev.stopPropagation(); if (i) useSd(c.name, key, u); });
          if (i) {
            const x = el("span", "x", "×");
            x.title = "보관함에서 빼기";
            on(x, "click", (ev) => { ev.stopPropagation(); dropSd(c.name, key, u); });
            b.append(x);
          }
          row.append(b);
        });
        side.append(hint(label + (urls.length > 1 ? " — 눌러서 바꾸기" : ""), ""), row);
      };
      vault("SD 보관함 · " + (look ? lookName(look) : "기본"), look);
      side.append(chip("선택한 의상 SD " + (lookUrl ? "다시 그리기" : "만들기"), () => makeSd(c, look)));
      const madeOutfits = outfits.filter((key) => sdVariant(e, key)?.url);
      if (madeOutfits.length && e.url) {
        side.append(hint("로비에서 입을 옷", ""));
        const lob = el("div", "st-chips");
        const pick = (key, label) => { const b = chip(label, () => saveSdEntry(c.name, { lobby: key }).then(() => { paintSettings(); refresh(); })); b.setAttribute("aria-pressed", String((e.lobby || "") === key)); lob.append(b); };
        pick("", "기본");
        madeOutfits.forEach((key) => pick(key, outfitName(key, outfits.indexOf(key))));
        side.append(lob);
      }
      if (outfits.length) {
        side.append(hint("의상별 SD", ""));
        const variants = el("div", "st-chips");
        outfits.filter((key) => key === look).forEach((variantKey, i) => {
          const exists = !!e.variants?.[variantKey];
          const outfit = w.details.get(c.name)?.outfits?.find((o) => pathOf(o.url) === variantKey);
          variants.append(chip((outfit?.name || "의상 " + (i + 1)) + (exists ? " 다시 그리기" : " 만들기"), () => makeSd(c, variantKey)));
          if (exists) variants.append(chip("의상 " + (i + 1) + " 지우기", () => removeSdVariant(c.name, variantKey)));
        });
        side.append(variants);
      }
      const field = (label, value, save, maxLength = 60) => {
        const lab = el("label", "gfx-field");
        lab.append(el("span", "", label));
        const input = el(maxLength > 100 ? "textarea" : "input");
        if (maxLength <= 100) input.type = "text";
        input.maxLength = maxLength;
        input.value = value || "";
        on(input, "click", (ev) => ev.stopPropagation());
        on(input, "keydown", (ev) => ev.stopPropagation());
        on(input, "change", () => save(input.value.trim()));
        lab.append(input);
        return lab;
      };
      side = panels.prompt;
      const imageActions = el("div", "st-chips gfx-prompt-actions");
      imageActions.append(chip(lookUrl ? "선택한 이미지 다시 생성" : "선택한 이미지 생성", () => makeSd(c, look)));
      const fileInput = el("input"); fileInput.type = "file"; fileInput.accept = "image/*"; fileInput.hidden = true;
      on(fileInput, "change", () => { const f = fileInput.files?.[0]; fileInput.value = ""; if (f) uploadSd(c, look, f); });
      imageActions.append(chip("이미지 업로드", () => fileInput.click()), fileInput);
      if (lookUrl) imageActions.append(chip("선택한 이미지 제거", async () => { await saveLook(c.name, look, { url: "", imageRemoved: true }); paintSettings(); refreshSprites(); }));
      side.append(imageActions);
      side.append(field("캐릭터 외형 프롬프트", e.appearance || w.details.get(c.name)?.appearance, (v) => saveSdEntry(c.name, { appearance: v }).then(() => { linesRev++; paintSettings(); setEditNote("저장했습니다", true); }), 4000));
      side.append(field("선택한 모습의 SD 생성 프롬프트 (비우면 자동 구성)", sdPrompt(c, w.details.get(c.name) || {}, look),
        (v) => saveLook(c.name, look, { prompt: v }).then(() => setEditNote("생성 프롬프트를 저장했습니다", true)), 12000));
      side = panels.lines;
      side.append(chip("이 캐릭터 대사 전체 재생성", () => makeLines(false, c.name)));
      const lines = Array.isArray(e.lines) ? e.lines.slice(0, 3) : [];
      for (let i = 0; i < 3; i++) {
        side.append(chip("대사 " + (i + 1) + " 재생성", () => makeLines(false, c.name, i)));
        side.append(field("대사 " + (i + 1), lines[i], (v) => { const next = (sdEntry(c.name).lines || []).slice(0, 3); while (next.length < 3) next.push(""); next[i] = v; saveSdEntry(c.name, { lines: next }).then(() => setEditNote(lastStoreError ? "이 브라우저에 보관, 서버 저장은 다시 시도합니다 (" + lastStoreError + ")" : "저장했습니다", true)); }));
      }
      side.append(chip("볼 반응 재생성", () => makeLines(false, c.name, "pinch")));
      side.append(field("볼을 꼬집혔을 때", e.pinch, (v) => saveSdEntry(c.name, { pinch: v }).then(() => setEditNote(lastStoreError ? "이 브라우저에 보관, 서버 저장은 다시 시도합니다 (" + lastStoreError + ")" : "저장했습니다", true))));
      let lineRow = 2;
      for (const node of panels.lines.children) {
        if (node === panels.lines.firstElementChild) continue;
        node.style.gridRow = String(lineRow);
        if (node.classList.contains("gfx-field")) lineRow++;
      }
      const note = hint("", "");
      note.setAttribute("data-gfx-edit-note", "");
      content.append(note);
      if (typeof box.showPopover === "function" && !box.matches(":popover-open")) box.showPopover();
      placeSdEditor();
    }
  }
  /* The editor is not a separate full-window popup: it fills the game's own area below its top bar. It stays in
   * the top layer (so the game's header cannot cover it) and follows the game's box as it moves or resizes. */
  function placeSdEditor() {
    const h = host(), root = gameRoot();
    const boxes = root?.querySelectorAll("[data-gfx-sd-edit]:not([hidden])");
    if (!h || !boxes?.length) return;
    const game = h.getBoundingClientRect(), bar = root.querySelector(".gf-bar")?.getBoundingClientRect();
    const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const top = Math.max(0, bar && bar.height ? bar.bottom : game.top), left = Math.max(0, game.left);
    const right = Math.max(0, vw - Math.min(vw, game.right)), bottom = Math.max(0, vh - Math.min(vh, game.bottom));
    const inset = Math.round(top + 6) + "px " + Math.round(right + 6) + "px " + Math.round(bottom + 6) + "px " + Math.round(left + 6) + "px";
    for (const box of boxes) {
      if (box.style.getPropertyValue("inset") === inset) continue;
      box.style.setProperty("inset", inset, "important");
      for (const p of ["width", "height", "max-width", "max-height"]) box.style.setProperty(p, "auto", "important");
    }
  }
  // A spoken line shows in quotes; a save status (plain) does not.
  function setEditNote(text, plain = false) {
    for (const n of gameRoot()?.querySelectorAll("[data-gfx-edit-note]") || []) n.textContent = plain ? text : "“" + text + "”";
  }

  function paintSettings(full = false) {
    const root = gameRoot();
    if (!root) return;
    for (const b of root.querySelectorAll("[data-gfx-preset]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-gfx-preset") === prefs.preset));
    for (const b of root.querySelectorAll("[data-gfx-cast]")) b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-gfx-cast")) === castMax()));
    for (const i of root.querySelectorAll("[data-gfx-color]")) { const v = prefs.colors[i.getAttribute("data-gfx-color")]; if (i.value.toUpperCase() !== v) i.value = v; }
    for (const b of root.querySelectorAll("[data-gfx-opt]")) b.setAttribute("aria-pressed", String(!!prefs.opts[b.getAttribute("data-gfx-opt")]));
    for (const b of root.querySelectorAll("[data-gfx-size]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-gfx-size") === prefs.gen.size));
    for (const select of root.querySelectorAll("[data-gfx-font-select]")) select.value = prefs.font;
    for (const r of root.querySelectorAll("[data-gfx-box-alpha]")) if (r !== root.activeElement && r.value !== String(prefs.boxOpacity)) { r.value = String(prefs.boxOpacity); r.nextElementSibling.textContent = prefs.boxOpacity + "%"; }
    const fontText = fonts.status === "loading" ? "글꼴 목록을 확인하는 중입니다."
      : fonts.status === "ok" ? "설치된 글꼴 중에서 선택할 수 있습니다."
      : fonts.status === "fetching" ? "Google Fonts에서 글꼴을 받는 중입니다…"
      : fonts.status === "error" ? "글꼴 목록을 읽지 못했습니다. 지금은 맑은 고딕으로 보입니다."
      : "둥근 글꼴(" + fonts.missing.join(" · ") + ")이 아직 없어서 맑은 고딕으로 보입니다. [글꼴 받기]를 누르면 Marinara 글꼴 보관함(data/fonts)에 내려받습니다.";
    for (const n of root.querySelectorAll('[data-gfx-note="fonts"]')) n.textContent = fonts.note ? fonts.note + " " + fontText : fontText;
    for (const b of root.querySelectorAll("[data-gfx-font-get]")) { b.style.display = fonts.status === "ok" ? "none" : ""; b.disabled = fonts.status === "fetching" || fonts.status === "loading"; }
    for (const sel of root.querySelectorAll("[data-gfx-conn]")) {
      const list = connections || [];
      const fallback = host()?._run?.images?.connectionId || "";
      const chosen = list.some((c) => c.id === prefs.gen.connectionId) ? prefs.gen.connectionId : list.some((c) => c.id === fallback) ? fallback : list[0]?.id || "";
      if (full || sel.options.length !== list.length) {
        sel.textContent = "";
        for (const c of list) { const o = el("option", "", c.name + (c.id === fallback ? " (이 세계 기본)" : "")); o.value = c.id; sel.append(o); }
      }
      if (sel.value !== chosen) sel.value = chosen;
    }
    if (full) {
      for (const t of root.querySelectorAll("[data-gfx-tpl]")) t.value = prefs.gen.template;
      for (const t of root.querySelectorAll("[data-gfx-neg]")) t.value = prefs.gen.negative;
    }
    const w = world();
    const sdText = !runId() ? "세계를 연 뒤에 그릴 수 있습니다."
      : !w || w.state === "loading" || w.state === "new" ? "캐릭터 목록을 불러오는 중입니다."
      : w.state === "error" ? w.note
      : !(connections || []).length ? "이미지 생성 연결이 없습니다. Marinara 연결 설정에서 이미지 연결을 먼저 만들어 주세요."
      : (w.note ? w.note + " " : "") + w.cards.length + "명 중 " + w.cards.filter((c) => w.sd[c.name]?.url).length + "명의 SD가 있습니다.";
    for (const n of root.querySelectorAll('[data-gfx-note="sd"]')) n.textContent = sdText;
    for (const b of root.querySelectorAll("[data-gfx-all]")) b.disabled = !w || w.state !== "ready" || w.busy.size > 0 || !(connections || []).length;
    for (const b of root.querySelectorAll("[data-gfx-lines]")) b.disabled = !w || w.state !== "ready" || linesBusy;
    paintSdList(root);
    paintHomeList(root);
  }

  /* ── Drawing SD sprites ── */
  function dataUrlToBlob(dataUrl) {
    const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl || "");
    if (!m) throw Error("이미지 데이터가 아닙니다");
    const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: m[1] });
  }
  const extOf = (mime) => (/png/.test(mime) ? ".png" : /webp/.test(mime) ? ".webp" : /jpe?g/.test(mime) ? ".jpg" : ".png");
  // One drawing at a time across every button: a second request waits its turn, then its own 3–7s.
  let genChain = Promise.resolve();
  function sdPrompt(card, unit, look = "") {
    const entry = sdEntry(card.name);
    const override = (look ? sdVariant(entry, look) : entry)?.prompt;
    if (override) return override;
    const outfit = look && unit?.outfits?.find((o) => o.url && pathOf(o.url) === pathOf(look));
    if (look && !outfit) return "";
    const appearance = String(outfit?.prompt || [entry.appearance || unit?.appearance, outfit?.outfitLine, ...(outfit?.outfitTags || [])].filter(Boolean).join(", ")).trim();
    return appearance ? prefs.gen.template.replace(/\{appearance\}/g, appearance).replace(/\{name\}/g, card.name).replace(/\s+/g, " ").trim() : "";
  }
  async function makeSd(card, variantKey = "") {
    const w = world();
    if (!w || w.busy.has(card.name)) return;
    const connId = gameRoot()?.querySelector("[data-gfx-conn]")?.value || prefs.gen.connectionId || host()?._run?.images?.connectionId || "";
    const conn = (connections || []).find((c) => c.id === connId);
    if (!conn) { w.note = "이미지 연결을 골라 주세요."; paintSettings(); return; }
    w.busy.add(card.name);
    w.note = "";
    paintSettings();
    const before = genChain;
    let release = () => {};
    genChain = new Promise((res) => { release = res; });
    try {
      w.note = card.name + " — 앞의 그림을 기다리는 중…";
      paintSettings();
      await before;
      if (disposed) return;
      // A random 3–7s wait before each request, so a batch of SDs is not fired at the image service back to back.
      const wait = 3000 + Math.round(Math.random() * 4000);
      w.note = card.name + " — " + (wait / 1000).toFixed(1) + "초 뒤에 그립니다.";
      paintSettings();
      await new Promise((res) => setTimeout(res, wait));
      if (disposed) return;
      w.note = card.name + " 그리는 중…";
      paintSettings();
      const u = { unit: await unitOf(card, w) };
      const prompt = sdPrompt(card, u.unit, variantKey);
      if (!prompt) throw Error("외형 정보가 없습니다. SD 편집에서 생성 프롬프트를 입력해 주세요.");
      const [width, height] = prefs.gen.size.split("x").map(Number);
      const res = await fetch("/api/characters/avatar-generation", {
        method: "POST", credentials: "same-origin", headers: JSON_HEADERS,
        body: JSON.stringify({
          connectionId: conn.id, name: "gfx-sd", appearance: prompt, purpose: "avatar", width, height,
          promptOverrides: [{ id: "avatar:gfx-sd", prompt, negativePrompt: prefs.gen.negative }],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.image) throw Error((data && data.error) || "HTTP " + res.status);
      await storeSdImage(w, card, variantKey, dataUrlToBlob(data.image), prompt, conn.model || "unknown", width, height);
    } catch (e) {
      w.note = card.name + " 그리기 실패: " + e.message;
    } finally {
      release();
      w.busy.delete(card.name);
      refresh();
    }
  }
  // A picture the player picked from their device, saved like a drawn one (gallery tags included, so recovery finds it).
  async function uploadSd(card, variantKey, file) {
    const w = world();
    if (!w || !file || w.busy.has(card.name)) return;
    if (!file.type.startsWith("image/")) { w.note = "이미지 파일을 골라 주세요."; paintSettings(); return; }
    w.busy.add(card.name);
    w.note = card.name + " SD 올리는 중…";
    paintSettings();
    try {
      let width = 0, height = 0;
      try { const bmp = await createImageBitmap(file); width = bmp.width; height = bmp.height; bmp.close(); } catch {}
      await storeSdImage(w, card, variantKey, file, "uploaded SD", "upload", width, height);
      if (w.note === card.name + " SD 올리는 중…") w.note = "";
    } catch (e) {
      w.note = card.name + " SD 올리기 실패: " + e.message;
    } finally {
      w.busy.delete(card.name);
      refresh();
    }
  }
  async function storeSdImage(w, card, variantKey, blob, prompt, model, width, height) {
      const form = new FormData();
      form.append("prompt", "[gfx-world:" + encodeURIComponent(w.id) + "] [gfx-character:" + encodeURIComponent(card.name) + "] [gfx-look:" + encodeURIComponent(variantKey) + "] " + prompt);
      form.append("provider", "image_generation");
      form.append("model", model);
      if (width) form.append("width", String(width));
      if (height) form.append("height", String(height));
      form.append("file", blob, "gfx-sd" + extOf(blob.type));
      const up = await fetch("/api/global-gallery/upload", { method: "POST", credentials: "same-origin", headers: CSRF, body: form });
      const saved = await up.json().catch(() => null);
      if (!up.ok || !saved || !saved.url) throw Error((saved && saved.error) || "갤러리 저장 실패 (HTTP " + up.status + ")");
      const old = w.sd[card.name] || {};
      // The drawing it replaces goes into the vault (newest first, 8 at most); lines and cheeks stay as they were.
      const prevOf = (ent) => [ent?.url ? { url: ent.url, at: ent.at || 0 } : null, ...(ent?.history || [])].filter((h) => h && h.url && h.url !== saved.url).slice(0, 8);
      const oldVariant = variantKey ? sdVariant(old, variantKey) : null;
      const next = variantKey
        ? { ...old, variants: { ...(old.variants || {}), [variantKey]: { ...oldVariant, url: saved.url, imageRemoved: false, at: Date.now(), history: prevOf(oldVariant) } } }
        : { ...old, url: saved.url, imageRemoved: false, at: Date.now(), history: prevOf(old) };
      w.sd = { ...w.sd, [card.name]: { ...next, _editedAt: Date.now(), _deleted: false } };
      if (!(await storePatch({ ["sd:" + w.id]: w.sd }))) w.note = "그림은 갤러리에 저장했고 이 브라우저에 보관했습니다. 서버 기록은 다시 시도합니다 (" + lastStoreError + ").";
  }
  /* An SD this extension drew is in the gallery with its prompt, which holds the character's appearance text;
   * that is enough to tell whose it is. The newest picture wins. */
  function galleryMatchesWorld(g, id, name) {
    const prompt = String(g?.prompt || "");
    return prompt.includes("[gfx-world:" + encodeURIComponent(id) + "]") && prompt.includes("[gfx-character:" + encodeURIComponent(name) + "]") && prompt.includes("[gfx-look:]");
  }
  let recovering = false;
  async function recoverSd(quiet) {
    const w = world();
    if (!w || recovering) return;
    recovering = true;
    try {
      const list = await fetch("/api/global-gallery", { credentials: "same-origin" }).then((r) => r.json());
      const ours = (Array.isArray(list) ? list : []).filter((g) => g && g.url && /chibi only|Transparent background/i.test(g.prompt || ""))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      if (!ours.length) { if (!quiet) w.note = "갤러리에서 SD를 찾지 못했습니다."; return; }
      const want = w.cards.filter((c) => !w.sd[c.name]?.url && !w.sd[c.name]?._deleted && !w.sd[c.name]?.imageRemoved);
      const found = {};
      want.forEach((c) => {
        const hit = ours.find((g) => galleryMatchesWorld(g, w.id, c.name));
        if (hit) found[c.name] = { ...(w.sd[c.name] || {}), url: hit.url, at: Date.parse(hit.createdAt) || Date.now() };
      });
      const n = Object.keys(found).length;
      if (n) {
        w.sd = { ...w.sd, ...found };
        const ok = await storePatch({ ["sd:" + w.id]: w.sd });
        w.note = "갤러리에서 SD " + n + "개를 되찾았습니다." + (ok ? "" : " (서버 기록은 다시 시도합니다: " + lastStoreError + ")");
      } else if (!quiet) w.note = "이 세계 ID가 기록된 SD를 찾지 못했습니다. 이전 이미지는 다른 세계와 혼동될 수 있어 자동 복구하지 않습니다.";
    } catch (e) {
      if (!quiet) w.note = "되찾기 실패: " + e.message;
    } finally {
      recovering = false;
      refresh();
    }
  }
  async function makeAll() {
    const w = world();
    if (!w) return;
    for (const c of w.cards.filter((c) => !w.sd[c.name]?.url)) {
      if (disposed || !current) break;
      await makeSd(c);
    }
  }
  async function removeSd(name) {
    const w = world();
    if (!w) return;
    const next = { ...w.sd };
    next[name] = { _deleted: true, _editedAt: Date.now(), url: "", variants: {}, history: [] };
    w.sd = next;
    await storePatch({ ["sd:" + w.id]: w.sd });
    refresh();
  }
  async function removeSdVariant(name, variantKey) {
    const w = world(), old = w?.sd[name];
    if (!w || !old) return;
    const variants = { ...(old.variants || {}) };
    delete variants[variantKey];
    w.sd = { ...w.sd, [name]: { ...old, variants, _editedAt: Date.now() } };
    await storePatch({ ["sd:" + w.id]: w.sd });
    sdEditKey = "";
    refresh();
  }

  // While one of ours is on, the game's own cards all read unpressed and ours reads pressed.
  function paintCards(root) {
    for (const list of root.querySelectorAll(".st-styles")) {
      for (const b of list.querySelectorAll("[data-gfx-set]")) b.setAttribute("aria-pressed", String(b.getAttribute("data-gfx-set") === current));
      if (current) for (const b of list.querySelectorAll("[data-style-set]")) if (b.getAttribute("aria-pressed") !== "false") b.setAttribute("aria-pressed", "false");
    }
  }
  const boundLists = new WeakSet();
  function mountSettings(root) {
    for (const list of root.querySelectorAll(".st-styles")) {
      if (!list.querySelector("[data-gfx-set]")) list.append(...STYLES.map(makeCard));
      if (!boundLists.has(list)) {
        boundLists.add(list);
        // Any of the game's cards hands the look back to the game; the game then saves its pick as usual.
        on(list, "click", (e) => {
          if (disposed || !e.target.closest?.("[data-style-set]") || !current) return;
          current = "";
          writeStyle("");
          refresh();
        }, { capture: true });
      }
    }
    mountTab(root);
    paintCards(root);
  }
  /* 말랑's own settings live in a tab of their own in the settings rail (next to 화면), not inside 화면: the
   * tab opens a panel with the colours, screens, options and the SD list, and hides the game's panel while
   * open. Any of the game's tabs closes it again. The style itself is still picked in 화면 → UI 스타일. */
  let malangOpen = false;
  const boundRails = new WeakSet();
  function mountTab(root) {
    const rail = root.querySelector(".st-rail"), pane = root.querySelector(".st-pane");
    if (!rail || !pane) { malangOpen = false; return; }
    let tab = rail.querySelector(":scope > [data-gfx-tab]");
    if (!current) {
      tab?.remove();
      malangOpen = false;
    } else if (!tab) {
      tab = el("button", "st-sect");
      tab.type = "button";
      tab.setAttribute("role", "tab");
      tab.setAttribute("data-gfx-tab", "");
      tab.setAttribute("data-gfx-ui", "");
      tab.append(el("span", "k", "말랑"), el("span", "n", "UI·SD"));
      on(tab, "click", (e) => { e.stopPropagation(); malangOpen = true; const p = gameRoot()?.querySelector(".st-pane"); if (p) p.scrollTop = 0; refresh(); });
      const visual = rail.querySelector('[data-view="visual"]');
      if (visual) visual.after(tab); else rail.append(tab);
    }
    if (!boundRails.has(rail)) {
      boundRails.add(rail);
      on(rail, "click", (e) => {
        const sect = e.target.closest?.(".st-sect");
        if (!sect || sect.hasAttribute("data-gfx-tab") || !malangOpen) return;
        malangOpen = false;
        mountTab(gameRoot());
      }, { capture: true });
    }
    let view = pane.querySelector(":scope > .gfx-view");
    if (current && malangOpen) {
      if (!view) {
        view = el("div", "gfx-view");
        view.setAttribute("data-gfx-ui", "");
        view.setAttribute("data-gfx-settings-view", settingsView);
        view.append(settingsNav(view), colorPlate(), screenPlate(), optionPlate(), sdPlate());
        pane.append(view);
        loadConnections();
        loadWorld();
        paintSettings(true);
      }
      if (!pane.hasAttribute("data-gfx-tab-open")) pane.setAttribute("data-gfx-tab-open", "");
      // The header names the open tab.
      const title = root.querySelector(".head-id h2");
      if (title && title.textContent !== "말랑 설정") { title.setAttribute("data-gfx-title", title.textContent); title.textContent = "말랑 설정"; }
      for (const s of rail.querySelectorAll(":scope > .st-sect")) { const want = String(s === tab); if (s.getAttribute("aria-selected") !== want) s.setAttribute("aria-selected", want); }
    } else {
      const wasOpen = !!view || pane.hasAttribute("data-gfx-tab-open");
      const title = root.querySelector(".head-id h2[data-gfx-title]");
      if (title) { if (title.textContent === "말랑 설정") title.textContent = title.getAttribute("data-gfx-title"); title.removeAttribute("data-gfx-title"); }
      view?.remove();
      if (pane.hasAttribute("data-gfx-tab-open")) pane.removeAttribute("data-gfx-tab-open");
      if (tab && tab.getAttribute("aria-selected") !== "false") tab.setAttribute("aria-selected", "false");
      // Hand the highlight back to the game's tab for the panel now showing (it does not redraw for a tab it
      // already had open).
      if (wasOpen && !rail.querySelector(':scope > .st-sect[aria-selected="true"]')) {
        rail.querySelector(':scope > .st-sect[data-view="' + (pane.getAttribute("data-view-body") || "") + '"]')?.setAttribute("aria-selected", "true");
      }
    }
  }

  /* ═════════════ Following the game ═════════════ */
  let observed = null, observer = null, scheduled = false, lastRun = "";
  const PERF = (() => { try { return localStorage.getItem("gfx-debug") === "1"; } catch { return false; } })();
  if (PERF) window.__gfxPerf = { n: 0, total: 0, max: 0, slow: [] };
  function refresh() {
    if (!PERF) return refreshBody();
    const t0 = performance.now();
    refreshBody();
    const dt = performance.now() - t0, p = window.__gfxPerf;
    p.n++; p.total += dt; p.max = Math.max(p.max, dt);
    if (dt > 8) p.slow.push([Math.round(dt), host()?._hudView]);
    if (p.slow.length > 40) p.slow.shift();
  }
  function refreshBody() {
    if (disposed) return;
    lastRefreshAt = performance.now();
    apply();
    const root = gameRoot();
    if (!root) return;
    const id = runId();
    if (id !== lastRun) { lastRun = id; roam.clear(); if (current) loadWorld(); }
    if (root.querySelector(".st-rail, .st-styles, [data-gfx-plate]")) {
      mountSettings(root);
      paintSettings();
    }
    paintSprites(root);
    perfStep("rest");
    ensureLoadMounted();
  }
  // Right away (a whole new screen); a burst of these within one task runs once.
  let refreshing = false;
  function refreshNow() {
    if (disposed || refreshing) return;
    refreshing = true;
    try { refresh(); } finally { refreshing = false; }
    scheduled = false;
  }
  // Before the next paint, once per frame: the game's redraw and this extension's touches land in the same frame.
  // Small changes (a damage number, a bar, a speaker) are gathered: at most one full pass every ~90ms. Running it
  // on every frame of a battle's effects was the main source of stutter.
  let lastRefreshAt = 0;
  function schedule() {
    if (disposed || scheduled) return;
    scheduled = true;
    const run = () => requestAnimationFrame(() => { scheduled = false; refresh(); });
    const wait = 90 - (performance.now() - lastRefreshAt);
    if (wait > 0) setTimeout(run, wait); else run();
  }
  const OWN_SELECTOR = "[data-gfx-ui], [data-gfx-plate], [data-gfx-set], .gfx-sd-list, .gfx-lobby, .gfx-team, .gfx-ev-mascot, .gfx-foe, .gfx-aff-layer, .gfx-vn-cast, .gfx-load-host, .gfx-tiles, .gfx-battle-tile, .gfx-forge-mascot, img.gfx-sd";
  function isOwnNode(node) {
    return !!(node && node.nodeType === 1 && (node.matches?.(OWN_SELECTOR) || node.closest?.(OWN_SELECTOR)));
  }
  function isOwnMutation(record) {
    // Typewriter characters and currency clocks never change the cast or screen layout.
    if (record.target.nodeType === 1 && record.target.closest?.(".vn-text, [data-bar-vigor], [data-vigor-next], [data-bar-funds], [data-bar-aether]")) return true;
    if (isOwnNode(record.target)) return true;
    if (record.type !== "childList") return false;
    const changed = [...record.addedNodes, ...record.removedNodes];
    return changed.length > 0 && changed.every((node) => node.nodeType === 1 ? isOwnNode(node) : isOwnNode(record.target));
  }
  function watch() {
    if (disposed) return;
    hookChapterEntry(host());
    const root = gameRoot();
    if (root !== observed) {
      observer?.disconnect();
      observed = root;
      if (root) {
        observer = new MutationObserver((records) => {
          formatDialogue(root);
          /* The game drew a new screen: dress it now, before the browser paints. Waiting for the next frame
           * let one frame of the game's own screen show first (the lobby, tiles and cards popped in a frame
           * late on every tab change). */
          // A transition copy appearing gets the sheet at once, in this same task.
          for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1 && n.shadowRoot && /\bgf-(leave|hold)\b/.test(n.className)) dressGhost(n);
          for (const r of records) {
            if (isOwnMutation(r)) continue;
            if (load?.external && chapterPopupView(host())) chapterMutationAt = performance.now();
            if (records.some((x) => x.type === "childList" && x.addedNodes.length > 2)) return refreshNow();
            return schedule();
          }
        });
        observer.observe(root, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["data-open", "data-front", "data-cg", "data-on", "src", "hidden"] });
      }
      refresh();
    }
  }
  const interval = setInterval(watch, 2000);
  // The game element is made when its tab opens (and again on reload): watch for it, so the style is on it in
  // the same frame rather than up to 1.5s later with the game's own look showing meanwhile.
  const pageObserver = new MutationObserver((records) => {
    if (records.some((r) => r.target?.closest?.("#gfq-01-panel") || Array.from(r.addedNodes).some((n) => n.id === "gfq-01-panel" || n.querySelector?.("#gfq-01-panel")))) paintQuestTheme();
    for (const r of records) for (const n of r.addedNodes) {
      if (n.nodeType === 1 && (n.localName === HOST_TAG || n.querySelector?.(HOST_TAG))) { watch(); return; }
    }
  });
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  const loadTick = setInterval(tickLoading, 120);
  const syncTick = setInterval(syncStored, 30000);
  on(window, "focus", syncStored);
  // Going fullscreen puts the game above an editor opened before it: show the editor again to bring it back on top.
  on(document, "fullscreenchange", () => {
    for (const box of gameRoot()?.querySelectorAll("[data-gfx-sd-edit]:popover-open") || []) { box.hidePopover(); box.showPopover(); }
  });
  watch();
  loadFonts();
  // Pending browser changes win until the serialized server write acknowledges them.
  storeGet().then((v) => {
    if (disposed || !v) return;
    if (!adoptPrefs(v)) { if (Object.keys(readPending()).length) storePatch({}); return; }
    storePatch({});
    refresh();
    paintSettings(true);
  });
  // Another tab of the same browser changed the style.
  on(window, "storage", (e) => { if (e.key === STORE) { current = readStyle(); refresh(); } });

  const disposeExtension = () => {
    if (disposed) return;
    disposed = true;
    life.abort();
    for (const cleanup of pinchCleanups) cleanup();
    clearInterval(interval);
    clearInterval(loadTick);
    clearInterval(syncTick);
    clearInterval(chatter);
    clearInterval(retryTimer);
    pageObserver.disconnect();
    for (const [h, methods] of entryHooks) for (const [key, saved] of Object.entries(methods)) if (h[key] === saved.wrapped) h[key] = saved.original;
    entryHooks.clear();
    if (roamFrame) cancelAnimationFrame(roamFrame);
    lobbyRO?.disconnect();
    observer?.disconnect();
    for (const baked of bakedMap.values()) if (baked && typeof baked === "object" && baked.url) URL.revokeObjectURL(baked.url);
    bakedMap.clear();
    document.getElementById("gfx-quest-theme")?.remove();
    document.getElementById("gfx-quest-ui-switch")?.remove();
    document.getElementById("gfx-chapter-loading")?.remove();
    document.getElementById("gfx-quest-mallang")?.remove();
    for (const [root, observer] of questPopupRoots) {
      observer.disconnect();
      root.querySelector('#gfx-quest-popup-mallang')?.remove();
      for (const popup of root.querySelectorAll(QUEST_POPUPS)) popup.removeAttribute('data-gfx-mallang');
    }
    questPopupRoots.clear();
    questUnskin(document.getElementById("gfq-01-panel"));
    document.querySelector("[data-gfx-quest-theme]")?.remove();
    const h = host(), root = h?.shadowRoot;
    for (const a of [ATTR, "data-gfx-story-sd", "data-gfx-box", "data-gfx-sticker", "data-gfx-motion", "data-gfx-field", "data-gfx-team", "data-gfx-hideplate", "data-gfx-attend", "data-gfx-phase", "data-gfx-lobby"]) h?.removeAttribute(a);
    if (root) root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== sheet && s !== varSheet);
    for (const n of root?.querySelectorAll("[data-gfx-set], [data-gfx-plate], [data-gfx-ui], img.gfx-sd, .gfx-forge-mascot, .gfx-foe, .gfx-team, .gfx-lobby, .gfx-ev-mascot, .gfx-tiles, .gfx-aff-layer, .gfx-vn-cast, .gfx-load-host") || []) n.remove();
    for (const n of root?.querySelectorAll("[data-gfx-sd], [data-gfx-foe], [data-gfx-attendance], [data-gfx-settings-view]") || []) {
      n.removeAttribute("data-gfx-sd"); n.removeAttribute("data-gfx-foe"); n.removeAttribute("data-gfx-attendance"); n.removeAttribute("data-gfx-settings-view");
    }
    if (window[KEY] === disposeExtension) delete window[KEY];
  };
  window[KEY] = disposeExtension;
  MARINARA?.onCleanup?.(disposeExtension);
})();

