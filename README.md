# Tideland Synth

A browser-based ambient synthesizer disguised as a place.

## Vision

The user enters a pixelated beachside bedroom at dusk. A modular synthesizer hums softly against one wall. There are no menus, no tutorials, no timelines. You touch things. Sound happens. Time slows down.

The experience should feel like: a nap on warm sand, breathing in a bath, music for plants.

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Rendering**: PixiJS for the room/environment, React components for synth modules
- **Audio Engine**: Tone.js (Web Audio API wrapper)
- **State**: Zustand
- **Styling**: Tailwind CSS

## Project Structure

```
src/
├── engine/           # Audio engine singleton
├── modules/          # Synth module definitions
├── components/       # React components (Room, SynthRack, controls)
├── interaction/      # Drag physics and haptics hooks
├── visuals/          # Sprites, shaders, animations
└── state/            # Zustand stores
```

## Core Principles

1. **Tactile over technical** — Every interaction should feel physically satisfying
2. **Constraint as calm** — Limit choices to prevent overwhelm
3. **Inhabit, don't operate** — The room is the interface
4. **Generative by default** — Sound evolves on its own

## License

MIT
