# Project Structure

## Root Files
- `index.html` - Main HTML entry point with React app mount
- `index.tsx` - Main React application component with all UI logic
- `index.css` - Global styles with CSS variables and dark theme
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `.env.local` - Environment variables (API keys)

## Component Architecture

### Main Application (`index.tsx`)
- **Single-file architecture** - All UI components and logic in one file
- **Tab-based interface** with enum-driven navigation
- **State management** using React hooks (useState, useCallback, useMemo)
- **Global state** for image history, loading states, and cross-tab data

### Specialized Components
- `MaskEditor.tsx` - Canvas-based image masking interface
- `SunoMusicGeneration.tsx` - Music generation UI and API integration
- `StemSeparation.tsx` - Audio stem separation functionality

## UI Organization

### Tab Structure (enum Tab)
```
EDIT - Image editing and generation
EXPAND - Generative image expansion
STORY - AI-guided creative workflows
ASSISTANT - AI suggestions and prompts
EFFECTS - Image effects and adjustments
ADJUST - Image parameter controls
FAVORITES - Saved suggestions
LIBRARY - Asset management
UPSCALE - Image upscaling
FLUX - Flux model integration
VEO - Video generation
```

### Component Patterns
- **Functional components** with TypeScript interfaces
- **Custom hooks** for complex state logic
- **Inline SVG icons** as React components
- **Conditional rendering** based on tab state and data availability

## State Management Patterns

### Global State (App level)
- Image history with undo/redo capability
- Loading states and error handling
- Cross-component data sharing (music → stems)
- Tab navigation state

### Local State (Component level)
- Form inputs and UI controls
- Component-specific loading states
- Temporary data and user interactions

## File Naming Conventions
- **PascalCase** for React components (`MaskEditor.tsx`)
- **camelCase** for utility functions and variables
- **SCREAMING_SNAKE_CASE** for constants and enums
- **kebab-case** for CSS classes and IDs

## API Integration Patterns
- **Environment variables** for API keys
- **Async/await** for API calls with proper error handling
- **Polling mechanisms** for long-running tasks
- **Base64 data URLs** for image handling
- **Fallback strategies** (KIE.ai → Gemini)

## Documentation Structure
- `README.md` - Setup and basic usage
- `SYSTEM_ARCHITECTURE.md` - Detailed technical architecture
- `QUICK_REFERENCE.md` - User guide and API reference
- Feature-specific docs (`SUNO_*.md`, `FLUX_*.md`, etc.)

## Asset Management
- **Inline SVG icons** for UI consistency
- **Base64 images** for processing pipeline
- **External URLs** for generated content
- **Temporary URLs** with cleanup handling

## Error Handling Strategy
- **Global error state** with user-friendly messages
- **API-specific error parsing** and fallback logic
- **Loading states** with descriptive messages
- **Validation** at form and API levels