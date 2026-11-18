# CHROMA QUEST

**A neon puzzle adventure — ماجراجویی در دنیای رنگ‌ها**

CHROMA QUEST is a mobile-first puzzle game concept with two puzzle paths:
- **Liquid Sort:** organize colored liquids with limited tube capacity.
- **Block Puzzle:** place shapes strategically to clear rows and columns.

## Current milestone

The first milestone establishes the cinematic home screen:
- Persian RTL interface
- Dark, purple-and-cyan neon visual identity
- Animated prism centerpiece and ambient effects
- Responsive layout for mobile and desktop
- Initial local state (gems, level, sound, selected mode)
- Working home-screen dialogs and settings interactions

The puzzle engines are not implemented yet. Mode selection currently records the choice and displays a preparation message.

## Run locally

Open `index.html` in a modern browser. An internet connection is currently used for the Vazirmatn web font; system fonts are used as fallback.

## Project structure

```
index.html
styles.css
js/
  state.js
  main.js
README.md
```

## Next milestones

1. Build and test the Liquid Sort engine.
2. Build and test the Block Puzzle engine.
3. Add level progression, rewards, sound effects, and persistence.
4. Test touch controls and package the mobile version.

All game state in this prototype is stored locally in the browser.