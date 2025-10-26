import React, { useState } from 'react';

// Icon for Suno Music Generation
export const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

interface SunoMusicGenerationProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingMessage: (message: string) => void;
  onMusicGenerated?: (taskId: string, audioUrl: string, audioId: string) => void;
}

interface GeneratedMusic {
  taskId: string;
  audioId: string;
  audioUrl: string;
  title: string;
  prompt: string;
  duration: number;
}

const SunoMusicGeneration: React.FC<SunoMusicGenerationProps> = ({ 
  isLoading, 
  setIsLoading, 
  setError, 
  setLoadingMessage,
  onMusicGenerated 
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<string>('');
  const [style, setStyle] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic[]>([]);
  const [makeInstrumental, setMakeInstrumental] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!prompt && !customMode) {
      setError('Please enter a prompt for music generation');
      return;
    }

    if (customMode && !lyrics && !makeInstrumental) {
      setError('Please enter lyrics or enable instrumental mode');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Submitting music generation request...');
    setGeneratedMusic([]);

    try {
      // Prepare request body based on the correct API documentation
      const requestBody: any = {
        prompt: customMode ? lyrics : prompt,
        customMode: customMode,
        instrumental: makeInstrumental,
        model: 'V3_5',
        callBackUrl: 'https://webhook.site/unique-url'  // Required by API - use a placeholder or your own webhook
      };

      // Add optional fields only if they have values
      if (style) {
        requestBody.style = style;
      }
      if (title) {
        requestBody.title = title;
      }

      // Submit generation request to the correct endpoint
      const response = await fetch('https://api.kie.ai/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || `Generation request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.code !== 200) {
        throw new Error(result.msg || 'Music generation failed');
      }

      const taskId = result.data?.taskId;
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }

      setLoadingMessage(`Task ${taskId} submitted. Generating music...`);
      console.log('Music generation task submitted:', taskId);

      // Poll for results using the correct endpoint
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes (5 second intervals)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        try {
          const statusResponse = await fetch(
            `https://api.kie.ai/api/v1/get-music-details?taskId=${taskId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.KIE_API_KEY}`
              }
            }
          );

          if (!statusResponse.ok) {
            console.warn(`Status check failed: ${statusResponse.status}`);
            continue;
          }

          const statusData = await statusResponse.json();

          if (statusData.code === 200 && statusData.data) {
            const taskData = statusData.data;
            
            // Check status field: "SUCCESS", "PROCESSING", "FAILED", etc.
            if (taskData.status === 'SUCCESS' && taskData.response && taskData.response.sunoData) {
              // Music generation completed successfully
              const clips = taskData.response.sunoData;
              
              if (clips && clips.length > 0) {
                const musicTracks: GeneratedMusic[] = clips.map((clip: any) => ({
                  taskId: taskId,
                  audioId: clip.id,
                  audioUrl: clip.audioUrl || clip.audio_url,
                  title: clip.title || 'Untitled',
                  prompt: prompt || lyrics,
                  duration: clip.duration || 0
                }));

                setGeneratedMusic(musicTracks);
                setLoadingMessage('');
                console.log('Music generation completed successfully');
                
                // Notify parent component if callback provided
                if (onMusicGenerated && musicTracks.length > 0) {
                  const firstTrack = musicTracks[0];
                  onMusicGenerated(firstTrack.taskId, firstTrack.audioUrl, firstTrack.audioId);
                }

                return;
              }
            } else if (taskData.status === 'PROCESSING' || taskData.status === 'PENDING') {
              // Still generating
              setLoadingMessage(`Generating... (${attempts}/${maxAttempts})`);
              continue;
            } else if (taskData.status === 'FAILED' || taskData.errorMessage) {
              // Generation failed
              throw new Error(taskData.errorMessage || 'Music generation failed');
            }
          }
        } catch (pollError) {
          console.warn(`Polling error (attempt ${attempts}):`, pollError);
          // Continue polling unless we've exceeded max attempts
        }
      }

      throw new Error('Music generation timed out after 10 minutes');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Suno music generation error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDownload = (music: GeneratedMusic) => {
    const a = document.createElement('a');
    a.href = music.audioUrl;
    a.download = `${music.title}.mp3`;
    a.click();
  };

  return (
    <div className="control-group">
      <h2>Suno Music Generation</h2>
      <p className="prompt-context-info">
        Generate original music using AI. Create songs from text descriptions or provide custom lyrics and style.
      </p>

      <div className="control-subgroup">
        <label>Generation Mode</label>
        <div className="segmented-control">
          <button
            className={`segmented-control-btn ${!customMode ? 'active' : ''}`}
            onClick={() => setCustomMode(false)}
            disabled={isLoading}
          >
            Simple Mode
          </button>
          <button
            className={`segmented-control-btn ${customMode ? 'active' : ''}`}
            onClick={() => setCustomMode(true)}
            disabled={isLoading}
          >
            Custom Mode
          </button>
        </div>
        <p className="prompt-context-info" style={{ marginTop: '8px', fontSize: '0.85em' }}>
          {!customMode 
            ? 'Describe the music you want and AI will create lyrics and melody'
            : 'Provide your own lyrics and style tags for more control'}
        </p>
      </div>

      {!customMode ? (
        <div className="control-subgroup">
          <label htmlFor="suno-prompt">Music Description</label>
          <textarea
            id="suno-prompt"
            className="prompt-textarea"
            placeholder="e.g., A cheerful pop song about summer vacation with upbeat tempo and catchy chorus"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            rows={4}
          />
        </div>
      ) : (
        <>
          <div className="control-subgroup">
            <label htmlFor="suno-title">Song Title (Optional)</label>
            <input
              id="suno-title"
              type="text"
              className="prompt-textarea"
              placeholder="My Awesome Song"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              style={{ minHeight: 'auto', padding: '12px' }}
            />
          </div>

          <div className="control-subgroup">
            <label htmlFor="suno-style">Style Tags</label>
            <input
              id="suno-style"
              type="text"
              className="prompt-textarea"
              placeholder="e.g., pop, electronic, upbeat, female vocals"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              disabled={isLoading}
              style={{ minHeight: 'auto', padding: '12px' }}
            />
          </div>

          <div className="control-subgroup">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={makeInstrumental}
                onChange={(e) => setMakeInstrumental(e.target.checked)}
                disabled={isLoading}
              />
              <span>Instrumental (No Lyrics)</span>
            </label>
          </div>

          {!makeInstrumental && (
            <div className="control-subgroup">
              <label htmlFor="suno-lyrics">Lyrics</label>
              <textarea
                id="suno-lyrics"
                className="prompt-textarea"
                placeholder="Enter your song lyrics here..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                disabled={isLoading}
                rows={8}
              />
            </div>
          )}
        </>
      )}

      <button 
        className="btn btn-primary" 
        onClick={handleGenerate} 
        disabled={isLoading || (!prompt && !customMode) || (customMode && !lyrics && !makeInstrumental)}
      >
        {isLoading ? (
          <>
            <div className="spinner-small" /> Generating Music...
          </>
        ) : (
          'Generate Music'
        )}
      </button>

      {generatedMusic.length > 0 && (
        <div className="control-subgroup" style={{ marginTop: '24px' }}>
          <h3>Generated Music</h3>
          <div className="music-tracks-list">
            {generatedMusic.map((music, index) => (
              <div key={index} className="music-track-card">
                <div className="music-track-header">
                  <h4>{music.title}</h4>
                  <span className="music-track-duration">
                    {Math.floor(music.duration / 60)}:{String(Math.floor(music.duration % 60)).padStart(2, '0')}
                  </span>
                </div>
                <audio controls src={music.audioUrl} style={{ width: '100%', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleDownload(music)}
                    style={{ flex: 1 }}
                  >
                    Download
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      // Switch to Stem Separation tab with this music
                      if (onMusicGenerated) {
                        onMusicGenerated(music.taskId, music.audioUrl, music.audioId);
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    Separate Stems
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.85em', color: 'var(--text-muted-color)' }}>
                  <p><strong>Task ID:</strong> {music.taskId}</p>
                  <p><strong>Audio ID:</strong> {music.audioId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="control-subgroup" style={{ marginTop: '24px' }}>
        <h3>Tips</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li>Music generation typically takes 1-3 minutes</li>
          <li>Suno generates 2 variations of each song</li>
          <li>Be specific in your descriptions for better results</li>
          <li>Generated music is valid for 14 days</li>
          <li>Use the "Separate Stems" button to extract vocals and instruments</li>
        </ul>
      </div>
    </div>
  );
};

export default SunoMusicGeneration;
