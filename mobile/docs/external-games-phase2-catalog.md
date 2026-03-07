# External Games Phase 2 Catalog (20 Titles)

> Goal: replace the in-app custom game logic with externally developed games, while keeping app economy, ads, and online invite flow.
>
> Status legend:
> - `Ready`: can be imported now (license is permissive or clearly open for integration).
> - `Verify`: requires license clarification before production.
> - `Provider`: requires partner account/API agreement.

## A) Open-source candidates (self-hostable in app WebView)

| # | Game | Source | License | Status | Integration Difficulty |
|---|------|--------|---------|--------|------------------------|
| 1 | 2048 | https://github.com/gabrielecirulli/2048 | MIT | Ready | Low |
| 2 | Invaders | https://github.com/susam/invaders | MIT | Ready | Low |
| 3 | Evade and Destroy | https://github.com/mikkun/evade-and-destroy | MIT | Ready | Low |
| 4 | HTML Brick Game | https://github.com/ChanMeng666/html-brick-game | MIT | Ready | Low |
| 5 | Phaser 3 Snake | https://github.com/rblopes/phaser-3-snake-game | MIT | Ready | Low |
| 6 | Space Crusade | https://github.com/Loopeex/space-crusade | MIT | Ready | Medium |
| 7 | Elemental One | https://github.com/voithos/elemental-one | MIT | Ready | Medium |
| 8 | HexGL | https://github.com/BKcore/HexGL | MIT | Ready | Medium |
| 9 | Reflexio | https://github.com/ketanhwr/reflexio | MIT | Ready | Low |
| 10 | Phaser Editor Volcano | https://github.com/phaserjs/editor-example-volcano | MIT | Ready | Medium |
| 11 | Space Invaders (Stryker) | https://github.com/StrykerKKD/SpaceInvaders | MIT | Verify (archived repo) | Low |
| 12 | Circus HTML5 | https://github.com/Gamegur-us/circushtml5 | No SPDX | Verify | Medium |
| 13 | BrowserQuest | https://github.com/mozilla/BrowserQuest | Other (Mozilla license) | Verify | High |
| 14 | Ludum Dare 29 (Drill Bunny) | https://github.com/DreamShowAdventures/LudumDare29 | No SPDX | Verify | Medium |

## B) Provider catalog candidates (external studios, ready-made libraries)

| # | Provider Pack | Source | License/Terms | Status | Integration Difficulty |
|---|---------------|--------|---------------|--------|------------------------|
| 15 | GamePix Arcade Pack A | https://partners.gamepix.com/publishers | Partner agreement | Provider | Medium |
| 16 | GamePix Action Pack B | https://partners.gamepix.com/publishers | Partner agreement | Provider | Medium |
| 17 | GameDistribution Hyper-Casual Pack A | https://github.com/GameDistribution/GD-HTML5 | Partner agreement | Provider | Medium |
| 18 | GameDistribution Shooter Pack B | https://github.com/GameDistribution/GD-HTML5 | Partner agreement | Provider | Medium |
| 19 | CrazyGames Partner Pack A | https://docs.crazygames.com/ | Partner agreement | Provider | Medium/High |
| 20 | CrazyGames Partner Pack B | https://docs.crazygames.com/ | Partner agreement | Provider | Medium/High |

---

## Mobile Integration Rules (already aligned in app architecture)

1. **Ads / Continue Flow**
   - Keep app-level ad gate (watch ad to continue sessions).
   - Provider ads stay optional and must not conflict with app policy.

2. **Online Invite Flow**
   - `Online Quick Match`: existing websocket matchmaking.
   - `Global Chat Invite`: diamond-paid entry.
   - `Friend Invite`: free for friends list.

3. **Economy Binding**
   - On game end, map score to app points with controlled range.
   - Keep source tagging per game for analytics.

---

## Immediate Execution Order

1. Import 8 `Ready` MIT games first (1..8).
2. Keep 6 `Verify` games behind legal check (9..14) until approved.
3. Replace remaining slots with provider packs (15..20) once account terms are signed.

