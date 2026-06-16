# Crash Test

Mobile Phaser 3.88.2 game starter.

## Local Run

From this folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/index.html
```

Or double-click `START_LOCAL.bat`.

Do not open `index.html` directly through `file:///...`: browsers block Phaser asset loading from local files with CORS, so PNG assets will appear as missing textures.

`test.html` redirects to `index.html`.

## Current Base

- Phaser version check: `3.88.2`
- Internal canvas: `720x1280`
- Scale mode: `Phaser.Scale.FIT`
- Mobile viewport and fullscreen button
- Sound mute button wired to Phaser sound manager
- Balance starts at `$1000.00`
- Bet options: `$1`, `$2`, `$5`, `$10`, `$50`, `$100`
- Pressing and holding the launch lever starts a round and subtracts the bet
- Multiplier starts at `0.00x`, so the engine can break before `1.00x`
- Multiplier grows from the current car speed: faster car means faster `x`
- Multiplier growth has a softer, slower progression and is capped at `1000x`
- The multiplier panel is gray when idle, green while driving, and rolls down red to `0x` after an engine loss
- At `1000x`, the car auto-crashes as if it reached the wall
- Speed starts at `0 KM/H` and has no hard cap
- Road scroll uses the same speed system, but with a visual scale so the car feels fast from launch
- Releasing the launch lever during a drive triggers `CRASH` and pays `bet * multiplier`
- After `CRASH`, the camera follows the dummy as it flies right, hits asphalt, bounces, and settles
- Dummy flight distance and bounce shape are fixed for readability; only bounce count changes
- Dummy bounce count scales from the current multiplier: `2x` gives 1 bounce, `4x` gives 2, `8x` gives 3, etc.
- The bounce counter uses `assets/images/icon_for_bounces.png`, appears only when at least one bounce is available, and counts down during dummy flight
- During the drive, a more frequent rare purple proc can add `+1` extra bounce even before `2x`; the badge flashes through `assets/images/icon_for_bounces_extra.png` with a white number before returning to the normal icon
- The KM/H counter is hidden; only gameplay-relevant counters remain visible
- `SAFE` mode disables engine breaks for testing
- Each bounce arc has 10 evenly spaced bonus spawn points after a short intro offset, so coins enter from the right instead of appearing beside the dummy
- Later bounce arcs bias coin values upward, so long 8-10 bounce flights have a much better chance of strong bonuses
- Bonus pickups add to the final multiplier instead of multiplying it: base `5x` plus five `1x` coins pays as `10x`
- Bonus pickups can add: `0.1x`, `0.25x`, `0.5x`, `1x`, `2x`, `5x`, `10x`, `20x`, `100x`, `200x`, `500x`, `1000x`, `2000x`, `3000x`, `4000x`, `5000x`
- `0.1x` and `0.25x` are the most common coins; `0.5x` and higher coins are less frequent
- Empty bounce peaks are common; high bonuses are rare, and `200x+` bonuses are ultra-rare
- Bonus pickup moment slows time briefly for emphasis
- Each collected coin shows a local `+Nx` pop effect
- Collected coin values are added directly into the main multiplier display during dummy flight
- Final win appears in the center with a counting animation
- Bounce flight is slowed so coin pickups are easier to read
- Bonus coins use different colors by value tier
- Final win is shown and paid only after the dummy stops
- The next round starts from the parked car position, not from off-screen
- The launch lever rests on the left; dragging it right smoothly increases turbo power up to 7x car acceleration, 7x multiplier growth, and 7x visual road motion at the far-right edge
- A hidden engine-break threshold can stop the car and lose the bet
- Engine break shows the loss after the car stops, then returns to a fresh car
- Engine breaks are weighted more often before `1x` and before `2x`
- Test tuning: every 4th run has a 70% chance to set engine break above `10x`
- The center status shows the last win/loss result instead of a round number
