# SauroraaMusic mobile

Initial Expo Router scaffold for the future `SauroraaMusic` mobile app.

## Current scope

This folder provides:

- an Expo project entry point
- basic file-based navigation
- a home screen
- a login screen wired to `/api/auth/login`
- a placeholder release detail route
- a minimal API client using `EXPO_PUBLIC_API_BASE`

## Expected API base

By default, the app targets:

- `https://sauroraarecords.be/api`

To override locally:

```powershell
$env:EXPO_PUBLIC_API_BASE="http://192.168.1.10:4000/api"
```

## Next implementation steps

1. Install dependencies in `mobile/`.
2. Start the Expo dev server.
3. Replace the placeholder screens with live release, artist, and player data.
4. Add mobile token storage once backend auth JSON is finalized.
