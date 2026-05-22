# Chess

Browser chess for two players on the same device (hotseat). Standard rules: castling, en passant, pawn promotion, check, checkmate, stalemate, and insufficient-material draws.

Separate from the HOI4 prototype in the repo root.

## Run

**Do not** double-click `index.html` — the browser blocks module scripts on `file://` URLs.

From the **repository root** (the folder that contains both `index.html` and `chess/`):

```bash
cd hoi4-prototype
python3 -m http.server 8080
```

Then open either:

- **http://localhost:8080/chess/**
- **http://localhost:8080/chess.html** (shortcut)

HOI4 remains at **http://localhost:8080/**

### Play online (GitHub Pages)

After this folder is pushed to GitHub:

**https://search-or-enter-website-name.github.io/hoi4-prototype/chess/**

If that URL 404s, the chess files are not on the published branch yet — push `chess/` to `main` and wait for Pages to rebuild.

## How to play

1. **White** moves first.
2. Click a piece to select it — legal squares are highlighted.
3. Click a highlighted square to move (or click the same piece again to deselect).
4. When a pawn reaches the last rank, choose Queen, Rook, Bishop, or Knight.
5. **New game** resets the board.

## Rules included

- All piece moves and captures
- Cannot move into or leave your king in check
- Kingside and queenside castling (when legal)
- En passant (immediately after a pawn double-push)
- Checkmate and stalemate
- Draw by insufficient mating material

## Tech

Vanilla JavaScript (ES modules), no build step. Unicode pieces on an HTML board.
