# Three-FPS-Game

This repository contains a Three.js first-person shooter (FPS) game. The game includes:
- Free movement in a zero-gravity arena inspired by Ender's Game.
- A rifle view model with automatic firing and recoil.
- Pointer lock with fallback to mouse drag when pointer lock isn't permitted.
- Lighting and tone mapping to brighten the scene.

## Running the game locally

To run the game locally:
1. Clone this repository or download it as a ZIP.
2. Open `index.html` in a modern web browser.
3. On the first click the game will request pointer lock for smooth mouse look.
4. Use the following controls:
   - `W`, `A`, `S`, `D`: move forward, left, backward, right.
   - `Space`: move up.
   - `Shift`: move down.
   - `Mouse`: look around.
   - `Left mouse button`: shoot.
   - `Esc`: release pointer lock to regain cursor control.
5. If pointer lock isn't available (due to browser sandbox restrictions), use click-and-drag to look around.

## Deploying with GitHub Pages

1. Go to the repository's settings on GitHub.
2. In the **Pages** section, choose the `main` branch and root folder for the site.
3. Save the settings. GitHub will provide a URL where the game can be played.
4. Navigate to the URL to start playing. The game uses module imports that work when served via GitHub Pages.

## Future improvements

Because this repository isn't limited by the previous sandbox environment, the project can be extended to support:
- Advanced lighting, textures, and assets loaded from external files.
- Multiplayer via WebSockets.
- AI enemies and pathfinding.
- Better UI elements such as crosshairs, health bars, and score tracking.
