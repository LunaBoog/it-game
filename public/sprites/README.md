# Sprite assets

Drop 24x24 PNG sprites here with transparent backgrounds.
Missing files silently fall back to primitive shapes — you can add them piecemeal.

See the project root `README.md` for the full asset list and character descriptions.

## Quick filename reference

```
Tiles:       floor.png  wall.png  door.png  desk.png
Player:      player_down.png  player_up.png  player_left.png  player_right.png
Props:       ticket_monitor.png  printer.png
Markers:     marker_ticket.png  marker_sidequest.png  marker_done.png
Main NPCs:   npc_karen.png  npc_marcus.png  npc_priya.png  npc_dana.png
             npc_jordan.png  npc_riley.png  npc_chen.png
Side NPCs:   npc_ed.png  npc_lisa.png
```

## Style guidance for your generator

- 24x24 PNG with alpha channel
- Top-down view, like Pokémon Red/Gold
- 8-bit / Game Boy Color palette — limited colors, hard pixel edges
- NPC sprites face down (toward camera) for v1
- Player sprites need all four directions
- Consistent baseline: characters' feet at the bottom edge of the tile
- Light from upper-left
