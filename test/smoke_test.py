# Headless smoke test: loads the static page via file://, runs a scripted bot through full fights
# with fixed-timestep simulation, checks for JS errors, and saves screenshots.
import asyncio, json, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
BOT = r"""() => {
window.__bot = (S) => {
  const p = S.player, b = S.boss, o = {mx:0,my:0};
  const d = (a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
  if (S.chairs.length) {
    let free = S.chairs.filter(c=>!c.by || c.by===p);
    let tgt = free.sort((a,c)=>d(p,a)-d(p,c))[0];
    if (!tgt) { // steal: go shove the nearest seated usher
      const u = S.ushers.filter(u=>u.seated).sort((a,c)=>d(p,a)-d(p,c))[0];
      if (u) { tgt = u; o.aim = Math.atan2(u.y-p.y,u.x-p.x); if (d(p,u)<80) o.shove = true; }
    }
    if (tgt && d(p,tgt) > 6) { o.mx = tgt.x-p.x; o.my = tgt.y-p.y; if (d(p,tgt)>160) o.dash = true; }
    return o;
  }
  const db = d(p,b);
  o.aim = Math.atan2(b.y-p.y,b.x-p.x);
  if (b.swing) { o.mx = p.x-b.x; o.my = p.y-b.y; return o; }       // back off from telegraphed swipe
  if (db > 110) { o.mx = b.x-p.x; o.my = b.y-p.y; }
  else { o.mx = -(b.y-p.y); o.my = (b.x-p.x); }                    // strafe
  o.swing = db < 125;
  return o;
};
}
"""
async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--autoplay-policy=no-user-gesture-required'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 680})
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto((ROOT / 'index.html').as_uri())
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=str(ROOT / 'screenshot_hub.png'))
        await pg.evaluate(BOT)
        results = []
        for trial in range(4):
            r = await pg.evaluate("""() => {
              LCS.toHub(); LCS.startFight();
              let steps = 0, events = {}, shatters = 0, seatedAtShatter = 0, last = '';
              while (LCS.mode === 'fight' && !LCS.state.over && steps < 60*400) {
                LCS.update(1/60); steps++;
                const ev = LCS.state.event; events[ev] = (events[ev]||0)+1;
                if (ev === 'shatter' && last !== 'shatter') { shatters++; }
                if (ev === 'hold') seatedAtShatter = LCS.state.player.seated ? 1 : 0;
                last = ev;
              }
              const S = LCS.state;
              return {won: S.boss.hp <= 0, time: +S.t.toFixed(1), bossPct: +(S.boss.hp/S.boss.maxHp*100).toFixed(1), playerHp: Math.round(S.player.hp), phase: S.boss.phase, shatters, dmg: S.dmgLog, events: Object.keys(events)};
            }""")
            results.append(r)
            await pg.wait_for_timeout(1200)   # let results screen appear
        # Win-path check with debug-boosted gear (verifies victory, loot rolls, tier unlock)
        win = await pg.evaluate("""() => {
          const sv = LCS.save; const bak = JSON.stringify(sv.gear);
          sv.gear.weapon.dmg = 90; sv.gear.chest.armor = 600;
          LCS.toHub(); LCS.startFight(); let steps = 0;
          while (!LCS.state.over && steps < 60*400) { LCS.update(1/60); steps++; }
          const r = {won: LCS.state.boss.hp <= 0, time: +LCS.state.t.toFixed(1), phase: LCS.state.boss.phase, unlocked: sv.unlocked};
          sv.gear = JSON.parse(bak); return r; }""")
        await pg.wait_for_timeout(1300)
        drops = await pg.evaluate("() => document.getElementById('drops').innerText")
        await pg.screenshot(path=str(ROOT / 'screenshot_results.png'))
        results.append({'win_path': win, 'drops_shown': drops})
        await pg.evaluate("() => { localStorage.clear(); }")
        # Real-time screenshot during a Music Stops event
        await pg.evaluate("() => { LCS.toHub(); LCS.startFight(); }")
        await pg.wait_for_timeout(7300)
        await pg.screenshot(path=str(ROOT / 'screenshot.png'))
        st = await pg.evaluate("() => ({event: LCS.state.event, chairs: LCS.state.chairs.length, ushers: LCS.state.ushers.length, t: LCS.state.t})")
        await pg.wait_for_timeout(5000)
        await pg.screenshot(path=str(ROOT / 'screenshot_combat.png'))
        print(json.dumps({'trials': results, 'realtime_state_at_screenshot': st, 'errors': errors}, indent=1))
        await br.close()
asyncio.run(main())
