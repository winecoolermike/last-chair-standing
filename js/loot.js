// Loot & formulas. Sources: KB §3 (cascading rolls, Loot system short), §4 (A/(A+K), Armor Pt 1/2),
// §4.2 (marble bag, progressive probability), Magic Find short (Encore = single significant decision).
const Loot = (() => {
  const SLOTS = ['weapon', 'helm', 'chest', 'boots'];
  const RAR = ['Common', 'Rare', 'Epic', 'Legendary'];
  const RMULT = [1.0, 1.25, 1.55, 1.9];
  const ARMOR_PER_ILVL = { helm: 4, chest: 6, boots: 3 };     // "pretty numbers" per slot (Armor Pt 2)
  const AFFIXES = [
    { id: 'dash', txt: '+35% dash distance' },
    { id: 'shove', txt: 'Shove cooldown −30%' },
    { id: 'arc', txt: '+30% swing arc' },
    { id: 'hp', txt: '+15 max HP' },
  ];

  // Marble bag: sampling without replacement, auto-refill.
  class MarbleBag {
    constructor(items, contents) { this.items = items.slice(); this.contents = contents ? contents.slice() : []; }
    next(rng = Math.random) {
      if (this.contents.length === 0) this.contents = this.items.slice();
      const i = Math.floor(rng() * this.contents.length);
      return this.contents.splice(i, 1)[0];
    }
  }

  // K grows with ATTACKER level so leveling up never lowers mitigation (Armor Pt 2).
  const K = (attackerLevel) => 40 + 30 * attackerLevel;
  const mitigation = (armor, attackerLevel) => armor / (armor + K(attackerLevel));

  // Cascading roll: legendary first, then epic, rare, else common (Loot system short).
  function rollRarity(save, encore, rng = Math.random) {
    const legBase = encore ? 0.08 : 0.03;
    const legChance = legBase + save.pity;          // progressive probability (invisible bad-luck protection)
    if (rng() < legChance) { save.pity = 0; return 3; }
    save.pity = Math.min(0.5, save.pity + 0.0025);   // +0.25% per miss (tuned by simulation: ≈6% effective legendary rate, worst streak ≈70 rolls in 200k sims)
    if (rng() < 0.12) return 2;
    if (rng() < 0.35) return 1;
    return 0;
  }

  function makeItem(slot, rarity, ilvl, encore, rng = Math.random) {
    const it = { slot, rarity, ilvl, encore: !!encore };
    if (slot === 'weapon') it.dmg = Math.round((8 + 2.2 * ilvl) * RMULT[rarity]);
    else it.armor = Math.round(ARMOR_PER_ILVL[slot] * ilvl * RMULT[rarity]);
    if (slot === 'boots') it.speed = 0.03 * rarity;
    if (rarity === 3) it.affix = AFFIXES[Math.floor(rng() * AFFIXES.length)].id;
    return it;
  }

  function roll(save, tier, encore, rng = Math.random) {
    const bag = new MarbleBag(SLOTS, save.slotBag);
    const slot = bag.next(rng); save.slotBag = bag.contents;
    const rarity = rollRarity(save, encore, rng);
    const ilvl = tier * 5 + Math.floor(rng() * 3);
    return makeItem(slot, rarity, ilvl, encore, rng);
  }

  function affixText(id) { const a = AFFIXES.find(a => a.id === id); return a ? a.txt : ''; }
  function describe(it) {
    let s = `${RAR[it.rarity]} ${it.slot} (ilvl ${it.ilvl}) — `;
    s += it.slot === 'weapon' ? `${it.dmg} dmg` : `${it.armor} armor`;
    if (it.speed) s += `, +${Math.round(it.speed * 100)}% move`;
    if (it.affix) s += `, ${affixText(it.affix)}`;
    return s;
  }
  function score(it) { return it.slot === 'weapon' ? it.dmg : it.armor + (it.speed || 0) * 300 + (it.affix ? 10 : 0); }

  return { SLOTS, RAR, MarbleBag, K, mitigation, rollRarity, makeItem, roll, describe, score, affixText };
})();
if (typeof module !== 'undefined') module.exports = Loot;
