# Suno API Integration Example

## Complete Workflow: Music Generation → Vocal Separation

This document shows how to properly integrate Suno's music generation and vocal separation APIs.

## Step 1: Generate Music with Suno

First, you need to generate music using Suno's music generation API:

```typescript
// Example: Generate music with Suno
const generateMusic = async (prompt: string, customMode: boolean = false) => {
  const response = await fetch('https://api.kie.ai/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      customMode: customMode,
      instrumental: false,
      model: 'V3_5'
    })
  });

  const result = await response.json();
  
  // Save this taskId - you'll need it for vocal separation!
  const taskId = result.data.taskId;
  
  // Poll for completion
  const musicData = await pollMusicGeneration(taskId);
  const audioId = musicData[0]?.id; // Get first audio variation
  
  return { taskId, audioId };
};

// Poll for music generation completion
const pollMusicGeneration = async (taskId: string) => {
  let attempts = 0;
  const maxAttempts = 120;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
    
    const response = await fetch(
      `https://api.kie.ai/api/v1/get-music-details?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.KIE_API_KEY}`
        }
      }
    );
    
    const result = await response.json();
    
    if (result.code === 200 && result.data.successFlag === 1) {
      return result.data.response; // Array of generated music clips
    } else if (result.data.successFlag === 2 || result.data.successFlag === 3) {
      throw new Error(result.data.errorMessage || 'Generation failed');
    }
  }
  
  throw new Error('Timeout');
};
```

## Step 2: Separate Vocals from Generated Music

Once you have the `taskId` from music generation, you can separate vocals:

```typescript
// Example: Separate vocals using the taskId from Step 1
const separateVocals = async (taskId: string, audioId?: string, type: 'separate_vocal' | 'split_stem' = 'separate_vocal') => {
  const response = await fetch('https://api.kie.ai/api/v1/suno/separate-vocals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`
    },
    body: JSON.stringify({
      taskId: taskId,        // Required: from music generation
      audioId: audioId || '', // Optional: specific variation
      type: type,            // 'separate_vocal' or 'split_stem'
      callBackUrl: ''        // Optional: for webhook notifications
    })
  });

  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(result.msg || 'Separation failed');
  }

  const separationTaskId = result.data.taskId;
  return separationTaskId;
};
```

## Step 3: Poll for Separation Results

```typescript
// Example: Check separation status
const getSeparationResults = async (separationTaskId: string) => {
  const response = await fetch(
    `https://api.kie.ai/api/v1/suno/get-vocal-separation-details?taskId=${separationTaskId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`
      }
    }
  );

  const result = await response.json();
  
  if (result.code === 200 && result.data.successFlag === 'SUCCESS') {
    const stems = result.data.response;
    
    return {
      vocals: stems.vocalUrl,
      instrumental: stems.instrumentalUrl,
      // For split_stem type:
      backingVocals: stems.backingVocalsUrl,
      drums: stems.drumsUrl,
      bass: stems.bassUrl,
      guitar: stems.guitarUrl,
      keyboard: stems.keyboardUrl,
      strings: stems.stringsUrl,
      brass: stems.brassUrl,
      woodwinds: stems.woodwindsUrl,
      percussion: stems.percussionUrl,
      synth: stems.synthUrl,
      fx: stems.fxUrl
    };
  }
  
  return null; // Still processing
};
```

## Complete Example

```typescript
const generateAndSeparate = async (musicPrompt: string) => {
  try {
    // Step 1: Generate music
    console.log('Generating music...');
    const { taskId, audioId } = await generateMusic(musicPrompt);
    
    // Wait for music generation to complete
    // (implement polling logic here)
    
    // Step 2: Separate vocals
    console.log('Separating vocals...');
    const separationTaskId = await separateVocals(taskId, audioId, 'split_stem');
    
    // Step 3: Poll for results
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      const stems = await getSeparationResults(separationTaskId);
      
      if (stems) {
        console.log('Separation complete!');
        console.log('Vocals:', stems.vocals);
        console.log('Instrumental:', stems.instrumental);
        // ... other stems
        return stems;
      }
    }
    
    throw new Error('Separation timed out');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
generateAndSeparate('A cheerful pop song about summer')
  .then(stems => {
    console.log('All stems ready:', stems);
  })
  .catch(error => {
    console.error('Failed:', error);
  });
```

## Key Points

1. **You must generate music with Suno first** - The vocal separation API only works with Suno-generated music
2. **Save the taskId** - You'll need it to separate vocals
3. **The taskId is valid for 14 days** - After that, the audio URLs expire
4. **Each separation is billed separately** - Re-running separation on the same track costs credits each time
5. **No caching** - The API doesn't cache results, so save the stem URLs when you get them

## API Documentation

- [Suno Music Generation](https://docs.kie.ai/suno-api/generate-music) (not shown in provided docs)
- [Separate Vocals](https://docs.kie.ai/suno-api/separate-vocals)
- [Get Separation Details](https://docs.kie.ai/suno-api/get-vocal-separation-details)
- [Callbacks](https://docs.kie.ai/suno-api/separate-vocals-callbacks)
