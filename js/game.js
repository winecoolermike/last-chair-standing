// Last Chair Standing — prototype. Vanilla JS + canvas, no build step.
// Design traceability: see ../../GDD.md §10. Comments cite KB principles.
(() => {
'use strict';
const W = 960, H = 640, ARENA = { x: 40, y: 60, w: 880, h: 550 };
const BEAT = 60 / 96;                 // 96 BPM -> 16 beats = 10 s (Sci-Fi Vampire Survivors lesson)
const CYCLE = 16 * BEAT;              // 10 s
const T_WARN = 8 * BEAT, T_SLAM = 9.6 * BEAT, T_FERMATA_END = T_SLAM + 2.0, T_HOLD_END = T_FERMATA_END + 0.6;
const canvas = document.getElementById('game'), cx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

// ---------------- Save ----------------
function defaultSave() {
  return {
    tier: 1, unlocked: 1, pity: 0, slotBag: null, best: {},
    gear: {
      weapon: Loot.makeItem('weapon', 0, 3), helm: Loot.makeItem('helm', 0, 3),
      chest: Loot.makeItem('chest', 0, 3), boots: Loot.makeItem('boots', 0, 3),
    },
  };
}
let save;
function load() { try { save = JSON.parse(localStorage.getItem('lcs_save')) || defaultSave(); } catch (e) { save = defaultSave(); } }
function persist() { try { localStorage.setItem('lcs_save', JSON.stringify(save)); } catch (e) {} }
load();

function playerStats() {
  const g = save.gear, aff = Object.values(g).map(i => i.affix).filter(Boolean);
  return {
    dmg: g.weapon.dmg,
    armor: (g.helm.armor || 0) + (g.chest.armor || 0) + (g.boots.armor || 0),
    speed: 230 * (1 + (g.boots.speed || 0)),
    maxHp: 100 + (aff.includes('hp') ? 15 : 0),
    dashMul: aff.includes('dash') ? 1.35 : 1,
    shoveCd: aff.includes('shove') ? 1.4 : 2.0,
    arc: (aff.includes('arc') ? 1.3 : 1) * (100 * Math.PI / 180),
  };
}
const bossLevel = (tier) => tier + 2;

// ---------------- Input ----------------
const keys = {}, mouse = { x: W / 2, y: H / 2 };
let pressed = {};
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true; keys[k] = true;
  if ([' ', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  Sfx.init();
});
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * W / r.width; mouse.y = (e.clientY - r.top) * H / r.height; });
canvas.addEventListener('mousedown', (e) => { Sfx.init(); pressed[e.button === 2 ? 'mouse2' : 'mouse1'] = true; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------- Fight state ----------------
let S = null;          // current fight
let mode = 'hub';      // hub | fight | results
let shakeScale = 1;

function startFight() {
  Sfx.init();
  const tier = save.tier, encore = $('encore').checked, ps = playerStats();
  shakeScale = $('shakeHalf').checked ? 0.5 : 1;
  const hpMul = Math.pow(1.35, tier - 1) * (encore ? 1.4 : 1);
  const dmgMul = Math.pow(1.25, tier - 1) * (encore ? 1.4 : 1);
  S = {
    tier, encore, ps, t: 0, cycleT: 0, beatIdx: -1, lastBeatAbs: -1, hitstop: 0, shake: 0, shakeAmp: 0,
    mitig: Loot.mitigation(ps.armor, bossLevel(tier)),
    player: { x: W / 2, y: ARENA.y + ARENA.h - 80, r: 12, hp: ps.maxHp, vx: 0, vy: 0, aim: -Math.PI / 2,
      swingCd: 0, swingT: 0, dashCd: 0, dashT: 0, iframe: 0, shoveCd: 0, shoveT: 0, hurtT: 0, slow: 0, knock: null, seated: null },
    boss: { x: W / 2, y: ARENA.y + 120, r: 46, maxHp: Math.round(1200 * hpMul), hp: Math.round(1200 * hpMul), phase: 1,
      dmgMul, swing: null, swingCd: 2.5, flash: 0, enrage: 0 },
    ushers: [], notes: [], chairs: [], particles: [], floaters: [],
    event: 'normal', banner: null, log: [], over: false, dmgLog: {},
  };
  spawnUshers(2);
  mode = 'fight';
  $('hub').classList.add('hidden'); $('results').classList.add('hidden');
  log('The Maestro raises his baton…');
}

function log(msg) { if (S) { S.log.unshift({ msg, t: 4 }); S.log.length = Math.min(S.log.length, 5); } }
function banner(text, dur = 1.6, color = '#ffd166') { S.banner = { text, t: dur, dur, color }; }
function addShake(amp, dur) { S.shakeAmp = Math.max(S.shakeAmp, amp * shakeScale); S.shake = Math.max(S.shake, dur); }
function floater(x, y, txt, col) { S.floaters.push({ x, y, txt, col, t: 0.8 }); }
function burst(x, y, col, n = 8, sp = 160) { for (let i = 0; i < n; i++) { const a = rand(0, 6.283); S.particles.push({ x, y, vx: Math.cos(a) * rand(40, sp), vy: Math.sin(a) * rand(40, sp), t: rand(0.25, 0.5), col }); } }

function spawnUshers(n) {
  for (let i = 0; i < n && S.ushers.length < 4; i++) {
    const side = Math.random() < 0.5 ? ARENA.x + 30 : ARENA.x + ARENA.w - 30;
    S.ushers.push({ x: side, y: rand(ARENA.y + 60, ARENA.y + ARENA.h - 60), r: 11, hp: 40, maxHp: 40, kx: 0, ky: 0, seated: null, target: null, atkCd: 0, flash: 0 });
  }
}

function damagePlayer(raw, src) {
  const p = S.player;
  if (p.iframe > 0 || S.over) return;
  const dmg = Math.max(1, Math.round(raw * (1 - S.mitig)));
  S.dmgLog[src] = (S.dmgLog[src] || 0) + dmg;
  p.hp -= dmg; p.hurtT = 0.35; p.iframe = Math.max(p.iframe, 0.25);
  floater(p.x, p.y - 20, '-' + dmg, '#ff5d5d');
  Sfx.hurt(); addShake(6, 0.08);
  if (p.hp <= 0) endFight(false);
}

function damageBoss(dmg) {
  const b = S.boss; b.hp -= dmg; b.flash = 0.08; S.hitstop = 0.04;   // hit-stop
  floater(b.x + rand(-20, 20), b.y - 50, String(dmg), '#fff');
  burst(b.x, b.y, '#ffd166', 6); Sfx.hit(); addShake(3, 0.06);       // vertical-only, short shake ("camera shake is salt")
  const frac = b.hp / b.maxHp;
  if (b.phase === 1 && frac <= 0.66) { b.phase = 2; banner('PHASE 2 — no spare chairs!', 1.8, '#c77dff'); Sfx.phase(); log('Phase 2: chairs = Ushers. Notes split three ways.'); }
  if (b.phase === 2 && frac <= 0.33) { b.phase = 3; banner('PHASE 3 — FORTISSIMO', 1.8, '#ff6b6b'); Sfx.phase(); log('Phase 3: smaller chairs, double baton swipe.'); }
  if (b.hp <= 0) { b.hp = 0; endFight(true); }
}

// ---------------- Music Stops cycle (Gruul adaptation) ----------------
function startStop() {
  const p = S.player, b = S.boss;
  S.event = 'slam'; Sfx.droneStart(); Sfx.slam(); addShake(12, 0.1);
  banner('THE MUSIC STOPS!', 2.6, '#ff9f1c'); log('Downbeat Slam: thrown somewhere random.');
  // Random knockback: no pre-assigned seats (Gruul's Ground Slam)
  const a = rand(0, 6.283), d = rand(140, 280);
  p.knock = { vx: Math.cos(a) * d / 0.25, vy: Math.sin(a) * d / 0.25, t: 0.25 };
  p.seated = null; p.slow = 0;
  for (const u of S.ushers) { const ua = rand(0, 6.283); u.kx = Math.cos(ua) * 300; u.ky = Math.sin(ua) * 300; u.seated = null; }
  b.swing = null; S.notes.length = 0;
  // Chairs: one per Usher (+1 spare in phase 1), random positions
  const n = Math.max(1, S.ushers.length + (b.phase === 1 ? 1 : 0));
  const cr = b.phase === 3 ? 20 : 27;
  S.chairs = [];
  let guard = 0;
  while (S.chairs.length < n && guard++ < 500) {
    const c = { x: rand(ARENA.x + 50, ARENA.x + ARENA.w - 50), y: rand(ARENA.y + 50, ARENA.y + ARENA.h - 50), r: cr, by: null };
    if (dist(c, b) < 130) continue;
    if (S.chairs.some(o => dist(o, c) < 110)) continue;
    S.chairs.push(c);
  }
}

function doShatter() {
  const p = S.player;
  S.event = 'shatter'; Sfx.droneStop(); Sfx.shatter(); addShake(12, 0.1);
  burst(S.boss.x, S.boss.y, '#ff9f1c', 30, 420);
  if (!p.seated) { log('SHATTER! You had no chair.'); p.iframe = 0; damagePlayer(0.45 * S.ps.maxHp, 'shatter'); }
  else { log('Seated! Shatter passes you by.'); floater(p.x, p.y - 24, 'SAFE', '#7CFC9A'); }
  const before = S.ushers.length;
  S.ushers = S.ushers.filter(u => { if (!u.seated) { burst(u.x, u.y, '#9ad1ff', 10); return false; } return true; });
  if (before - S.ushers.length > 0) log(`${before - S.ushers.length} Usher(s) shattered.`);
  S.chairs = []; for (const u of S.ushers) u.seated = null; p.seated = null; p.slow = 0;
}

// ---------------- Update ----------------
function update(dt) {
  if (mode !== 'fight' || !S || S.over) { pressed = {}; return; }
  if (S.hitstop > 0) { S.hitstop -= dt; pressed = {}; return; }
  S.t += dt;
  const p = S.player, b = S.boss, ps = S.ps;
  const prevCycle = S.cycleT; S.cycleT = S.t % CYCLE;
  const wrapped = S.cycleT < prevCycle;
  if (wrapped) { S.event = 'normal'; spawnUshers(2); banner('♪ The music resumes', 1.0, '#9ad1ff'); }
  // beat clock
  const absBeat = Math.floor(S.t / BEAT);
  if (absBeat !== S.lastBeatAbs) {
    S.lastBeatAbs = absBeat; S.beatIdx = absBeat % 16;
    if (S.event === 'normal' || S.event === 'warn') { Sfx.beat(S.beatIdx, S.event === 'warn'); onBeat(S.beatIdx); }
  }
  // timeline
  if (S.event === 'normal' && S.cycleT >= T_WARN && S.cycleT < T_SLAM) { S.event = 'warn'; log('♪ the music is slowing…'); banner('♪ the music is slowing…', 1.2, '#ffd166'); }
  if (S.event === 'warn' && S.cycleT >= T_SLAM) startStop();
  if (S.event === 'slam' && S.cycleT >= T_SLAM + 0.3) S.event = 'fermata';
  if (S.event === 'fermata' && S.cycleT >= T_FERMATA_END) { S.event = 'hold'; banner('…', 0.6, '#fff'); }
  if (S.event === 'hold' && S.cycleT >= T_HOLD_END) doShatter();
  const stopPhase = ['slam', 'fermata', 'hold'].includes(S.event);
  // Fermata: stacking slow 20% per 0.5 s (max 80%)
  if (S.event === 'fermata') p.slow = Math.min(0.8, 0.2 * (1 + Math.floor((S.cycleT - T_SLAM - 0.3) / 0.5)));
  const frozen = S.event === 'hold';
  // soft enrage: +15% every 30 s
  const en = Math.floor(S.t / 30);
  if (en > b.enrage) { b.enrage = en; log(`Crescendo! Boss damage +15% (x${Math.pow(1.15, en).toFixed(2)})`); }
  const bossMul = b.dmgMul * Math.pow(1.15, b.enrage);

  // ---- player ----
  p.aim = Math.atan2(mouse.y - p.y, mouse.x - p.x);
  ['swingCd', 'dashCd', 'iframe', 'shoveCd', 'swingT', 'shoveT', 'hurtT'].forEach(k => p[k] = Math.max(0, p[k] - dt));
  let mx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let my = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  if (window.__bot) { const o = window.__bot(S); mx = o.mx; my = o.my; if (o.swing) pressed['mouse1'] = true; if (o.shove) pressed['mouse2'] = true; if (o.dash) pressed[' '] = true; if (o.aim !== undefined) p.aim = o.aim; }
  const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
  if (p.knock) { p.x += p.knock.vx * dt; p.y += p.knock.vy * dt; p.knock.t -= dt; if (p.knock.t <= 0) p.knock = null; }
  else if (!frozen) {
    if ((pressed[' '] || pressed['shift']) && p.dashCd <= 0 && (mx || my)) { p.dashT = 0.16; p.dashCd = 0.9; p.iframe = 0.25; p.dvx = mx; p.dvy = my; Sfx.dash(); }   // dash starts on input frame
    const sp = ps.speed * (1 - p.slow);
    if (p.dashT > 0) { p.dashT -= dt; const ds = 680 * ps.dashMul * (1 - p.slow * 0.5); p.x += p.dvx * ds * dt; p.y += p.dvy * ds * dt; }
    else { p.x += mx * sp * dt; p.y += my * sp * dt; }
    // swing: zero anticipation frames — hit resolves on the press frame ("Responsive game feel" short)
    if ((pressed['mouse1'] || pressed['j']) && p.swingCd <= 0 && !stopPhase) {
      p.swingCd = 0.34; p.swingT = 0.14; Sfx.swing();
      const reach = 78;
      if (dist(p, b) - b.r < reach && Math.abs(angDiff(Math.atan2(b.y - p.y, b.x - p.x), p.aim)) < ps.arc / 2 + 0.35) damageBoss(Math.round(ps.dmg * rand(0.9, 1.1)));
      for (const u of S.ushers) if (dist(p, u) - u.r < reach && Math.abs(angDiff(Math.atan2(u.y - p.y, u.x - p.x), p.aim)) < ps.arc / 2 + 0.2) { u.hp -= ps.dmg; u.flash = 0.1; burst(u.x, u.y, '#9ad1ff', 5); if (u.hp <= 0) { u.dead = true; if (u.seated) u.seated.by = null; } }
      S.ushers = S.ushers.filter(u => !u.dead);
    }
    // shove: knock Ushers out of chairs (works during the stop — that's the point)
    if ((pressed['mouse2'] || pressed['k']) && p.shoveCd <= 0) {
      p.shoveCd = ps.shoveCd; p.shoveT = 0.18; Sfx.dash();
      for (const u of S.ushers) {
        const d = dist(p, u);
        if (d < 95 && Math.abs(angDiff(Math.atan2(u.y - p.y, u.x - p.x), p.aim)) < 1.05) {
          const a = Math.atan2(u.y - p.y, u.x - p.x); u.kx = Math.cos(a) * 520; u.ky = Math.sin(a) * 520; u.hp -= 8; u.flash = 0.1;
          if (u.seated) { u.seated.by = null; u.seated = null; log('Shoved an Usher off its chair!'); }
        }
      }
      S.ushers = S.ushers.filter(u => u.hp > 0);
    }
  }
  p.x = clamp(p.x, ARENA.x + p.r, ARENA.x + ARENA.w - p.r); p.y = clamp(p.y, ARENA.y + p.r, ARENA.y + ARENA.h - p.r);
  // boss body blocks
  const db = dist(p, b); if (db < b.r + p.r) { const a = Math.atan2(p.y - b.y, p.x - b.x); p.x = b.x + Math.cos(a) * (b.r + p.r); p.y = b.y + Math.sin(a) * (b.r + p.r); }
  // seating
  if (S.chairs.length && !frozen) {
    if (p.seated && dist(p, p.seated) > p.seated.r) { p.seated.by = null; p.seated = null; }
    if (!p.seated) for (const c of S.chairs) if (!c.by && dist(p, c) < c.r) { c.by = p; p.seated = c; Sfx.seat(); floater(c.x, c.y - 30, 'SEATED', '#7CFC9A'); break; }
  }

  // ---- ushers ----
  for (const u of S.ushers) {
    u.flash = Math.max(0, u.flash - dt); u.atkCd = Math.max(0, u.atkCd - dt);
    u.x += u.kx * dt; u.y += u.ky * dt; u.kx *= Math.pow(0.02, dt); u.ky *= Math.pow(0.02, dt);
    if (frozen || u.seated) { /* sit still */ }
    else if (S.chairs.length) {
      // race for the nearest free chair
      let best = null, bd = 1e9; for (const c of S.chairs) if (!c.by) { const d = dist(u, c); if (d < bd) { bd = d; best = c; } }
      u.target = best;
      if (best) { const a = Math.atan2(best.y - u.y, best.x - u.x), sp = 185 * (1 - p.slow); u.x += Math.cos(a) * sp * dt; u.y += Math.sin(a) * sp * dt;
        if (dist(u, best) < best.r * 0.6) { best.by = u; u.seated = best; } }
    } else if (!stopPhase) {
      const a = Math.atan2(p.y - u.y, p.x - u.x); u.x += Math.cos(a) * 120 * dt; u.y += Math.sin(a) * 120 * dt;
      if (dist(u, p) < u.r + p.r + 2 && u.atkCd <= 0) { u.atkCd = 0.8; damagePlayer(5 * bossMul, 'usher'); }
    }
    u.x = clamp(u.x, ARENA.x + u.r, ARENA.x + ARENA.w - u.r); u.y = clamp(u.y, ARENA.y + u.r, ARENA.y + ARENA.h - u.r);
  }

  // ---- boss ----
  b.flash = Math.max(0, b.flash - dt);
  if (!stopPhase && S.event !== 'shatter') {
    const a = Math.atan2(p.y - b.y, p.x - b.x);
    if (!b.swing && db > 140) { b.x += Math.cos(a) * 55 * dt; b.y += Math.sin(a) * 55 * dt; }
    b.x = clamp(b.x, ARENA.x + 80, ARENA.x + ARENA.w - 80); b.y = clamp(b.y, ARENA.y + 70, ARENA.y + ARENA.h - 70);
    b.swingCd -= dt;
    if (!b.swing && b.swingCd <= 0 && db < 190) { b.swing = { t: 1.0, ang: a, n: b.phase === 3 ? 2 : 1 }; log('Baton Swipe incoming!'); }
    if (b.swing) {
      b.swing.t -= dt;
      if (b.swing.t <= 0) {
        if (dist(p, b) < 175 + p.r && Math.abs(angDiff(Math.atan2(p.y - b.y, p.x - b.x), b.swing.ang)) < 0.8) damagePlayer(22 * bossMul, 'swipe');
        addShake(5, 0.08); burst(b.x + Math.cos(b.swing.ang) * 100, b.y + Math.sin(b.swing.ang) * 100, '#ff6b6b', 10);
        b.swing.n--; if (b.swing.n > 0) { b.swing.t = 0.6; b.swing.ang = Math.atan2(p.y - b.y, p.x - b.x); } else { b.swing = null; b.swingCd = 2.2; }
      }
    }
  }
  if (S.event === 'shatter' && S.cycleT > T_HOLD_END + 0.4) S.event = 'after';
  // notes
  for (const n of S.notes) { n.x += n.vx * dt; n.y += n.vy * dt; n.t -= dt; if (dist(n, p) < p.r + 7) { n.t = 0; damagePlayer(7 * bossMul, 'note'); } }
  S.notes = S.notes.filter(n => n.t > 0 && n.x > ARENA.x - 20 && n.x < ARENA.x + ARENA.w + 20 && n.y > ARENA.y - 20 && n.y < ARENA.y + ARENA.h + 20);
  // fx
  for (const q of S.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.t -= dt; }
  S.particles = S.particles.filter(q => q.t > 0);
  for (const f of S.floaters) { f.y -= 40 * dt; f.t -= dt; } S.floaters = S.floaters.filter(f => f.t > 0);
  for (const l of S.log) l.t -= dt; S.log = S.log.filter(l => l.t > 0);
  if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }
  S.shake = Math.max(0, S.shake - dt); if (S.shake <= 0) S.shakeAmp = 0;
  pressed = {};
}

function onBeat(i) {
  const b = S.boss, p = S.player;
  if (i % (b.phase === 1 ? 4 : 2) !== 0 || S.event !== 'normal') return;   // P1: every 4th beat, P2+: every 2nd; none during the warning
  const base = Math.atan2(p.y - b.y, p.x - b.x);
  const n = b.phase === 1 ? 5 : 7, spread = b.phase === 1 ? 0.9 : 1.3;
  for (let k = 0; k < n; k++) {
    const a = base + (k / (n - 1) - 0.5) * spread;
    if (b.phase >= 2 && k % 2 === 1) continue;                   // gaps to weave through
    S.notes.push({ x: b.x, y: b.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, t: 4 });
  }
}

// ---------------- End / results ----------------
let lastDrops = [];
function endFight(won) {
  if (S.over) return; S.over = true; Sfx.droneStop();
  won ? Sfx.win() : Sfx.lose();
  const progress = 1 - S.boss.hp / S.boss.maxHp;
  // loot: win 2 (encore 4), loss 1 if progress >= 25%
  const rolls = won ? (S.encore ? 4 : 2) : (progress >= 0.25 ? 1 : 0);
  lastDrops = []; for (let i = 0; i < rolls; i++) lastDrops.push(Loot.roll(save, S.tier, S.encore && won));
  const key = 't' + S.tier; save.best[key] = Math.max(save.best[key] || 0, progress);
  if (won && S.tier === save.unlocked && save.unlocked < 5) { save.unlocked++; }
  persist();
  setTimeout(() => showResults(won, progress), 900);
}

function showResults(won, progress) {
  mode = 'results';
  $('results').classList.remove('hidden');
  $('resTitle').textContent = won ? (S.encore ? '★ ENCORE VICTORY ★' : 'VICTORY — the Maestro bows') : 'SHATTERED';
  $('progressFill').style.width = (progress * 100).toFixed(1) + '%';
  const phase = progress >= 0.67 ? 3 : progress >= 0.34 ? 2 : 1;
  // Cuphead-style micro-victory framing
  $('resText').innerHTML = won
    ? `Tier ${S.tier} cleared in ${S.t.toFixed(1)} s. ${save.unlocked > S.tier ? 'Tier ' + (S.tier + 1) + ' unlocked!' : ''}`
    : `You reached <b>Phase ${phase}</b> — the Maestro was at <b>${Math.round(S.boss.hp / S.boss.maxHp * 100)}%</b>. Best on this tier: ${Math.round(save.best['t' + S.tier] * 100)}%. ${progress >= 0.25 ? 'Consolation loot earned.' : 'Deal 25% to earn consolation loot.'}`;
  renderDrops();
}

function renderDrops() {
  const box = $('drops'); box.innerHTML = '';
  if (!lastDrops.length) box.innerHTML = '<div class="dim">No drops this time.</div>';
  lastDrops.forEach((it, i) => {
    const cur = save.gear[it.slot], diff = Loot.score(it) - Loot.score(cur);
    const d = document.createElement('div'); d.className = 'item r' + it.rarity;
    d.innerHTML = `<b>${i + 1}.</b> ${it.encore ? '<span class="star">★</span> ' : ''}<span class="rtag">[${Loot.RAR[it.rarity]}]</span> ${Loot.describe(it).replace(/^\w+ /, '')} <span class="${diff >= 0 ? 'better' : 'worse'}">(${diff >= 0 ? '▲' : '▼'} vs equipped)</span>${it.equipped ? ' — <b>EQUIPPED</b>' : ''}`;
    d.onclick = () => equip(i); box.appendChild(d);
  });
}
function equip(i) { const it = lastDrops[i]; if (!it || it.equipped) return; save.gear[it.slot] = it; it.equipped = true; persist(); renderDrops(); }

// ---------------- Hub ----------------
function renderHub() {
  $('tierLbl').textContent = save.tier;
  $('tierNote').textContent = `(unlocked: 1–${save.unlocked}; boss level ${bossLevel(save.tier)})`;
  const ps = playerStats(), m = Loot.mitigation(ps.armor, bossLevel(save.tier));
  $('gear').innerHTML = Loot.SLOTS.map(s => { const it = save.gear[s]; return `<div class="item r${it.rarity}">${it.encore ? '<span class="star">★</span> ' : ''}<span class="rtag">[${Loot.RAR[it.rarity]}]</span> ${Loot.describe(it).replace(/^\w+ /, '')}</div>`; }).join('');
  $('stats').innerHTML = `Damage ${ps.dmg} · Armor ${ps.armor} → <b>${(m * 100).toFixed(1)}%</b> mitigation vs tier-${save.tier} boss (K = ${Loot.K(bossLevel(save.tier))}) · HP ${ps.maxHp} · Speed ${Math.round(ps.speed)}<br>Effective HP vs this boss: ${Math.round(ps.maxHp / (1 - m))} · Best progress on this tier: ${Math.round((save.best['t' + save.tier] || 0) * 100)}%`;
}
function toHub() { mode = 'hub'; S = null; $('results').classList.add('hidden'); $('hub').classList.remove('hidden'); renderHub(); }
$('tierDown').onclick = () => { save.tier = Math.max(1, save.tier - 1); persist(); renderHub(); };
$('tierUp').onclick = () => { save.tier = Math.min(save.unlocked, save.tier + 1); persist(); renderHub(); };
$('startBtn').onclick = startFight;
$('contBtn').onclick = toHub;
$('resetBtn').onclick = () => { if (confirm('Reset all progress?')) { save = defaultSave(); persist(); renderHub(); } };
addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { if (mode === 'hub') startFight(); else if (mode === 'results') toHub(); }
  if (mode === 'results' && /^[1-9]$/.test(e.key)) equip(+e.key - 1);
});

// ---------------- Render ----------------
function draw() {
  cx.save();
  cx.fillStyle = '#1a1626'; cx.fillRect(0, 0, W, H);
  if (!S) { drawIdle(); cx.restore(); return; }
  const sy = S.shake > 0 ? (Math.random() * 2 - 1) * S.shakeAmp : 0;   // vertical axis only
  cx.translate(0, sy);
  // arena floor
  cx.fillStyle = '#231d33'; cx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  cx.strokeStyle = '#3d3358'; cx.lineWidth = 2; cx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  cx.strokeStyle = '#2b2440'; for (let x = ARENA.x; x < ARENA.x + ARENA.w; x += 55) { cx.beginPath(); cx.moveTo(x, ARENA.y); cx.lineTo(x, ARENA.y + ARENA.h); cx.stroke(); }
  const p = S.player, b = S.boss;
  // fermata tint
  if (['fermata', 'hold'].includes(S.event)) { cx.fillStyle = `rgba(80,140,255,${S.event === 'hold' ? 0.18 : 0.08})`; cx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h); }
  // chairs (shape-coded: ring + chair glyph)
  for (const c of S.chairs) {
    cx.lineWidth = 4; cx.strokeStyle = c.by ? (c.by === p ? '#7CFC9A' : '#ff7b7b') : '#ffd166';
    cx.beginPath(); cx.arc(c.x, c.y, c.r, 0, 6.283); cx.stroke();
    cx.fillStyle = cx.strokeStyle; cx.fillRect(c.x - 7, c.y - 2, 14, 4); cx.fillRect(c.x - 7, c.y - 12, 3, 22); cx.fillRect(c.x + 4, c.y + 2, 3, 8);
  }
  // Usher target lines (readability)
  cx.setLineDash([4, 6]); cx.strokeStyle = '#9ad1ff55'; cx.lineWidth = 1;
  for (const u of S.ushers) if (u.target && !u.seated && S.chairs.length) { cx.beginPath(); cx.moveTo(u.x, u.y); cx.lineTo(u.target.x, u.target.y); cx.stroke(); }
  cx.setLineDash([]);
  // boss swipe telegraph
  if (b.swing) {
    const k = 1 - b.swing.t / (b.swing.n > 0 && b.swing.t <= 0.6 ? 0.6 : 1.0);
    cx.fillStyle = `rgba(255,80,80,${0.12 + 0.3 * clamp(k, 0, 1)})`;
    cx.beginPath(); cx.moveTo(b.x, b.y); cx.arc(b.x, b.y, 175, b.swing.ang - 0.8, b.swing.ang + 0.8); cx.closePath(); cx.fill();
  }
  // boss
  cx.fillStyle = b.flash > 0 ? '#ffffff' : (S.event === 'hold' ? '#8a8fa8' : '#6e5a8f');
  cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.283); cx.fill();
  cx.fillStyle = '#2a2140'; cx.fillRect(b.x - 30, b.y - 58, 60, 14); cx.fillRect(b.x - 18, b.y - 78, 36, 22);  // top hat
  cx.fillStyle = '#ffd166'; cx.beginPath(); cx.arc(b.x - 14, b.y - 8, 5, 0, 6.283); cx.arc(b.x + 14, b.y - 8, 5, 0, 6.283); cx.fill();
  const ba = Math.atan2(p.y - b.y, p.x - b.x); cx.strokeStyle = '#eee'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(b.x + Math.cos(ba) * 40, b.y + Math.sin(ba) * 40); cx.lineTo(b.x + Math.cos(ba) * 80, b.y + Math.sin(ba) * 80); cx.stroke();
  // notes (solid)
  cx.fillStyle = '#ff9f1c'; for (const n of S.notes) { cx.beginPath(); cx.arc(n.x, n.y, 7, 0, 6.283); cx.fill(); cx.fillRect(n.x + 5, n.y - 16, 2, 16); }
  // ushers (hollow diamonds)
  for (const u of S.ushers) {
    cx.strokeStyle = u.flash > 0 ? '#fff' : '#9ad1ff'; cx.lineWidth = 3;
    cx.beginPath(); cx.moveTo(u.x, u.y - 14); cx.lineTo(u.x + 12, u.y); cx.lineTo(u.x, u.y + 14); cx.lineTo(u.x - 12, u.y); cx.closePath(); cx.stroke();
    if (u.seated) { cx.fillStyle = '#9ad1ff88'; cx.fill(); }
    cx.fillStyle = '#333'; cx.fillRect(u.x - 12, u.y - 22, 24, 3); cx.fillStyle = '#9ad1ff'; cx.fillRect(u.x - 12, u.y - 22, 24 * u.hp / u.maxHp, 3);
  }
  // player
  if (p.swingT > 0) { cx.fillStyle = 'rgba(255,255,255,0.35)'; cx.beginPath(); cx.moveTo(p.x, p.y); cx.arc(p.x, p.y, 78, p.aim - S.ps.arc / 2, p.aim + S.ps.arc / 2); cx.closePath(); cx.fill(); }
  if (p.shoveT > 0) { cx.strokeStyle = 'rgba(154,209,255,0.7)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(p.x, p.y, 95, p.aim - 1.05, p.aim + 1.05); cx.stroke(); }
  cx.fillStyle = p.hurtT > 0 ? '#ff3b3b' : (p.iframe > 0 && p.dashT > 0 ? '#cfe8ff' : '#7CFC9A');
  cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
  cx.fillStyle = '#ffd166'; cx.beginPath(); cx.moveTo(p.x - 8, p.y - 10); cx.lineTo(p.x - 5, p.y - 18); cx.lineTo(p.x, p.y - 12); cx.lineTo(p.x + 5, p.y - 18); cx.lineTo(p.x + 8, p.y - 10); cx.fill();  // paper crown
  // swing pose: instant silhouette change (weapon extended toward aim)
  cx.strokeStyle = '#fff'; cx.lineWidth = 3; const wa = p.swingT > 0 ? p.aim + 0.6 : p.aim - 0.9;
  cx.beginPath(); cx.moveTo(p.x + Math.cos(wa) * 10, p.y + Math.sin(wa) * 10); cx.lineTo(p.x + Math.cos(wa) * (p.swingT > 0 ? 34 : 22), p.y + Math.sin(wa) * (p.swingT > 0 ? 34 : 22)); cx.stroke();
  // player HP near sprite (feedback where the eyes are)
  cx.fillStyle = '#400'; cx.fillRect(p.x - 18, p.y + 17, 36, 4); cx.fillStyle = '#7CFC9A'; cx.fillRect(p.x - 18, p.y + 17, 36 * Math.max(0, p.hp) / S.ps.maxHp, 4);
  if (p.slow > 0) { cx.fillStyle = '#9ad1ff'; cx.font = '11px sans-serif'; cx.fillText(`slowed ${Math.round(p.slow * 100)}%`, p.x - 22, p.y + 32); }
  // particles & floaters
  for (const q of S.particles) { cx.globalAlpha = clamp(q.t * 2, 0, 1); cx.fillStyle = q.col; cx.fillRect(q.x - 2, q.y - 2, 4, 4); }
  cx.globalAlpha = 1; cx.font = 'bold 15px sans-serif';
  for (const f of S.floaters) { cx.globalAlpha = clamp(f.t * 1.5, 0, 1); cx.fillStyle = f.col; cx.fillText(f.txt, f.x - 10, f.y); }
  cx.globalAlpha = 1;
  cx.restore(); cx.save();
  // hurt vignette
  if (p.hurtT > 0) { const g = cx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 560); g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,0,0,${p.hurtT * 1.2})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
  drawHud();
  cx.restore();
}

function drawHud() {
  const b = S.boss, p = S.player;
  // boss bar with phase ticks
  cx.fillStyle = '#000a'; cx.fillRect(160, 14, 640, 18);
  cx.fillStyle = b.phase === 3 ? '#ff6b6b' : b.phase === 2 ? '#c77dff' : '#ffd166'; cx.fillRect(160, 14, 640 * b.hp / b.maxHp, 18);
  cx.fillStyle = '#fff'; cx.fillRect(160 + 640 * 0.66, 12, 2, 22); cx.fillRect(160 + 640 * 0.33, 12, 2, 22);
  cx.font = 'bold 13px sans-serif'; cx.fillStyle = '#fff';
  cx.fillText(`MAESTRO GRUMBLE  T${S.tier}${S.encore ? ' ★ENCORE' : ''}  ${Math.ceil(b.hp)}/${b.maxHp}  P${b.phase}`, 166, 28);
  // beat dots
  for (let i = 0; i < 16; i++) { cx.fillStyle = i === S.beatIdx ? '#ffd166' : (i >= 8 ? '#5a4060' : '#3d3358'); if (['slam', 'fermata', 'hold', 'shatter'].includes(S.event)) cx.fillStyle = '#222'; cx.fillRect(160 + i * 40, 38, 30, 6); }
  // player hp
  cx.fillStyle = '#000a'; cx.fillRect(14, 610, 220, 16); cx.fillStyle = '#7CFC9A'; cx.fillRect(14, 610, 220 * Math.max(0, p.hp) / S.ps.maxHp, 16);
  cx.fillStyle = '#fff'; cx.font = '12px sans-serif'; cx.fillText(`HP ${Math.max(0, Math.ceil(p.hp))}/${S.ps.maxHp}   armor mitigation ${(S.mitig * 100).toFixed(0)}%   enrage x${Math.pow(1.15, b.enrage).toFixed(2)}`, 18, 622);
  cx.fillText(`dash ${p.dashCd > 0 ? p.dashCd.toFixed(1) : 'ready'}  shove ${p.shoveCd > 0 ? p.shoveCd.toFixed(1) : 'ready'}  ushers ${S.ushers.length}`, 600, 622);
  // log
  cx.font = '12px sans-serif'; S.log.forEach((l, i) => { cx.globalAlpha = clamp(l.t, 0, 1); cx.fillStyle = '#ddd'; cx.fillText(l.msg, 14, 76 + i * 15); }); cx.globalAlpha = 1;
  if (S.banner) { const bn = S.banner; cx.globalAlpha = clamp(bn.t / 0.3, 0, 1); cx.font = 'bold 40px sans-serif'; cx.fillStyle = bn.color; cx.textAlign = 'center'; cx.fillText(bn.text, W / 2, H / 2 - 120); cx.textAlign = 'left'; cx.globalAlpha = 1; }
}
function drawIdle() { cx.fillStyle = '#ffd16633'; cx.font = 'bold 60px sans-serif'; cx.textAlign = 'center'; cx.fillText('♪', W / 2, H / 2); cx.textAlign = 'left'; }

// ---------------- Main loop ----------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw();
  requestAnimationFrame(frame);
}
renderHub();
requestAnimationFrame(frame);

// Test hooks (used by headless smoke test; harmless in normal play)
window.LCS = { get state() { return S; }, get mode() { return mode; }, get save() { return save; }, startFight, update, draw, toHub, Loot };
})();
