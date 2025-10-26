# Suno Music System - Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Navigation  │  │  Suno Tab    │  │  Stems Tab   │          │
│  │    Menu      │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      React Components                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  SunoMusicGeneration.tsx                               │    │
│  │  - Simple/Custom mode UI                               │    │
│  │  - Form handling                                       │    │
│  │  - Audio preview                                       │    │
│  │  - Download functionality                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  StemSeparation.tsx                                    │    │
│  │  - Task ID management                                  │    │
│  │  - Separation type selection                           │    │
│  │  - Stem preview & download                             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      State Management                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  App State (index.tsx)                                 │    │
│  │  - sunoTaskId                                          │    │
│  │  - sunoAudioId                                         │    │
│  │  - sunoAudioUrl                                        │    │
│  │  - isLoading                                           │    │
│  │  - error                                               │    │
│  │  - loadingMessage                                      │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Integration                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  KIE.ai Suno API                                       │    │
│  │  - POST /api/v1/suno/generate                          │    │
│  │  - GET  /api/v1/suno/query                             │    │
│  │  - POST /api/v1/suno/separate-vocals                   │    │
│  │  - GET  /api/v1/suno/get-vocal-separation-details      │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Music Generation Flow

```
User Input
    ↓
┌─────────────────────────────────────┐
│ SunoMusicGeneration Component       │
│ - Collect prompt/lyrics             │
│ - Validate input                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ API Request                          │
│ POST /api/v1/suno/generate          │
│ {                                    │
│   gpt_description_prompt: "...",    │
│   mv: "chirp-v3-5"                  │
│ }                                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Response                             │
│ {                                    │
│   code: 200,                         │
│   data: { taskId: "abc123..." }     │
│ }                                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Polling Loop (every 5 seconds)      │
│ GET /api/v1/suno/query?taskId=...   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Status Check                         │
│ - queued → continue polling          │
│ - processing → continue polling      │
│ - complete → extract audio URLs      │
│ - error → show error message         │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Music Generated                      │
│ - Display audio players              │
│ - Enable download buttons            │
│ - Enable "Separate Stems" button     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ User Clicks "Separate Stems"         │
│ - Call onMusicGenerated callback     │
│ - Pass taskId, audioId, audioUrl     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ App State Update                     │
│ - setSunoTaskId(taskId)              │
│ - setSunoAudioId(audioId)            │
│ - setSunoAudioUrl(audioUrl)          │
│ - setActiveTab(Tab.STEM)             │
└─────────────────────────────────────┘
```

### Vocal Separation Flow

```
Tab Switch to STEM
    ↓
┌─────────────────────────────────────┐
│ StemSeparation Component             │
│ - Receive initialTaskId              │
│ - Receive initialAudioId             │
│ - Receive initialAudioUrl            │
│ - Pre-fill form fields               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ User Selects Separation Type         │
│ - separate_vocal (2 stems)           │
│ - split_stem (12 stems)              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ API Request                          │
│ POST /api/v1/suno/separate-vocals   │
│ {                                    │
│   taskId: "abc123...",               │
│   audioId: "xyz789...",              │
│   type: "split_stem"                 │
│ }                                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Response                             │
│ {                                    │
│   code: 200,                         │
│   data: { taskId: "sep456..." }     │
│ }                                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Polling Loop (every 5 seconds)      │
│ GET /api/v1/suno/                    │
│     get-vocal-separation-details     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Status Check                         │
│ - PROCESSING → continue polling      │
│ - SUCCESS → extract stem URLs        │
│ - FAILED → show error message        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Stems Separated                      │
│ - Display audio player for each stem │
│ - Enable download for each stem      │
│ - Show stem names and info           │
└─────────────────────────────────────┘
```

## Component Hierarchy

```
App (index.tsx)
│
├── Navigation Menu
│   ├── Edit Tab
│   ├── Layers Tab
│   ├── Expand Tab
│   ├── Story Tab
│   ├── Assistant Tab
│   ├── Favorites Tab
│   ├── Upscale Tab
│   ├── Flux Tab
│   ├── MJ Tab
│   ├── VEO Tab
│   ├── Suno Tab ← NEW
│   └── Stems Tab ← ENHANCED
│
├── Control Panel
│   └── Tab Content
│       ├── SunoMusicGeneration ← NEW
│       │   ├── Mode Selection
│       │   ├── Input Forms
│       │   ├── Generate Button
│       │   └── Results Display
│       │       ├── Audio Players
│       │       ├── Download Buttons
│       │       └── Separate Stems Buttons
│       │
│       └── StemSeparation ← ENHANCED
│           ├── Task ID Input
│           ├── Audio ID Input
│           ├── Audio Preview
│           ├── Separation Type Selection
│           ├── Separate Button
│           └── Results Display
│               ├── Stem Audio Players
│               └── Download Buttons
│
└── Main Workspace
    └── Image/Video Display
```

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Initial State                              │
│  sunoTaskId: ''                                               │
│  sunoAudioId: ''                                              │
│  sunoAudioUrl: ''                                             │
└──────────────────────────────────────────────────────────────┘
                         ↓
                  User generates music
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              Music Generation Complete                        │
│  Music data received from API                                 │
└──────────────────────────────────────────────────────────────┘
                         ↓
              User clicks "Separate Stems"
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              handleSunoMusicGenerated()                       │
│  setSunoTaskId(taskId)                                        │
│  setSunoAudioId(audioId)                                      │
│  setSunoAudioUrl(audioUrl)                                    │
│  setActiveTab(Tab.STEM)                                       │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              Updated State                                    │
│  sunoTaskId: 'abc123...'                                      │
│  sunoAudioId: 'xyz789...'                                     │
│  sunoAudioUrl: 'https://...'                                  │
│  activeTab: Tab.STEM                                          │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              StemSeparation Receives Props                    │
│  initialTaskId={sunoTaskId}                                   │
│  initialAudioId={sunoAudioId}                                 │
│  initialAudioUrl={sunoAudioUrl}                               │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              Component Local State                            │
│  musicTaskId: 'abc123...' (from props)                        │
│  musicAudioId: 'xyz789...' (from props)                       │
│  audioUrl: 'https://...' (from props)                         │
└──────────────────────────────────────────────────────────────┘
                         ↓
              User initiates separation
                         ↓
┌──────────────────────────────────────────────────────────────┐
│              Separation Complete                              │
│  separatedStems: [                                            │
│    { name: 'Vocals', url: '...' },                            │
│    { name: 'Instrumental', url: '...' },                      │
│    ...                                                         │
│  ]                                                             │
└──────────────────────────────────────────────────────────────┘
```

## API Request/Response Patterns

### Music Generation

**Request:**
```typescript
POST https://api.kie.ai/api/v1/generate
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${KIE_API_KEY}'
}
Body: {
  prompt: string,
  style?: string,
  title?: string,
  customMode: boolean,
  instrumental: boolean,
  model: 'V3_5'
}
```

**Response:**
```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string
  }
}
```

**Status Query:**
```typescript
GET https://api.kie.ai/api/v1/get-music-details?taskId={taskId}
Headers: {
  'Authorization': 'Bearer ${KIE_API_KEY}'
}
```

**Status Response:**
```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string,
    status: 'SUCCESS' | 'PROCESSING' | 'PENDING' | 'FAILED',
    response: {
      taskId: string,
      sunoData: [
        {
          id: string,
          audioUrl: string,
          streamAudioUrl: string,
          imageUrl: string,
          title: string,
          tags: string,
          duration: number,
          prompt: string,
          modelName: string,
          createTime: string
        }
      ]
    },
    errorCode?: string,
    errorMessage?: string
  }
}
```

### Vocal Separation

**Request:**
```typescript
POST https://api.kie.ai/api/v1/suno/separate-vocals
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${KIE_API_KEY}'
}
Body: {
  taskId: string,
  audioId: string,
  type: 'separate_vocal' | 'split_stem',
  callBackUrl: string
}
```

**Response:**
```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string
  }
}
```

**Status Query:**
```typescript
GET https://api.kie.ai/api/v1/suno/get-vocal-separation-details?taskId={taskId}
Headers: {
  'Authorization': 'Bearer ${KIE_API_KEY}'
}
```

**Status Response:**
```typescript
{
  code: 200,
  data: {
    successFlag: 'SUCCESS' | 'PROCESSING' | 'FAILED',
    response: {
      vocalUrl: string,
      instrumentalUrl: string,
      backingVocalsUrl: string,
      drumsUrl: string,
      bassUrl: string,
      guitarUrl: string,
      keyboardUrl: string,
      stringsUrl: string,
      brassUrl: string,
      woodwindsUrl: string,
      percussionUrl: string,
      synthUrl: string,
      fxUrl: string
    }
  }
}
```

## Error Handling Strategy

```
┌─────────────────────────────────────┐
│ User Action                          │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Validation                           │
│ - Check required fields              │
│ - Validate input format              │
└─────────────────────────────────────┘
            ↓ (if valid)
┌─────────────────────────────────────┐
│ API Request                          │
│ try {                                │
│   const response = await fetch(...)  │
│ }                                    │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Response Handling                    │
│ - Check HTTP status                  │
│ - Parse JSON                         │
│ - Check API code                     │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Error Cases                          │
│ - Network error → Retry/Show error   │
│ - API error → Parse message          │
│ - Timeout → Show timeout message     │
│ - Invalid data → Show validation     │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ User Feedback                        │
│ - setError(message)                  │
│ - setLoadingMessage('')              │
│ - setIsLoading(false)                │
└─────────────────────────────────────┘
```

## Performance Optimization

### Polling Optimization
- 5-second intervals (balance between responsiveness and API load)
- Maximum attempt limits (prevent infinite loops)
- Exponential backoff on errors (reduce API stress)

### State Management
- Minimal re-renders (use callbacks and memoization)
- Efficient state updates (batch updates when possible)
- Clean up on unmount (prevent memory leaks)

### Asset Loading
- Lazy load audio (only when needed)
- Progressive enhancement (show UI before audio loads)
- Efficient downloads (direct links, no buffering)

## Security Considerations

### API Key Protection
```
.env.local (not committed)
    ↓
process.env.KIE_API_KEY
    ↓
Server-side only (if using backend)
    ↓
Never exposed to client
```

### Data Privacy
- No user data stored permanently
- Audio URLs expire after 14 days
- Task IDs are non-sensitive
- No personal information collected

## Scalability

### Current Limits
- Single user per session
- Sequential operations (one at a time)
- Client-side polling

### Future Scaling
- Multi-user support
- Parallel operations
- Server-side polling
- WebSocket for real-time updates
- Caching layer
- CDN for audio files

---

This architecture provides a solid foundation for music generation and vocal separation, with clear separation of concerns, robust error handling, and room for future enhancements.
