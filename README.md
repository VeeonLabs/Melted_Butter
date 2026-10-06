# Melted Butter 🧈

A private two-player tic-tac-toe game, styled as a little comic/manhwa universe for two, with an owner-only studio for themes, symbols, artwork and reactions.

One owner, one invited player. No lobby, no matchmaking, no leaderboard, no public accounts.

## Run it

```bash
npm install
cp .env.example .env.local   # then set OWNER_PASSCODE and OWNER_SESSION_SECRET
npm run dev                  # game at http://localhost:3000, studio at /admin
npm test                     # logic, config, reactions, uploads, auth
npm run typecheck
npm run lint
```

Without both env vars, `/admin` returns 404, so the studio doesn't exist on that deployment.

## How it fits together

```
app/
  page.tsx                 Player game (no link to the studio)
  admin/page.tsx           Studio. Server-side owner check before anything renders
  admin/login/             Passcode form → signed httpOnly cookie
  admin/actions.ts         signIn / signOut server actions
lib/
  game/                    Rules, reducer, GameStore (unchanged architecture; players are PLAYER_ONE / PLAYER_TWO)
  config/                  GameConfig types, 10 theme presets, the 50 slots, defaults,
                           normalisation, ConfigStore, theme resolution, reaction engine
  assets/                  Asset type, upload validation, AssetStore (IndexedDB blobs now)
  auth/                    Owner session token + the single owner check
components/
  game/                    Board, cells, symbols, avatars, status, reactions, chapter cards, effects
  media/                   BlendedImage (all image blending), HamsterArt
  providers/               AssetProvider, ConfigProvider
  studio/                  Melted Butter Studio: sections, controls, live preview
```

Three storage boundaries, each an interface with a local implementation today:

| Interface    | Now                         | Supabase later                                     |
| ------------ | --------------------------- | -------------------------------------------------- |
| `GameStore`  | localStorage                | `games` row + Realtime channel per private game id |
| `ConfigStore`| localStorage                | one `game_configs` row (owner writes, player reads)|
| `AssetStore` | IndexedDB blobs, object URLs| private Storage bucket + `assets` table, signed URLs|

The owner check lives only in `lib/auth/owner.ts`. Swapping to Supabase Auth means replacing `getOwnerSession()` with `supabase.auth.getUser()` and comparing to an `OWNER_USER_ID`. No signup flow exists, so nobody else can become owner.

## Themes ("worlds")

23 theme packages live in `lib/themes/packages/`, one file each. A package is configuration only: palette, typography, card material, buttons, texture, background, scene layout, seat style, board style and frame, symbols, 2–4 artwork pieces, effects, result presentation, flourish, chapter card, chat bubble and sticker style, motion personality and sound profile.

The shared vocabulary for all of these is in `lib/themes/options.ts` (types, sanitising and Studio controls all come from it). `ThemeStage` turns the resolved package into CSS variables and `data-*` attributes, and `app/globals.css` styles each variant once. There is no per-theme branching in components.

**Adding a theme:** create `lib/themes/packages/<id>.ts` with `defineTheme({...})`, add it to `registry.ts`, and add the id to `ThemeId` in `types.ts`. `npm test` then checks its contrast, its 2–4 art pieces, and that it differs structurally from every other theme.

Scene breakpoints are measured on the stage itself (`ThemeStage` publishes `data-size` tokens), so the narrow Studio preview shows exactly the phone composition.

All placeholder artwork (`components/themes/Motifs.tsx`) is original SVG drawn for this project. Owners can replace any piece with their own image in Theme Studio. Only upload art you have the rights to use.

The player can switch worlds from the game's "World" button (owner can disable this and choose which worlds are offered). Her choice is stored separately from the owner's config.

## Comic worlds & world artwork

12 comic worlds (Pearl Boy, Low Tide in Twilight, Roses and Champagne, Painter of the Night, Codename: Anastasia, Nerd Project, Passion, Jinx, Love Jinx, Borderline, Room Without Windows, Blossoms of the White Night) plus 11 general worlds. The comic identity comes from artwork the owner uploads; the app ships only original placeholders.

**World Artwork (Studio):** every world has 24 artwork roles (`lib/worlds/roles.ts`):

| Role | Recommended |
| --- | --- |
| Main background — Desktop / Tablet / Mobile | 1920×1080 / 1366×1024 / 1080×1920 |
| World selector preview | 400×250 |
| World header banner | 1200×300 |
| Board backdrop | 800×800 |
| Player avatars, symbol artwork, cell styles, win/lose/draw overlays | 512×512 |
| Win/lose/draw reactions, special moments 1–3 | 800×400 |

Roles that correspond to one of the 50 slots (avatars 1–2, symbols 3–4, reactions 11–14 and 20, moments 44/42/47) override that slot only while their world is active. Missing device backgrounds fall back desktop → tablet → mobile. Sizes are recommendations; Studio shows the real resolution and flags a very different shape.

**Collage wall** (`lib/worlds/collage.ts`, `components/themes/CollageLayer.tsx`): a deterministic masonry wall of panels, photos, film, paper and tape fills the stage behind the scene. The scene is an opaque sheet holding the title, cards, board, results and controls, so artwork surrounds the game but can never cover it. Tiles fully behind the sheet are not rendered. Owner "collage pieces" replace the placeholders; an owner main background replaces the placeholder wall. Per world: Full / Light (edges) / Off.

Only the active world's images are requested; images load lazily and decode asynchronously.


## Studio

Game Identity, Theme Studio, World Artwork, Image Studio (50 slots), Symbol Studio, Reaction Studio, Comic / Hamster / Space Mode, Asset Library, Live Preview, Save / Discard.

All edits go into a draft that the live preview renders with the real game components. **Save changes** (or Ctrl/Cmd+S) publishes it; **Discard changes** throws it away. Library uploads, replacements and deletions apply immediately. Deleting an image that's in use asks first and clears it from every slot.

### The 50 slots

| Slots | Group | Used for |
| --- | --- | --- |
| 1–10 | Player & character | Avatars, image symbols, alternate (winner) avatars, Comic Mode characters |
| 11–20 | Win & loss reactions | Player-specific victory/defeat plus pooled reactions and draw |
| 21–30 | Comic panels | Chapter cards and comic result spreads, rotating |
| 31–40 | Backgrounds | One per theme; 31 is the fallback for all |
| 41–50 | Special moments | Rematch, streaks, perfect win, close match, last move, celebration, loading, event, secret |

Empty slots fall back to drawn art (symbols, initials, hamsters), so the game never shows a broken image.

### Uploads

PNG, JPG, WebP and SVG. Max 8 MB (SVG 1 MB), 32–6000 px per side. SVGs with scripts or embedded content are rejected, and every image is drawn through `<img>`, where scripts can't run anyway. Images are stored as blobs, never base64 and never inside the config.

Only upload artwork you have the right to use. The app never fetches or bundles third-party art.

## Supabase phase (not implemented)

- Tables: `games` (id, board/state JSON, version, player_one_id, player_two_id), `game_configs`, `assets`; a private `assets` bucket.
- RLS: config and assets writable only by the owner; a game row readable/writable only by its two seated players.
- The second player joins with a one-time invite token that binds their auth user to `player_two_id`.
- Moves go through a server function that loads the row, runs `gameReducer`, and rejects if `version` changed or it isn't that player's turn (`move.player` already exists for this).
- Realtime broadcasts the new state; presence shows who's here; reconnect = reload the row.
- The reaction engine is seeded from game id + round, so both devices already pick the same reaction.

## Windows/Turbopack Google Font workaround

If `next dev` shows `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`, this is a Next.js/Turbopack `next/font/google` resolution issue rather than a missing application file. The project scripts intentionally use Webpack for development and production builds to avoid that Turbopack path while retaining the existing Google-font design.

If the error still appears after pulling the project, stop the dev server, delete `.next`, run `npm install`, and start again with `npm run dev`.

## Theme Artwork

Studio now includes a dedicated **Theme Artwork** section. It is separate from World Artwork and lets the owner manually curate presentation artwork for each theme without changing game logic.

Available frontend slots:

- Hero / Top
- Page Background
- Game Background
- Decorative Left / Right
- Card Artwork
- Result Artwork
- Mobile Background
- Desktop Background
- Footer Artwork
- Outro Artwork
- Custom 1 / Custom 2

Each slot supports choosing an existing Asset Library image or uploading a new one, then adjusting crop, focal point, opacity, blending, framing and other presentation controls. Changes remain in the draft until **Save changes**.

The live Studio preview uses the same phone, tablet and desktop device modes as the rest of the Studio. Mobile Background is preferred on phone-sized previews, Desktop Background on wide previews, and Page Background is the fallback. Empty slots leave the existing theme visuals untouched.

Theme Artwork does not replace World Artwork. World-specific backgrounds, collage pieces, player art and reaction roles continue to work independently and take precedence where their existing role system applies.
#   M e l t e d _ B u t t e r  
 