# LAST CHAIR STANDING: Game Design Document (v0.1)

*Original game concept by GameCraft for Jeff, 2026-11-13. Every design decision traces back to the candlesan knowledge base (`knowledge_base.md`). Citations link to the source video timestamp. Prototype: `prototype/index.html`.*

## 1. Pitch
**Last Chair Standing** is a top-down arena boss-rush where every boss is built around the *feeling* of a children's party game. The first boss, **Maestro Grumble**, a giant stone conductor, turns his arena into musical chairs. You fight him to the beat of his song. When the music stops, he slams the floor and throws you somewhere random, time slows, glowing chairs appear, and his Ushers race you for the seats. A beat of silence, then the Shatter: anyone without a chair gets crushed. Between attempts you collect loot, tune your armor, and decide whether to take the **Encore** (a harder fight for a much better reward).

- **Platform:** browser (desktop, keyboard + mouse), static HTML5 canvas; hostable on GitHub Pages later.
- **Session:** 2–4 minute boss attempts; 20–40 minute sessions.
- **Audience:** players who like short, skill-based boss fights (Cuphead, Hades) plus light loot chasing.

## 2. Target emotion & kinds of fun
- **Emotion-first statement:** "the frantic mix of panic, desperation, and excitement when the music stops," straight from Cheng's Gruul brief [Gruul musical-chairs short @00:00](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=0s). Design the emotion first, then pick mechanics [Three questions short @00:00](https://www.youtube.com/watch?v=GowOfSAODdQ&t=0s).
- **Primary fun: Challenge.** Mastery over a tough boss, with micro-victories surfaced on every death [Cuphead fun-type short @00:49](https://www.youtube.com/watch?v=YXb2jOoJ6ck&t=49s) [Cuphead fun-type short @01:15](https://www.youtube.com/watch?v=YXb2jOoJ6ck&t=75s).
- **Secondary fun: Sensation.** Music, juice, and "how a game feels can be the whole game" [Beat Saber one-word short @01:06](https://www.youtube.com/watch?v=f7VkUSWYJPw&t=66s).
- **Tertiary fun: Submission** (a light dose). Gear numbers go up between fights [Vampire Survivors one-word short @00:27](https://www.youtube.com/watch?v=V4vPnB4Hcss&t=27s), kept out of the fight so attention stays in the moment [Why games feel grindy @00:34](https://www.youtube.com/watch?v=9UpeKknwayc&t=34s).
- **Difficulty stance:** genuinely hard, but every death must feel fair [How hard should your game be short @00:00](https://www.youtube.com/watch?v=6sejMX_vdHU&t=0s). Telegraphs, suspense pauses, and reaction windows replace cheap shots.

## 3. Core loop
```
 ┌───────────── INNER LOOP (2–4 min) ─────────────┐
 │ Fight to the beat → Music Stops event every     │
 │ 10 s (16 beats @96 BPM) → survive Shatter →     │
 │ deal damage → phase change at 66% / 33% HP       │
 └──────────────────────┬──────────────────────────┘
                        ▼  win or lose
 ┌───────────── OUTER LOOP (between fights) ──────┐
 │ Results screen: progress bar + phase reached    │
 │ Loot roll(s) (cascading rarity + pity)          │
 │ Equip gear (weapon, helm, chest, boots)         │
 │ Choose: same tier / next tier / ENCORE wager    │
 └─────────────────────────────────────────────────┘
```
- Inner and outer loops "combo together" [Vampire Survivors one-word short @00:27](https://www.youtube.com/watch?v=V4vPnB4Hcss&t=27s). Losing still pays a smaller loot roll, so failure moves you forward too (*inference* from Diablo "always beatable given enough time and the right build" [How hard should your game be short @00:33](https://www.youtube.com/watch?v=6sejMX_vdHU&t=33s)).
- Long-term goal is broken into milestones: 5 tiers, each with a visible next step [Why games feel grindy @06:10](https://www.youtube.com/watch?v=9UpeKknwayc&t=370s).

## 4. Mechanics
### 4.1 Player (Character / Controls / Camera [Survival game (Seymour) jam @03:44](https://www.youtube.com/watch?v=xr0wY9LtnPU&t=224s))
- **Character:** "the Guest," a small party-goer with a paper crown.
- **Controls:** WASD move. Mouse aims. Left click / J = swing (arc melee). Space = dash with brief invulnerability. Right click / K = "Shove" (knockback that can knock an Usher off a chair).
- **Camera:** top-down, fixed arena. Top-down gives readability and a "subconscious sense of safety" in a chaotic fight [Survival game (Seymour) jam @05:42](https://www.youtube.com/watch?v=xr0wY9LtnPU&t=342s).
- **Responsiveness rule:** zero anticipation frames. The swing pops instantly to the wound-up silhouette and the arc appears the same frame [Responsive game feel short @01:30](https://www.youtube.com/watch?v=jl7OYBo_oIU&t=90s) [Responsive game feel short @02:03](https://www.youtube.com/watch?v=jl7OYBo_oIU&t=123s). Dash starts on the input frame.

### 4.2 Combat feedback (game-feel budget)
| Event | Feedback | Source |
|---|---|---|
| Player hits boss | 40 ms hit-stop, boss flash, damage number, short tick SFX, **vertical** camera shake ≤ 0.08 s | [Camera shake @05:38](https://www.youtube.com/watch?v=lp-AnYMGpQs&t=338s) [Camera shake @06:08](https://www.youtube.com/watch?v=lp-AnYMGpQs&t=368s) |
| Player is hit | Big red flash on the player sprite *and* screen edge, harsh noise-burst "static" SFX, health bar shake | [Sci-Fi Vampire Survivors lessons @12:51](https://www.youtube.com/watch?v=re10Zp6cb1c&t=771s) [Sci-Fi Vampire Survivors lessons @13:24](https://www.youtube.com/watch?v=re10Zp6cb1c&t=804s) |
| Music Stops | Music cuts, slam shake, pitch-down "fermata" drone during the slow, freeze, then Shatter boom | [Gruul musical-chairs short @02:02](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=122s) [Sci-Fi Vampire Survivors lessons @03:22](https://www.youtube.com/watch?v=re10Zp6cb1c&t=202s) |
| Loot drop | Rarity color *and* shape/label; Encore drops have their own gold-star badge for awareness | [Magic Find short @02:15](https://www.youtube.com/watch?v=kJ08SA90Cwg&t=135s) [Sci-Fi Vampire Survivors lessons @12:14](https://www.youtube.com/watch?v=re10Zp6cb1c&t=734s) |
| Chair claimed | Chair ring fills and ticks; Usher on a chair shows a seated pose | [Survival game (Seymour) jam @10:12](https://www.youtube.com/watch?v=xr0wY9LtnPU&t=612s) |

### 4.3 Accessibility
Never rely on color alone [Sci-Fi Vampire Survivors lessons @11:40](https://www.youtube.com/watch?v=re10Zp6cb1c&t=700s). Chairs are rings with a chair icon. Ushers are hollow diamonds and boss projectiles are solid notes. A text log names each Music Stops step. Shake can be reduced to 50% via a toggle, though the default stays "lightly salted" [Camera shake @05:14](https://www.youtube.com/watch?v=lp-AnYMGpQs&t=314s).

## 5. Boss / encounter design: Maestro Grumble
**One-line test:** "Can you improvise a seat under pressure?" (Cheng's template: emotion → mechanic → counter-mechanic → fairness patch; see KB §1.2.)

| Mechanic | What it does | Why (principle) |
|---|---|---|
| **Baton Swipe** | Telegraphed 1 s cone in front of the boss; heavy damage | Readable melee threat; rewards positioning |
| **Note Volley** | Fires a spread of notes on the beat (P1: every 4 beats; P2+: every 2 beats with gaps to weave through) at 96 BPM | Music is the clock; a rhythm you can learn [Sci-Fi Vampire Survivors lessons @03:55](https://www.youtube.com/watch?v=re10Zp6cb1c&t=235s) [Beat Saber one-word short @00:32](https://www.youtube.com/watch?v=f7VkUSWYJPw&t=32s) |
| **THE MUSIC STOPS** (every 16 beats = 10 s; warning "♪ the music is slowing…" at beat 8) | (1) **Downbeat Slam**: knocks the player a *random* distance and direction. (2) **Fermata**: stacking slow, 20% per 0.5 s for 2 s (max 80%), drone pitch falls. (3) **Chairs**: N chairs (N = Ushers alive) appear at random spots, and Ushers sprint to them. (4) **Hold**: everything freezes 0.6 s ("cartoon coyote" beat). (5) **Shatter**: anyone not seated takes 45% max-HP damage (mitigated by armor) | Direct adaptation of Gruul. Random knockback prevents fixed spots [Gruul musical-chairs short @00:34](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=34s). The slow is suspense *and* a fairness window [Gruul musical-chairs short @01:29](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=89s). The hold is the suspense beat [Gruul musical-chairs short @02:02](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=122s) |
| **Ushers** (adds) | Spawn 2 per Music Stops cycle (max 4). Weak, chase the player between cycles, race for chairs during them. Shove or kill an Usher to take its chair | Players must pick a target under pressure, like the kill-order reading of the Anubisath sentinels [Set Monster short @02:10](https://www.youtube.com/watch?v=gcwqvVa_UQM&t=130s). Keeps "musical chairs" competitive with fewer seats than sitters |
| **Phase changes at 66% and 33% HP** | P2: chairs = Ushers − 0 (no spare); Note Volley becomes 3-way. P3: chairs shrink 25% and Baton Swipe gains a second swing | Health-% triggers test execution, not DPS, and don't snowball when overgeared [Prophet Skeram short @01:07](https://www.youtube.com/watch?v=o0dR_AaEstw&t=67s) |
| **Soft enrage** | +15% boss damage every 30 s | Stops "turtle and wait" from trivializing the fight, as with Gruul and Patchwerk [Gruul musical-chairs short @02:35](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=155s) [Patchwerk short @01:41](https://www.youtube.com/watch?v=b2Jw4rsbnpk&t=101s) |
| **Fair tell rule** | Every damaging attack has a visual tell ≥ 0.6 s (Swipe 1 s; Shatter is announced ~3.6 s ahead by a ritardando warning + text, then the music cut) | "Make sure every death is fair" [How hard should your game be short @00:00](https://www.youtube.com/watch?v=6sejMX_vdHU&t=0s) |

*Expected play:* in the first attempts players die to Shatter. After a few they learn to shove Ushers, then to pre-position during the slow, then to weave damage into Note Volley gaps. Players will find unintended tricks (e.g., dash-shoving two Ushers). We'll watch for them in tissue tests and fix bugs and exploits, but celebrate clever play [Prophet Skeram short @02:38](https://www.youtube.com/watch?v=o0dR_AaEstw&t=158s).

## 6. Loot & progression
### 6.1 Gear
4 slots: **Weapon** (damage), **Helm / Chest / Boots** (armor; Boots also add move speed). Rarities: Common, Rare, Epic, Legendary. Each tier step raises item level.

### 6.2 Drop logic
- **Cascading rarity roll** (KB §3): roll Legendary first (3%), then Epic (12%), then Rare (35%), else Common. Adding new items never shifts the legendary rate [Loot system short @01:56](https://www.youtube.com/watch?v=HEsdTuOt-Vk&t=116s).
- **Bad-luck protection (progressive probability, invisible):** each non-legendary roll adds +0.25% to the Legendary chance until one drops, then resets (tuned by a 200k-roll simulation: ≈6% effective legendary rate vs 3% base, worst dry streak ≈70 rolls) [Four ways to control randomness @01:07](https://www.youtube.com/watch?v=AYOzD0Sxt4A&t=67s). *Inference:* this fits a PvE-only game, since Cheng warns against protection in PvP [Four ways to control randomness @08:22](https://www.youtube.com/watch?v=AYOzD0Sxt4A&t=502s).
- **Item slot selection by marble bag** (helm, chest, boots, weapon ×1 each per bag) so you never get 5 boots in a row [Control randomness short @00:33](https://www.youtube.com/watch?v=2anY9ICA-Pg&t=33s) [Marble bag deep dive @02:49](https://www.youtube.com/watch?v=mKVGrWrEqLQ&t=169s).
- Win = 2 rolls; loss = 1 consolation roll if you dealt ≥25% of the boss HP; Encore win = 4 rolls. Optional content must pay [Buru short @01:24](https://www.youtube.com/watch?v=esBii7uPwcw&t=84s).

### 6.3 Encore wager (single significant decision)
Before a fight, the player may toggle **ENCORE**: boss +40% HP and damage, and a win gives 4 rolls with Legendary base 3% → 8%. Encore loot gets a gold star. This is the Sage's-set pattern: one big, visible, opt-in trade-off instead of a creeping Magic Find stat [Magic Find short @02:15](https://www.youtube.com/watch?v=kJ08SA90Cwg&t=135s).

### 6.4 Tiers
Boss tier 1–5. Each tier raises boss level (+1), boss HP ×1.35, boss damage ×1.25. Beating a tier unlocks the next (milestones every ~10–20 min) [Why games feel grindy @06:10](https://www.youtube.com/watch?v=9UpeKknwayc&t=370s).

## 7. Key formulas
- **Mitigation = A / (A + K)**, with **K = 40 + 30 × attacker (boss) level**. Using the attacker's level means leveling never lowers mitigation [Armor formula Pt 2 short @01:09](https://www.youtube.com/watch?v=HecTqtkoWyg&t=69s).
  - *Tuning (Cheng's 4 steps* [Armor formula Pt 2 short @01:09](https://www.youtube.com/watch?v=HecTqtkoWyg&t=69s) [Armor formula Pt 2 short @01:45](https://www.youtube.com/watch?v=HecTqtkoWyg&t=105s)*):* (1) target ~33% mitigation for a player in at-tier Rare gear; (2) pretty per-slot armor per item level: Chest 6, Helm 4, Boots 3 → (3) 13 per ilvl. At ilvl = tier × 5 (tier 1 = ilvl 5, 65 armor) we want 33%, so 65/(65+K) = 0.33 → K ≈ 132, and the formula gives 40 + 30×3 = 130 at boss level 3. *(Boss level = tier + 2.)*
  - Survivability stays linear in armor: EHP = HP × (A + K) / K [Simple Math / Armor Pt 1 short @02:13](https://www.youtube.com/watch?v=IzHAjV8YEW4&t=133s).
- **Rarity multipliers:** Common 1.0, Rare 1.25, Epic 1.55, Legendary 1.9 on the item's base stat. Legendaries also add one affix (e.g., +10% dash distance, Shove cooldown −30%).
- **Player damage per swing** = weaponDmg × (1 ± 10% variance). The boss has no armor in the prototype (later: the same formula in reverse).
- **Soft enrage:** bossDmgMult = 1.15^(floor(t / 30 s)).
- **Shatter damage** = 0.45 × playerMaxHP × (1 − mitigation). Unseated without armor = 45%; with ~33% mitigation ≈ 30%, so armor turns a 3-shatter death into a 4-shatter death (*inference*: makes gear upgrades felt).
- **Music clock:** 96 BPM → 1 beat = 0.625 s; 16 beats = 10 s = one Music Stops cycle [Sci-Fi Vampire Survivors lessons @03:55](https://www.youtube.com/watch?v=re10Zp6cb1c&t=235s).

## 8. Game-feel goals (acceptance criteria)
1. Input-to-visible-response on the same frame for swing and dash (0 anticipation frames) [Responsive game feel short @02:03](https://www.youtube.com/watch?v=jl7OYBo_oIU&t=123s).
2. Camera shake: vertical only, ≤ 0.08 s, amplitude ≤ 6 px for hits and ≤ 12 px for Slam/Shatter [Camera shake @05:38](https://www.youtube.com/watch?v=lp-AnYMGpQs&t=338s).
3. Damage taken is impossible to miss: on-sprite flash + edge vignette + static SFX [Sci-Fi Vampire Survivors lessons @13:24](https://www.youtube.com/watch?v=re10Zp6cb1c&t=804s).
4. Music Stops reads in under 1 s: music cut + slam + text "THE MUSIC STOPS!" [Survival game (Seymour) jam @09:44](https://www.youtube.com/watch?v=xr0wY9LtnPU&t=584s).
5. Death screen shows a **progress bar with phase markers** and "You reached Phase X — boss at Y%" [Cuphead fun-type short @00:49](https://www.youtube.com/watch?v=YXb2jOoJ6ck&t=49s).

## 9. Prototype scope vs later scope
| Prototype (built now) | Later |
|---|---|
| 1 boss (Maestro Grumble), 3 phases, Music Stops cycle, Ushers, soft enrage | Bosses 2–3: **Hot Potato Hydra** (pass a bomb between heads), **Red Light Golem** (move only when its eye is closed) |
| Player move / swing / dash / shove; instant-response swing | Controller support, remappable keys, more weapons with clear niches [Sci-Fi Vampire Survivors lessons @07:15](https://www.youtube.com/watch?v=re10Zp6cb1c&t=435s) |
| Synth music @96 BPM + SFX via WebAudio (no assets) | Composed soundtrack (music first, then encounter timing [Rhythm Runner jam recap @10:04](https://www.youtube.com/watch?v=6c-41ghE5yI&t=604s)) |
| 4-slot gear, cascading loot, progressive pity, marble-bag slot pick, Encore wager | Affix pool, crafting, collection log |
| Armor formula, tiers 1–5, localStorage save | 2-player co-op "duet" mode for fellowship and reciprocity [Friendship short @01:43](https://www.youtube.com/watch?v=bUzdEtf52bs&t=103s) [It Takes Two fun-type short @00:23](https://www.youtube.com/watch?v=j_b4kZJWRRs&t=23s) |
| Death/victory screen with progress bar | Accessibility menu (shake slider exists; add colorblind palettes, slow mode) |
| Headless smoke test + screenshot | Tissue-test sessions with the 15-second script [Tissue test short @01:18](https://www.youtube.com/watch?v=FgbdQS4pLHA&t=78s) |

**Process plan:** first playable = player + boss + Music Stops cycle (the "heart") before any loot UI [Game Jam tips 1-5 @06:25](https://www.youtube.com/watch?v=3N_ikDs0WYI&t=385s). Say no to features (weapons, more bosses) until the core encounter is fun [Too many good ideas short @00:33](https://www.youtube.com/watch?v=ylcd0Yryk74&t=33s).

## 10. Principle → feature traceability
| # | KB principle (Cheng) | Source | Feature in Last Chair Standing |
|---|---|---|---|
| 1 | Emotion-first boss design (musical chairs) | [Gruul musical-chairs short @00:00](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=0s) | Whole Maestro concept; each boss = a party-game feeling |
| 2 | Remove pre-planned solutions with randomness | [Gruul musical-chairs short @00:34](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=34s) | Downbeat Slam random knockback; random chair spots |
| 3 | Slow as fairness window + drama | [Gruul musical-chairs short @01:29](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=89s) | Fermata stacking slow before Chairs |
| 4 | Suspense beat before payoff | [Gruul musical-chairs short @02:02](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=122s) | 0.6 s Hold freeze before Shatter |
| 5 | Soft enrage stops degenerate play | [Gruul musical-chairs short @02:35](https://www.youtube.com/watch?v=LsY3FHxBVgw&t=155s) [Patchwerk short @01:41](https://www.youtube.com/watch?v=b2Jw4rsbnpk&t=101s) | +15% boss damage per 30 s |
| 6 | %-HP phase triggers test execution | [Prophet Skeram short @01:07](https://www.youtube.com/watch?v=o0dR_AaEstw&t=67s) | Phases at 66% / 33% |
| 7 | Read & choose kill order | [Set Monster short @02:10](https://www.youtube.com/watch?v=gcwqvVa_UQM&t=130s) | Ushers compete for chairs; shove/kill choice |
| 8 | Fair deaths in a challenge game | [How hard should your game be short @00:00](https://www.youtube.com/watch?v=6sejMX_vdHU&t=0s) | ≥0.6 s tells; Music Stops announced by music cut |
| 9 | Micro-victories on defeat | [Cuphead fun-type short @00:49](https://www.youtube.com/watch?v=YXb2jOoJ6ck&t=49s) | Death progress bar + phase reached + consolation loot |
| 10 | Cut anticipation for responsiveness | [Responsive game feel short @01:30](https://www.youtube.com/watch?v=jl7OYBo_oIU&t=90s) | Instant swing pose/arc; dash on input frame |
| 11 | Camera shake = salt, vertical, short | [Camera shake @05:38](https://www.youtube.com/watch?v=lp-AnYMGpQs&t=338s) | Vertical shake ≤0.08 s; toggle to 50% |
| 12 | Damage feedback where eyes are | [Sci-Fi Vampire Survivors lessons @12:51](https://www.youtube.com/watch?v=re10Zp6cb1c&t=771s) | On-sprite flash + static SFX |
| 13 | Music reinforces the core timer | [Sci-Fi Vampire Survivors lessons @03:22](https://www.youtube.com/watch?v=re10Zp6cb1c&t=202s) | 96 BPM; 16-beat phrase = Music Stops |
| 14 | Don't rely on color | [Sci-Fi Vampire Survivors lessons @11:40](https://www.youtube.com/watch?v=re10Zp6cb1c&t=700s) | Shape-coded chairs, Ushers, notes, loot |
| 15 | A/(A+K) armor; K from attacker level | [Simple Math / Armor Pt 1 short @02:13](https://www.youtube.com/watch?v=IzHAjV8YEW4&t=133s) [Armor formula Pt 2 short @01:09](https://www.youtube.com/watch?v=HecTqtkoWyg&t=69s) | Mitigation formula with K = 40 + 30 × boss level |
| 16 | Cascading rarity rolls | [Loot system short @01:56](https://www.youtube.com/watch?v=HEsdTuOt-Vk&t=116s) | Legendary → Epic → Rare → Common |
| 17 | Control bad luck in PvE | [Four ways to control randomness @01:07](https://www.youtube.com/watch?v=AYOzD0Sxt4A&t=67s) [Control randomness short @00:33](https://www.youtube.com/watch?v=2anY9ICA-Pg&t=33s) | Progressive legendary pity; marble-bag slot picker |
| 18 | Reward-rate trade-off as one visible decision | [Magic Find short @02:15](https://www.youtube.com/watch?v=kJ08SA90Cwg&t=135s) | Encore wager with gold-star loot |
| 19 | Optional content must pay | [Buru short @01:24](https://www.youtube.com/watch?v=esBii7uPwcw&t=84s) | Encore pays 4 rolls; losses still pay 1 |
| 20 | Inner/outer loops combo; milestones vs grind | [Vampire Survivors one-word short @00:27](https://www.youtube.com/watch?v=V4vPnB4Hcss&t=27s) [Why games feel grindy @06:10](https://www.youtube.com/watch?v=9UpeKknwayc&t=370s) | Fight → loot → equip → tier unlock |
| 21 | Top-down camera for safety/readability | [Survival game (Seymour) jam @05:42](https://www.youtube.com/watch?v=xr0wY9LtnPU&t=342s) | Fixed top-down arena |
| 22 | First playable early; say no | [Game Jam tips 1-5 @06:25](https://www.youtube.com/watch?v=3N_ikDs0WYI&t=385s) [Too many good ideas short @00:33](https://www.youtube.com/watch?v=ylcd0Yryk74&t=33s) | Build order; later-scope list |
| 23 | Tissue testing | [Tissue test short @01:18](https://www.youtube.com/watch?v=FgbdQS4pLHA&t=78s) | Playtest plan (§11) |

## 11. Playtest plan
Run tissue tests with the 15-second script ("we are testing the game, not you… If you get stuck, I'm not going to help"), ideally run by someone other than Jeff [Tissue test short @01:18](https://www.youtube.com/watch?v=FgbdQS4pLHA&t=78s) [Tissue test short @02:15](https://www.youtube.com/watch?v=FgbdQS4pLHA&t=135s). Ask testers to say their feelings out loud and log where they die [Board game insiders @26:55](https://www.youtube.com/watch?v=qG3oX9H8RAo&t=1615s). Success signals: testers say "one more try" after a death, and they understand Shatter by attempt 3.

## 12. Open questions / risks
- A solo "musical chairs" depends on the Ushers being readable competitors; if they feel random, consider showing their target chair with a dotted line.
- Will the 10 s cycle feel repetitive? Mitigation: phase escalations and later bosses. Watch for grind feelings [Why games feel grindy @03:22](https://www.youtube.com/watch?v=9UpeKknwayc&t=202s).
- Is the progressive pity too generous? First simulation pass: +1% per miss gave ≈9.5% effective legendary rate, so it was cut to +0.25% (≈6%). Revisit after playtests.

## 13. Prototype status (2026-11-13)
Built in `prototype/`: vanilla JS + canvas, no build step, relative paths only (GitHub Pages-ready, **not published**). Implemented: player move/swing/dash/shove with zero-anticipation swing; Maestro Grumble with Baton Swipe, Note Volley, the full Music Stops cycle (warning → random Slam → Fermata stacking slow → chairs + racing Ushers → Hold → Shatter), phases at 66%/33%, and the soft enrage; synthesized 96 BPM music and SFX; 4-slot loot with cascading rarity, progressive pity, marble-bag slot picker, Encore wager, and A/(A+K) armor; tiers 1–5 with unlock and localStorage save; results screen with a Cuphead-style progress bar.
Tuning pass 1 (from the bot smoke test): P1 note cadence was halved, note damage 10→7, boss base HP 1400→1200. A naive bot that doesn't dodge reaches Phase 2 at Tier 1 (≈45–65% boss HP left); with boosted debug gear it wins and unlocks Tier 2. **Human playtests still needed.**
