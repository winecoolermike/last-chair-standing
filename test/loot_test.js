const Loot = require('../js/loot.js');
const save = { pity: 0, slotBag: null };
const N = 200000; const counts = [0,0,0,0]; const slots = {}; let maxGap = 0, gap = 0;
for (let i = 0; i < N; i++) { const it = Loot.roll(save, 1, false); counts[it.rarity]++; slots[it.slot] = (slots[it.slot]||0)+1; if (it.rarity===3){maxGap=Math.max(maxGap,gap);gap=0;} else gap++; }
console.log('rarity %', counts.map(c => (100*c/N).toFixed(2)), 'max rolls between legendaries', maxGap);
console.log('slots', slots);
// armor formula checks (GDD §7)
console.log('K(boss lvl 3)=', Loot.K(3), ' mit(65 armor)=', Loot.mitigation(65,3).toFixed(3));
const hp=100; for (const a of [0,130,260,390]) console.log('armor',a,'EHP',(hp/(1-Loot.mitigation(a,3))).toFixed(1));
// marble bag: 4 draws = 4 unique slots
const bag = new Loot.MarbleBag(['a','b','c','d']); const s = new Set([bag.next(),bag.next(),bag.next(),bag.next()]); console.log('marble bag unique in 4 draws:', s.size === 4);
