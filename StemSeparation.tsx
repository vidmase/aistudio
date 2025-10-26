import React, { useState } from 'react';

// Icon for Stem Separation
export const MusicWaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    <path d="M3 10h4M3 14h4M3 18h4" />
  </svg>
);

interface StemSeparationProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingMessage: (message: string) => void;
  initialTaskId?: string;
  initialAudioId?: string;
  initialAudioUrl?: string;
}

interface SeparatedStem {
  name: string;
  url: string;
}

const StemSeparation: React.FC<StemSeparationProps> = ({ 
  isLoading, 
  setIsLoading, 
  setError, 
  setLoadingMessage,
  initialTaskId,
  initialAudioId,
  initialAudioUrl
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [separationType, setSeparationType] = useState<'separate_vocal' | 'split_stem'>('separate_vocal');
  const [separatedStems, setSeparatedStems] = useState<SeparatedStem[]>([]);
  const [musicTaskId, setMusicTaskId] = useState<string>(initialTaskId || '');
  const [musicAudioId, setMusicAudioId] = useState<string>(initialAudioId || '');

  const handleAudioUpload = (file: File) => {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setSeparatedStems([]);
  };

  const handleSeparate = async () => {
    if (!musicTaskId) {
      setError('Please provide a Task ID from Suno music generation, or generate music in the Suno tab first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Submitting vocal separation request...');
    setSeparatedStems([]);

    try {
      // Submit separation request
      const separationResponse = await fetch('https://api.kie.ai/api/v1/suno/separate-vocals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_API_KEY}`
        },
        body: JSON.stringify({
          taskId: musicTaskId,
          audioId: musicAudioId || '',
          type: separationType,
          callBackUrl: ''
        })
      });

      if (!separationResponse.ok) {
        const errorData = await separationResponse.json().catch(() => ({}));
        throw new Error(errorData.msg || `Separation request failed: ${separationResponse.status}`);
      }

      const result = await separationResponse.json();
      
      if (result.code !== 200) {
        throw new Error(result.msg || 'Separation task failed');
      }

      const separationTaskId = result.data?.taskId;
      if (!separationTaskId) {
        throw new Error('No separation task ID returned');
      }

      setLoadingMessage(`Separation task ${separationTaskId} submitted. Processing...`);
      console.log('Vocal separation task submitted:', separationTaskId);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        const statusResponse = await fetch(
          `https://api.kie.ai/api/v1/suno/get-vocal-separation-details?taskId=${separationTaskId}`,
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
          const { successFlag, response } = statusData.data;

          if (successFlag === 'SUCCESS') {
            const stems: SeparatedStem[] = [];

            if (response.vocalUrl) stems.push({ name: 'Vocals', url: response.vocalUrl });
            if (response.instrumentalUrl) stems.push({ name: 'Instrumental', url: response.instrumentalUrl });
            if (response.backingVocalsUrl) stems.push({ name: 'Backing Vocals', url: response.backingVocalsUrl });
            if (response.drumsUrl) stems.push({ name: 'Drums', url: response.drumsUrl });
            if (response.bassUrl) stems.push({ name: 'Bass', url: response.bassUrl });
            if (response.guitarUrl) stems.push({ name: 'Guitar', url: response.guitarUrl });
            if (response.keyboardUrl) stems.push({ name: 'Keyboard', url: response.keyboardUrl });
            if (response.stringsUrl) stems.push({ name: 'Strings', url: response.stringsUrl });
            if (response.brassUrl) stems.push({ name: 'Brass', url: response.brassUrl });
            if (response.woodwindsUrl) stems.push({ name: 'Woodwinds', url: response.woodwindsUrl });
            if (response.percussionUrl) stems.push({ name: 'Percussion', url: response.percussionUrl });
            if (response.synthUrl) stems.push({ name: 'Synth', url: response.synthUrl });
            if (response.fxUrl) stems.push({ name: 'FX/Other', url: response.fxUrl });

            setSeparatedStems(stems);
            setLoadingMessage('');
            console.log('Vocal separation completed successfully');
            return;
          } else if (successFlag === 'PROCESSING') {
            setLoadingMessage(`Processing... (${attempts}/${maxAttempts})`);
            continue;
          } else if (successFlag === 'FAILED') {
            throw new Error(statusData.data.errorMessage || 'Separation failed');
          }
        }
      }

      throw new Error('Separation timed out after 5 minutes');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Stem separation error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const downloadStem = (stem: SeparatedStem) => {
    const a = document.createElement('a');
    a.href = stem.url;
    a.download = `${stem.name}.mp3`;
    a.click();
  };

  return (
    <div className="control-group">
      <h2>Vocal & Instrument Stem Separation</h2>
      <p className="prompt-context-info">
        Separate vocals and instruments from Suno-generated music. Generate music in the Suno tab first, or provide a Task ID below.
      </p>

      <div className="control-subgroup">
        <label htmlFor="music-task-id">Suno Task ID</label>
        <input
          id="music-task-id"
          type="text"
          className="prompt-textarea"
          placeholder="Enter Task ID from Suno music generation"
          value={musicTaskId}
          onChange={(e) => setMusicTaskId(e.target.value)}
          disabled={isLoading}
          style={{ minHeight: 'auto', padding: '12px', fontFamily: 'monospace' }}
        />
        <p className="prompt-context-info" style={{ marginTop: '4px', fontSize: '0.85em' }}>
          Generate music in the Suno tab to get a Task ID automatically
        </p>
      </div>

      <div className="control-subgroup">
        <label htmlFor="music-audio-id">Audio ID (Optional)</label>
        <input
          id="music-audio-id"
          type="text"
          className="prompt-textarea"
          placeholder="Specific audio variation ID (leave empty for default)"
          value={musicAudioId}
          onChange={(e) => setMusicAudioId(e.target.value)}
          disabled={isLoading}
          style={{ minHeight: 'auto', padding: '12px', fontFamily: 'monospace' }}
        />
      </div>

      {audioUrl && (
        <div className="control-subgroup">
          <label>Preview Audio</label>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
        </div>
      )}

      <div className="control-subgroup">
        <label>Separation Type</label>
        <div className="segmented-control">
          <button
            className={`segmented-control-btn ${separationType === 'separate_vocal' ? 'active' : ''}`}
            onClick={() => setSeparationType('separate_vocal')}
            disabled={isLoading}
          >
            Vocal Split
          </button>
          <button
            className={`segmented-control-btn ${separationType === 'split_stem' ? 'active' : ''}`}
            onClick={() => setSeparationType('split_stem')}
            disabled={isLoading}
          >
            Multi-Stem
          </button>
        </div>
        <p className="prompt-context-info" style={{ marginTop: '8px', fontSize: '0.85em' }}>
          {separationType === 'separate_vocal' 
            ? 'Separates into 2 stems: vocals and instrumental'
            : 'Separates into up to 12 stems: vocals, backing vocals, drums, bass, guitar, keyboard, strings, brass, woodwinds, percussion, synth, and FX'}
        </p>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={handleSeparate} 
        disabled={isLoading || !musicTaskId}
      >
        {isLoading ? (
          <>
            <div className="spinner-small" /> Separating...
          </>
        ) : (
          'Separate Stems'
        )}
      </button>

      {separatedStems.length > 0 && (
        <div className="control-subgroup" style={{ marginTop: '24px' }}>
          <h3>Separated Stems</h3>
          <div className="stems-grid">
            {separatedStems.map((stem, index) => (
              <div key={index} className="stem-card">
                <div className="stem-card-header">
                  <h4>{stem.name}</h4>
                </div>
                <audio controls src={stem.url} style={{ width: '100%', marginBottom: '8px' }} />
                <button 
                  className="btn btn-secondary" 
                  onClick={() => downloadStem(stem)}
                  style={{ width: '100%' }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="control-subgroup" style={{ marginTop: '24px' }}>
        <h3>Notes</h3>
        <ul style={{ fontSize: '0.9em', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li>All audio URLs remain accessible for 14 days</li>
          <li>Separation quality depends on the complexity of the original track</li>
          <li>Each request is charged - re-submitting triggers a new credit deduction</li>
          <li>Vocal Split returns 2 stems (vocals + instrumental)</li>
          <li>Multi-Stem returns up to 12 individual instrument tracks</li>
        </ul>
      </div>
    </div>
  );
};

export default StemSeparation;
