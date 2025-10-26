# Suno Music Generation & Stem Separation - User Guide

## Quick Start

### Generate Your First Song

1. Click **"Suno"** in the left menu
2. Enter a description like: *"An upbeat pop song about coding with electronic beats"*
3. Click **"Generate Music"**
4. Wait 1-3 minutes
5. Listen to your generated songs!

### Separate Vocals from Your Song

1. After generating music, click **"Separate Stems"** on any track
2. Choose separation type:
   - **Vocal Split** - Get vocals and instrumental (2 files)
   - **Multi-Stem** - Get all instruments separately (up to 12 files)
3. Click **"Separate Stems"**
4. Wait 30-60 seconds
5. Download your stems!

## Generation Modes

### Simple Mode (Recommended for Beginners)

Just describe what you want:
- *"A relaxing jazz piano piece for studying"*
- *"An energetic rock song with guitar solos"*
- *"A sad ballad about lost love"*

The AI will:
- Write the lyrics
- Create the melody
- Arrange the instruments
- Generate 2 variations

### Custom Mode (For Advanced Users)

Full control over your music:

1. **Song Title** - Name your track
2. **Style Tags** - Specify genre and mood
   - Examples: `pop, electronic, upbeat, female vocals`
3. **Lyrics** - Write your own verses and chorus
4. **Instrumental** - Check this for music without vocals

## Tips for Better Results

### Writing Descriptions (Simple Mode)

✅ **Good Examples:**
- "A cheerful acoustic folk song with harmonica and storytelling lyrics"
- "Dark electronic dubstep with heavy bass drops and glitch effects"
- "Smooth R&B love song with soulful vocals and piano"

❌ **Avoid:**
- "Make me a song" (too vague)
- "The best music ever" (not descriptive)
- Just genre names without details

### Writing Lyrics (Custom Mode)

✅ **Good Practices:**
- Use verse/chorus structure: `[Verse 1]`, `[Chorus]`, `[Bridge]`
- Keep lines short and rhythmic
- Include emotional content
- Match style to your tags

❌ **Avoid:**
- Very long paragraphs
- Complex poetry
- Copyrighted lyrics
- Inappropriate content

### Style Tags

**Popular Combinations:**
- `pop, upbeat, catchy, female vocals`
- `rock, electric guitar, energetic, male vocals`
- `electronic, ambient, chill, instrumental`
- `hip hop, rap, trap, bass heavy`
- `jazz, piano, smooth, relaxing`

## Stem Separation Guide

### When to Use Vocal Split

Perfect for:
- Creating karaoke tracks
- Removing vocals for remixes
- Isolating vocals for sampling
- Quick 2-track separation

**You Get:**
- Vocals track
- Instrumental track

### When to Use Multi-Stem

Perfect for:
- Professional remixing
- Music production
- Detailed editing
- Learning music arrangement

**You Get (up to 12 tracks):**
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

## Workflow Examples

### Example 1: Create a Karaoke Track

1. Generate a song in Simple Mode
2. Click "Separate Stems"
3. Choose "Vocal Split"
4. Download the Instrumental track
5. Use for karaoke!

### Example 2: Remix a Generated Song

1. Generate a song in Custom Mode
2. Click "Separate Stems"
3. Choose "Multi-Stem"
4. Download all stems
5. Import into your DAW (Ableton, FL Studio, etc.)
6. Rearrange, add effects, create your remix!

### Example 3: Learn Music Production

1. Generate a song in your favorite genre
2. Separate with Multi-Stem
3. Study how each instrument is arranged
4. Analyze the mixing and production
5. Apply techniques to your own music!

## Understanding the Interface

### Suno Tab

**Generation Mode Buttons:**
- Simple Mode - AI writes everything
- Custom Mode - You provide lyrics

**Input Fields:**
- **Music Description** (Simple) - Describe your song
- **Song Title** (Custom) - Optional title
- **Style Tags** (Custom) - Genre and mood
- **Lyrics** (Custom) - Your song lyrics
- **Instrumental** (Custom) - Checkbox for no vocals

**Generated Music Section:**
- Audio player for each variation
- Download button
- Separate Stems button
- Task ID and Audio ID (for reference)

### Stems Tab

**Input Fields:**
- **Suno Task ID** - Auto-filled from generation
- **Audio ID** - Auto-filled (optional)
- **Preview Audio** - Listen before separating

**Separation Type:**
- Vocal Split - 2 stems
- Multi-Stem - 12 stems

**Results:**
- Individual audio players for each stem
- Download button for each stem

## Common Questions

### How long does generation take?
Typically 1-3 minutes. Complex songs may take longer.

### How many songs can I generate?
Depends on your KIE.ai API credits. Check your account at kie.ai.

### Can I use generated music commercially?
Check Suno's terms of service and licensing at suno.ai.

### How long are generated songs?
Usually 2-3 minutes. You can extend them using Suno's extend feature (not yet implemented in this app).

### Can I separate vocals from my own music?
No, this API only works with Suno-generated music. For your own audio, try:
- Spleeter (free, open source)
- LALAL.AI (commercial)
- Moises.ai (free tier available)

### Do the audio files expire?
Yes, after 14 days. Download important stems immediately!

### Can I edit the generated music?
Not directly in this app, but you can:
1. Download the audio
2. Import into a DAW
3. Edit as needed

Or:
1. Separate stems
2. Edit individual stems in your DAW
3. Mix them together

## Troubleshooting

### "Please enter a prompt"
- You need to describe the music you want
- Try: "A happy birthday song with acoustic guitar"

### "Music generation failed"
- Check your KIE_API_KEY in .env.local
- Verify you have API credits at kie.ai
- Try a simpler prompt
- Avoid inappropriate content

### "Please provide a Task ID"
- Generate music in the Suno tab first
- Or manually enter a Task ID from a previous generation

### "Separation task failed"
- Ensure the Task ID is from a completed generation
- Check the Task ID hasn't expired (14 days)
- Verify your API credits

### Generation is taking too long
- Normal: 1-3 minutes
- If over 5 minutes, check kie.ai dashboard
- May need to try again

### No stems appearing
- Check the separation completed successfully
- Verify your internet connection
- Try separating again
- Check API status at kie.ai

## Best Practices

### For Best Quality
1. Be specific in descriptions
2. Use proper song structure in lyrics
3. Match style tags to your content
4. Review both variations before separating
5. Download stems immediately

### For Efficiency
1. Use Simple Mode for quick results
2. Save Task IDs for future reference
3. Separate stems only when needed (costs credits)
4. Download all stems at once

### For Learning
1. Generate songs in different genres
2. Study the Multi-Stem separations
3. Analyze how AI arranges instruments
4. Experiment with different prompts
5. Compare variations

## Advanced Tips

### Getting Specific Sounds
- Mention specific instruments: "with saxophone solo"
- Specify tempo: "slow tempo", "fast-paced"
- Describe mood: "melancholic", "energetic", "dreamy"
- Reference eras: "80s synth", "90s grunge"

### Improving Lyrics
- Use rhyme schemes
- Keep consistent meter
- Include repetition in chorus
- Add emotional depth
- Use vivid imagery

### Maximizing Stem Quality
- Generate high-quality music first
- Use Multi-Stem for detailed work
- Download in highest quality available
- Process stems in a DAW for best results

## Resources

- **KIE.ai Dashboard**: https://kie.ai
- **API Documentation**: https://docs.kie.ai
- **Suno Website**: https://suno.ai
- **Support**: Check kie.ai for support options

## Keyboard Shortcuts

- **Tab** - Switch between input fields
- **Enter** - Submit (when in text input)
- **Space** - Play/Pause audio
- **Ctrl/Cmd + Click** - Open in new tab (for downloads)

---

**Enjoy creating music with AI! 🎵**
