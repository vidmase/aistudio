# Suno Music System - Quick Reference

## 🎵 Generate Music

### Simple Mode (AI Lyrics)
```
1. Click "Suno" tab
2. Enter description: "A happy pop song about coding"
3. Click "Generate Music"
4. Wait 1-3 minutes
5. Listen to 2 variations
```

### Custom Mode (Your Lyrics)
```
1. Click "Suno" tab
2. Switch to "Custom Mode"
3. Enter title (optional)
4. Enter style tags: "pop, upbeat, electronic"
5. Enter your lyrics
6. Click "Generate Music"
7. Wait 1-3 minutes
```

## 🎚️ Separate Stems

### From Generated Music
```
1. After generating music
2. Click "Separate Stems" on any track
3. App auto-switches to Stems tab
4. Choose separation type
5. Click "Separate Stems"
6. Wait 30-60 seconds
7. Download stems
```

### Manual Task ID
```
1. Click "Stems" tab
2. Enter Task ID from previous generation
3. Enter Audio ID (optional)
4. Choose separation type
5. Click "Separate Stems"
6. Wait 30-60 seconds
7. Download stems
```

## 📋 Separation Types

### Vocal Split (2 stems)
- Vocals
- Instrumental

### Multi-Stem (up to 12 stems)
- Vocals
- Backing Vocals
- Drums
- Bass
- Guitar
- Keyboard
- Strings
- Brass
- Woodwinds
- Percussion
- Synthesizer
- FX/Other

## ⚡ Quick Tips

### Better Music Generation
- Be specific: "upbeat electronic dance music with synth leads"
- Include mood: "melancholic", "energetic", "dreamy"
- Mention instruments: "with piano and strings"
- Specify tempo: "fast-paced", "slow tempo"

### Better Lyrics
- Use verse/chorus structure
- Keep lines short and rhythmic
- Include emotional content
- Match style to your tags

### Better Stems
- Generate high-quality music first
- Use Multi-Stem for detailed work
- Download immediately (14-day expiry)
- Process in DAW for best results

## 🔧 Troubleshooting

### "Music generation failed"
✅ Check KIE_API_KEY in .env.local
✅ Verify API credits at kie.ai
✅ Try simpler prompt
✅ Avoid inappropriate content

### "Separation task failed"
✅ Ensure Task ID is valid
✅ Check Task ID hasn't expired
✅ Verify Audio ID is correct
✅ Try different separation type

### Taking too long
✅ Normal: 1-3 min for generation
✅ Normal: 30-60 sec for separation
✅ If longer, check kie.ai dashboard

## 📊 Expected Times

| Operation | Time |
|-----------|------|
| Simple Mode Generation | 60-120 sec |
| Custom Mode Generation | 60-180 sec |
| Vocal Split | 30-45 sec |
| Multi-Stem | 45-90 sec |

## 🔑 API Endpoints

### Music Generation
```
POST https://api.kie.ai/api/v1/generate
GET  https://api.kie.ai/api/v1/get-music-details?taskId={id}
```

### Vocal Separation
```
POST https://api.kie.ai/api/v1/suno/separate-vocals
GET  https://api.kie.ai/api/v1/suno/get-vocal-separation-details?taskId={id}
```

## 💾 File Locations

### Components
- `SunoMusicGeneration.tsx` - Music generation
- `StemSeparation.tsx` - Vocal separation
- `index.tsx` - Main app integration

### Documentation
- `SUNO_USER_GUIDE.md` - Full user guide
- `SUNO_COMPLETE_IMPLEMENTATION.md` - Technical docs
- `IMPLEMENTATION_SUMMARY.md` - Overview
- `SYSTEM_ARCHITECTURE.md` - Architecture
- `QUICK_REFERENCE.md` - This file

### Configuration
- `.env.local` - API key (KIE_API_KEY)

## 🎯 Common Use Cases

### Create Karaoke Track
```
Generate music → Separate (Vocal Split) → Download Instrumental
```

### Remix a Song
```
Generate music → Separate (Multi-Stem) → Import to DAW → Remix
```

### Learn Production
```
Generate music → Separate (Multi-Stem) → Study each stem
```

### Sample Creation
```
Generate music → Separate (Multi-Stem) → Extract specific stems
```

## 🚀 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Switch fields |
| Enter | Submit form |
| Space | Play/Pause audio |
| Ctrl/Cmd + Click | Open in new tab |

## 📱 Browser Support

✅ Chrome (recommended)
✅ Firefox
✅ Safari
✅ Edge

## ⚠️ Important Notes

- Audio URLs expire after 14 days
- Each operation costs API credits
- No caching - re-running costs credits
- Download stems immediately
- Save Task IDs for reference

## 🔗 Resources

- **API Docs**: https://docs.kie.ai
- **Dashboard**: https://kie.ai
- **Suno**: https://suno.ai

## 📞 Support

1. Check documentation
2. Review API status at kie.ai
3. Verify API credits
4. Contact KIE.ai support

---

**Quick Start**: Suno Tab → Enter description → Generate → Separate Stems → Download 🎵
