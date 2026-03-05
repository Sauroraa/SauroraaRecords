# Sauroraa Music - Design System & App

## File Name
`Sauroraa Music - Design System & App`

## Figma Pages
1. `01 Foundations`
2. `02 Components`
3. `03 Layouts`
4. `04 Pages`
5. `05 Prototypes`

## 01 Foundations

### Colors
- `bg.primary`: `#050507`
- `surface.default`: `#0B0B10`
- `card.default`: `#12121A`
- `accent.violet`: `#7B4CFF`
- `accent.cyan`: `#00D1FF`
- `text.primary`: `#FFFFFF`
- `text.secondary`: `#9AA0AA`
- `accent.gradient`: `linear-gradient(135deg, #7B4CFF, #00D1FF)`

### Typography
- `hero`: Space Grotesk / Bold / 48px
- `heading`: Space Grotesk / Semibold / 24px
- `body`: Inter / Regular / 16px
- `ui.small`: Inter / Medium / 14px
- `data`: JetBrains Mono

### Core Tokens
- `radius.md`: `14px`
- `shadow.lg`: `0 10px 40px rgba(0,0,0,0.4)`
- `glass.blur`: `12px`

## 02 Components

### `TrackCard`
- Structure: Cover, Title, Artist, BPM, Play button
- Auto-layout: vertical, gap `8`, padding `12`, radius `14`
- States: `default`, `hover`, `playing`
- Hover: glow gradient + play button reveal

### `PlayButton`
- Variants: `play`, `pause`, `loading`
- Motion: scale `1` to `1.05`

### `GlobalPlayer`
- Sections: Track info, Waveform, Controls, Audio settings
- Auto-layout: horizontal, padding `20`

### `SearchInput`
- States: `default`, `focused`, `typing`

### `SidebarLink`
- Variants: `default`, `hover`, `active`
- Active: gradient border / glow

## 03 Layouts

### Main Layout (Desktop)
- Frame width: `1440`
- Sidebar: `260`
- Content: fluid
- Player: sticky bottom

### Sidebar Sections
- Logo
- Navigation
- Spacer
- Footer/meta

### Navigation Items
- Home
- Discover
- Trending
- Artists
- Playlists
- Dubpacks
- New Releases
- Library
- Search

## 04 Pages

### Home
- Hero
- Trending Today
- New Releases
- Recommended
- Genres

### Discover
- Filters: Genre, BPM, Energy, Mood
- Dynamic grid tracks

### Artist
- Artist banner
- Artist info
- Track list
- Albums
- Stats

### Track
- Cover
- Waveform
- Actions
- Comments
- Related tracks

### Library
- Liked tracks
- Playlists
- History
- Downloads

## 05 Prototypes

### Micro Interactions
- Track card hover: glow + play reveal
- Player progress: waveform animation
- Sidebar: slide hover indicator

### Mobile
- Frame: `390`
- Bottom nav: Home, Search, Library, Player, Profile

## React Mapping
- `TrackCard` -> `TrackCard.tsx`
- `SidebarLink` -> `SidebarItem.tsx`
- `GlobalPlayer` -> `Player.tsx`
- `SearchInput` -> `SearchBar.tsx`
- `ArtistHeader` -> `ArtistHero.tsx`

## Notes
- `music-web/server.js` already uses this direction as a live visual shell.
- Next step: migrate shell into a full Next.js app with componentized TSX structure.
