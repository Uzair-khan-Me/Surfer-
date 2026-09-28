# AFTERLIGHT RUN

An original, playable three-lane endless runner built with **TypeScript, Three.js and Vite**. Chase the last light through a procedural nighttime transit district. No backend, accounts, asset service, or external game server.

## Install and run

Requires **Node.js 20.19+** (or 22.12+).

```sh
npm install
npm run dev
```

Open the URL printed by Vite. The development server binds to `0.0.0.0`; a phone on your local network can use your computer's LAN address and port 5173. The Arena preview host is allowed as well.

## Production

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static web host. No environment variables or server are required. Fonts are bundled locally, not fetched from a font CDN.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Start / retry | Enter or Space, or the on-screen button | Tap the start / retry button |
| Switch lane | A / D or ← / → | Swipe left / right |
| Jump | Space / W / ↑ | Swipe up |
| Slide | S / ↓ | Swipe down |
| Pause / resume | P / Escape or pause button | Tap pause / resume |
| Mute / unmute | Sound button | Sound button |

Swipes need at least 35 pixels of movement. Controls do not scroll the page. Switching tabs pauses the run; resume explicitly when ready.

- Orange barriers: jump or change lanes.
- Blue overhead gates: slide or change lanes.
- Trains: change lanes; they are too tall to jump.
- Collect gold coins: **+10 points** each. Distance awards **3 points per meter**.
- Speed starts at 12 m/s, rises by 2 m/s every 30 seconds, and caps at 20 m/s.
- Best score is saved in `localStorage` under `afterlight.best`. If storage is unavailable, the game retains the best score for the session.

## Project structure

```text
src/
  main.ts                 Entry point and locally bundled fonts
  style.css               Responsive menu, HUD and overlays
  config/constants.ts     Lane size, chunks, jump and slide tuning
  game/
    Game.ts               Lifecycle, fixed-step simulation, camera, reset
    GameState.ts          Game and player state enums
    Player.ts             Procedural character and movement state machine
    Input.ts              Keyboard and touch gesture translation
    Track.ts              Eight recycled 30m track chunks
    Patterns.ts           Validated, fair obstacle pattern generation
    Encounters.ts         Fixed pool of eight obstacle rows
    Obstacle.ts           Three obstacle types and collider dimensions
    Coin.ts               Fixed pool of 72 animated coins
    Collision.ts          Simple player/obstacle bounding-volume overlap
    Difficulty.ts         Time-based speed and spacing progression
    Score.ts              Distance, coins and local best score
  world/
    TrackChunk.ts         Static road, rails, buildings, platforms and signs
    Environment.ts        Procedural moon, stars, skyline and sign textures
    primitives.ts         Shared geometry and material cache
    batch.ts              Static geometry merged by material
    Particles.ts          Reused instanced coin particles
  audio/AudioManager.ts   Optional Web Audio oscillator effects
  ui/UIManager.ts         Menu, HUD, help, pause and game-over UI
public/assets/            Reserved for future original assets
 tests/
  core.test.ts            Simulation and generation tests
  browser.mjs             Desktop and mobile browser acceptance tests
```

### Implementation notes

The player stays near world Z=0 while chunks and encounters move toward the camera. The simulation runs at a fixed 120 Hz inside `requestAnimationFrame`, with a 100ms frame-time cap to avoid collision tunneling and giant catch-up jumps after stalls. Render pixel ratio is capped by an adaptive quality tier (at most 1.75) and updates on resize / device pixel ratio changes.

Every obstacle row contains at most two obstacles and a validated fully open lane. At maximum difficulty rows are at least 24m apart. After accounting for a 6m train and the player's depth, there is sufficient time to cross both lanes before the next row. The first two rows introduce jumping and sliding; they can also be bypassed by switching lanes. Difficulty increases speed and reduces row spacing, never removing the clear-lane guarantee.

Rigid geometry is merged by surface profile once at startup, and repeated details are instanced. Geometry and materials are shared; chunks, obstacle meshes, coins and particles are reused. Restart resets the entire simulation and camera without reloading or growing the object pool. Audio is initialized only on user interaction and failures are non-fatal.

All character, vehicle, environment, coin and sign artwork is generated in code. Sounds are synthesized with Web Audio. The locally bundled **Barlow Condensed** and **DM Sans** fonts are open-source fonts distributed via Fontsource under the SIL Open Font License; package licenses are included with the dependencies.

## Verification

```sh
npm test
npm run build
```

Browser tests require the dev server running in another terminal:

```sh
npx playwright install chromium
npm run test:browser
```

On Linux, Playwright may additionally require `npx playwright install-deps chromium`. To use an existing compatible Chromium binary, set `CHROMIUM_EXECUTABLE=/path/to/chromium`. Test screenshots go into ignored `.test-artifacts/`.

Test coverage includes:
- Lane bounds, smooth movement, jump lockout, landing, slide collider and reset.
- Jumping over a real barrier and sliding under a real overhead gate.
- 10,000 valid generated patterns and a ten-minute collision-checked simulation at maximum difficulty.
- Track pool continuity, coin collection, score math, speed cap and all four swipe directions.
- Browser menu → start → 65 seconds of simulated survival → crash → persisted best → retry.
- Browser keyboard events, touch events, portrait (390×844) and landscape (844×390) layouts, with no page errors.

The browser survival test advances the same production simulation in fixed steps; it is not a 65-second real-time manual playtest. Touch was verified through Chromium's emulated touch events, **not on physical phone hardware**.

## Known limitations

- MVP geometry and simple bounding-volume collisions, not skeletal character animation or detailed physics.
- Requires a browser with WebGL2. Actual low-end device frame rates and iOS Safari behavior still need physical-device testing.
- Audio availability depends on browser policy and device silent-mode behavior; gameplay is independent of audio.
- Pattern variety is intentionally modest. There are no power-ups, shops, missions, ads, accounts, leaderboards or multiplayer.
- Camera, jump and slide timing are tuned for this MVP; playtesting with people is still needed to judge long-term game feel.
- Severe frame stalls slow simulation instead of advancing the player into unseen obstacles.

## Recommended next steps

1. Playtest on physical iOS / Android phones and tune swipe thresholds, jump timing and readability.
2. Add more validated patterns, preserving the safe-lane and minimum-spacing invariants.
3. Profile the quality tiers on low-end mobile hardware and tune render-distance / pixel budgets.
4. Playtest the new procedural poses and add accessibility settings before expanding the game's scope.

## Lightweight 3D visual upgrade

The rendering layer has been upgraded without changing gameplay. New render-only modules live in `src/rendering/`:

- `PlayerModel.ts`: faceted head/hair, tapered torso, articulated arm/leg joints, shoes, courier pack, and distinct run/jump/fall/slide poses. The slide is a posed model rather than a vertically squashed block.
- `ObstacleModels.ts`: shared, baked train/barrier/gate templates; single-segment bevels, train cab, door panels, divided windows, roof vents, bogies and emissive headlamps. Collider sizes are unchanged.
- `TrackModel.ts`: raised rail crowns/webs/feet, dimensional ballast beds, instanced ties and supports, and one shared 64×64 ballast texture.
- `CityModel.ts`: modular architecture with front/side façades, roof/parapet depth, instanced framed windows, balconies and rooftop equipment. Decorative variation is deterministic and does not call the gameplay random generator.
- `CoinRenderer.ts`: one instanced draw for all 72 beveled metallic coins. Original coin objects remain the authoritative collection/transform handles; the renderer only reads them.
- `ContactShadows.ts`: a grounded, height-responsive player shadow and pooled nearby-obstacle contact shadows, sharing one 32×32 radial texture. No dynamic shadow maps.
- `QualityManager.ts`: capability-based initial quality, sustained-frame-time monitoring and render-only degradation.
- `geometry.ts`: cached, low-segment geometry shared by the procedural models.

### Rendering budgets and quality

One directional moon/key light and one hemisphere light illuminate the world. There is no bloom, SSAO, volumetric lighting, screen-space reflection, or post-processing chain. Scene depth comes from light-facing surfaces, darker side faces, bevel highlights, fog, layered silhouettes and a small moon-glow sprite. The existing camera follow is retained with a maximum 0.22m speed-based forward adjustment.

Rigid models are merged by surface profile with vertex paint colors, rather than generating a draw call per paint color. Coins, windows, sleepers, rail supports and background towers are instanced. Details are distance-culled in recycled chunks; track rails, obstacles, player and collectible visibility are never removed by quality scaling.

| Tier | Maximum pixel ratio | Approximate pixel budget | Decorative range | Sleeper range |
| --- | --- | --- | --- | --- |
| High | 1.75 | 2.4 million | 65m | 120m |
| Medium | 1.35 | 1.2 million | 38m | 85m |
| Low | 1.0 | 650,000 | No balcony/equipment/support detail | 55m |

Low preserves the player's contact shadow and omits obstacle contact shadows. Distant architecture becomes simpler silhouettes as windows/detail are culled. All tiers use the same physics and input handling. Coarse-pointer devices normally start on Medium; limited reported CPU/memory starts on Low. After warm-up, sustained slow active frames lower quality automatically. Downgrades are sticky for the session to avoid oscillation; no user configuration is required. Tab suspension, paused runs, and large one-off stalls do not trigger the load detector. Pixel ratio has a 0.25 floor for unusually large viewports.

### Visual regression verification

```sh
npm test
npm run build
# With the development server running and Playwright Chromium installed:
npm run test:browser
npm run test:visual
```

The visual upgrade adds:
- Byte-for-byte locks for movement constants, input, coin logic, generation, collision, difficulty, scoring and track recycling modules.
- Method-body locks for simulation, lifecycle, lane/jump/slide actions and collider dimensions.
- An exact 720-step pre-upgrade player physics trace, including jumping, sliding, lane movement and reset.
- Tests for quality downgrades, shared model geometry, instanced coin reset/visibility, and slide silhouette clearance.
- Desktop/portrait/landscape screenshots, a two-light assertion, a <200-draw-call regression budget, and stable GPU allocations through five restarts.

A representative **1280×800 fixed scene** measured approximately **125 / 119 / 110 draw calls** and **81k / 72k / 60k triangles** on High / Medium / Low, using **five small GPU textures**. Counts vary with generated obstacles and camera visibility. The browser test saves actual metrics in ignored `.test-artifacts/visual-metrics.json`.

These are rendering-cost measurements in headless Chromium with software WebGL, **not a claim of measured mobile GPU frame rate**. Gameplay passed desktop and emulated mobile checks, but physical Android/iOS profiling remains recommended. There are no external image/model downloads or new runtime dependencies for this upgrade.
