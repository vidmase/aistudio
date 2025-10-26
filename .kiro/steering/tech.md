# Technology Stack

## Frontend Framework
- **React 19.1.1** with TypeScript
- **Vite 6.2.0** for build tooling and development server
- **ES2022** target with modern JavaScript features

## Build System & Development

### Common Commands
```bash
# Development
npm run dev          # Start development server on port 3000

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Dependencies
npm install          # Install all dependencies
```

### Development Server
- Runs on `http://localhost:3000` (or `http://0.0.0.0:3000`)
- Hot module replacement enabled
- TypeScript compilation on-the-fly

## Core Dependencies

### AI & API Integration
- **@google/genai ^1.17.0** - Gemini AI integration for image generation and processing
- External APIs: KIE.ai (Flux, Suno), VEO models

### UI Framework
- **React 19.1.1** - Component framework
- **react-dom 19.1.1** - DOM rendering
- Custom CSS with CSS variables for theming

## TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (automatic runtime)
- **Path mapping**: `@/*` maps to project root
- **Experimental decorators** enabled
- **Isolated modules** for better build performance

## Build Configuration (Vite)
- **Plugins**: @vitejs/plugin-react
- **Environment variables**: Loaded from `.env.local`
- **Path aliases**: `@` resolves to project root
- **Define**: Process environment variables for client-side access
- **Server**: Host 0.0.0.0 for network access

## Environment Variables
Required in `.env.local`:
- `GEMINI_API_KEY` - Google Gemini API key
- `KIE_API_KEY` - KIE.ai API key for Flux and Suno

## Browser Compatibility
- Modern browsers supporting ES2022
- Chrome, Firefox, Safari, Edge
- No IE support

## Performance Considerations
- ES modules with tree shaking
- Code splitting via dynamic imports
- Optimized bundle size with Vite
- Client-side rendering (SPA)