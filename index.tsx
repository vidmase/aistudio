/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fix for SpeechRecognition TypeScript errors by adding type definitions for the Web Speech API.
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [key: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, Part, Type, Chat } from "@google/genai";
import MaskEditor from './MaskEditor';

// --- ICONS ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
// Fix: Corrected typo in viewBox attribute.
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="15" width="18" height="6" rx="2" /><path d="M3 11V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /></svg>;
const EffectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L8 8l-5 2 5 2 2 5 2-5 5-2-5-2-2-5zM18 13l-1.5 3-3 1.5 3 1.5 1.5 3 1.5-3 3-1.5-3-1.5-1.5-3z" /></svg>;
const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M8 6h8" /><path d="M10 4h4" /><path d="M12 4v2" /><circle cx="9" cy="14" r=".5" fill="currentColor" /><circle cx="15" cy="14" r=".5" fill="currentColor" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h13a5 5 0 0 1 0 10H7" /><path d="m10 5-4 4 4 4" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9H8a5 5 0 0 0 0 10h9" /><path d="m16 5 4 4-4 4" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m8 17 4 4 4-4" /></svg>;
const SlidersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>;
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`star-icon ${filled ? 'filled' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const ChevronIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <svg style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const ExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 10.3V3.9a1 1 0 0 0-1-1H4.4a1 1 0 0 0-1 1v16.2a1 1 0 0 0 1 1h8.1" /><path d="M10.1 2.9v4.2l-2.1-1-2.1 1V2.9" /><path d="m15.5 21-3.6-6.5a1 1 0 0 1 1.8-1l3.6 6.5a1 1 0 0 1-1.8 1z" /><circle cx="15.5" cy="11.5" r="2.5" /></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const UpscaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3h4v4" /><path d="m21 3-7 7" /><path d="M3 11V7a4 4 0 0 1 4-4h4" /><path d="M21 13v4a4 4 0 0 1-4 4h-4" /><path d="M7 21H3v-4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" ry="2" /></svg>;
const FluxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const MjIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>;
const GeminiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;

// Landing Page Icons
const MusicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;



// --- ASSISTANT ICONS ---
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M7 4h2l1.5-2h3L15 4h2" /></svg>;
const LightbulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-7 7c0 3 2 5 3 6h8c1-1 3-3 3-6a7 7 0 0 0-7-7z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const PaletteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.3" /><circle cx="8" cy="8" r="1.5" /><circle cx="12" cy="7" r="1.5" /><circle cx="16" cy="8" r="1.5" /><circle cx="17" cy="12" r="1.5" /><circle cx="16" cy="16" r="1.5" /><circle cx="12" cy="17" r="1.5" /><circle cx="8" cy="16" r="1.5" /><circle cx="7" cy="12" r="1.5" /></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 10h18M10 3v18" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>;
const MountainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l4-8 4 8 4-4 5 10H3z" /></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const ShirtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 2 1 7h10l1-7Z" /><path d="M8 2c-1.5 2-2 4-2 6" /><path d="M16 2c1.5 2 2 4 2 6" /><path d="M4 10h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L8 8l-5 2 5 2 2 5 2-5 5-2-5-2-2-5zM18 13l-1.5 3-3 1.5 3 1.5 1.5 3 1.5-3 3-1.5-3-1.5-1.5-3z" /></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
const SofaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20v4H2z" /><path d="M4 12V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5" /><path d="M4 18h2m12 0h2" /></svg>;
const ChairIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.4" />
  <path d="m16 16 2 2 2-2" />
  <path d="M14 4h2a2 2 0 0 1 2 2v2" />
  <path d="M6 20h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
  <path d="M6 8h2" />
  <path d="M6 12h2" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const storyThemes = [
  { name: 'Fantasy Adventure', description: 'Create an epic scene of heroes, magic, and mythical beasts.', icon: <MountainIcon />, systemInstruction: 'You are a creative director for a fantasy movie. Guide the user step-by-step to create an epic fantasy scene. Start with the landscape.' },
  { name: 'Cyberpunk Noir', description: 'Build a gritty, neon-lit cityscape from a dystopian future.', icon: <GridIcon />, systemInstruction: 'You are a creative director for a cyberpunk film. Guide the user step-by-step to build a gritty, neon-soaked city scene. Start with the time of day and weather.' },
];

enum Tab {
  EDIT,
  EXPAND,
  STORY,
  ASSISTANT,
  EFFECTS,
  ADJUST,
  FAVORITES,
  LIBRARY,
  UPSCALE,
  FLUX,
  VEO,
  MJ,
}

interface HistoryState {
  imageDataUrl: string;
  maskDataUrl?: string | null;
}

interface StyleReport {
  palette: string[];
  subject: string;
  style: string;
  mood: string;
}

interface AssistantSuggestion {
  id: string;
  category: string;
  title: string;
  prompt: string;
  isFavorite: boolean;
}

// Premium Portfolio Landing Page Component
const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', isActive: true },
    { label: 'About', isActive: false },
    { label: 'Projects', isActive: false },
    { label: 'Experience', isActive: false },
    { label: 'Contact', isActive: false }
  ];

  const handleNavClick = () => {
    onGetStarted();
    setIsMobileMenuOpen(false);
  };

  const skills = ['AI Development', 'Creative Coding', 'Full-Stack', 'UI/UX Design'];
  const stats = [
    { label: 'Years Experience', value: '5+' },
    { label: 'Projects Completed', value: '100+' },
    { label: 'Happy Clients', value: '50+' }
  ];

  return (
    <div className="landing-page portfolio-premium">
      {/* Fixed Header */}
      <header className={`portfolio-header ${scrollY > 50 ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="logo">
            <span className="logo-text">VD</span>
          </div>
          
          <nav className="header-nav desktop-only">
            {navItems.map(item => (
              <button
                key={item.label}
                className={`header-nav-item ${item.isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <button className="header-cta desktop-only" onClick={onGetStarted}>
            Let's Talk
          </button>
          
          <button
            type="button"
            className="mobile-menu-toggle mobile-only"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-menu-nav">
          {navItems.map(item => (
            <button
              key={item.label}
              className={`mobile-nav-item ${item.isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              {item.label}
            </button>
          ))}
          <button className="mobile-cta" onClick={onGetStarted}>
            Let's Talk
          </button>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="portfolio-hero-premium">
        <div className="hero-background-premium">
          <div className="hero-image-premium"></div>
          <div className="hero-gradient-overlay"></div>
          <div className="hero-pattern"></div>
        </div>

        <div className="hero-container">
          <div className={`hero-content-premium ${isVisible ? 'animate-in' : ''}`}>
            {/* Profile Image */}
            <div className="hero-profile-image">
              <div className="profile-image-wrapper">
                <img src="/mephoto2.png" alt="Vidmantas Portfolio" className="profile-img" />
                <div className="profile-image-border"></div>
              </div>
            </div>

            {/* Badge */}
            <div className="hero-badge-premium">
              <span className="badge-dot"></span>
              Available for Freelance
            </div>

            {/* Main Content */}
            <h1 className="hero-title-premium">
              Hi, I'm <span className="gradient-text-premium">Vidmantas</span>
            </h1>
            
            <h2 className="hero-subtitle-premium">
              AI Creative Developer
            </h2>
            
            <p className="hero-description-premium">
              Crafting intelligent digital experiences at the intersection of artificial intelligence 
              and creative technology. Based in London, working globally.
            </p>

            {/* Skills Pills */}
            <div className="skills-pills">
              {skills.map((skill, index) => (
                <span key={index} className="skill-pill" style={{ animationDelay: `${index * 0.1}s` }}>
                  {skill}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hero-actions">
              <button className="btn-primary-premium" onClick={onGetStarted}>
                <span>View My Work</span>
                <ArrowRightIcon />
              </button>
              <button className="btn-secondary-premium" onClick={onGetStarted}>
                <span>Download CV</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>

            {/* Social Links */}
            <div className="social-links-premium">
              <button className="social-link-premium" title="LinkedIn" onClick={onGetStarted}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button className="social-link-premium" title="GitHub" onClick={onGetStarted}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </button>
              <button className="social-link-premium" title="Twitter" onClick={onGetStarted}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </button>
              <button className="social-link-premium" title="Instagram" onClick={onGetStarted}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className={`hero-stats-premium ${isVisible ? 'animate-in' : ''}`}>
            {stats.map((stat, index) => (
              <div key={index} className="stat-card" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.EDIT);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Layer state
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<{ id: string, url: string, report: StyleReport | null, status: 'idle' | 'loading' | 'error' }[]>([]);

  // Assistant State
  const [assistantSuggestions, setAssistantSuggestions] = useState<AssistantSuggestion[] | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState<boolean>(false);
  const [loadingMoreCategory, setLoadingMoreCategory] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Story Mode State
  const [storyTheme, setStoryTheme] = useState<string | null>(null);
  const [storySystemInstruction, setStorySystemInstruction] = useState<string>('');
  const [storyMessages, setStoryMessages] = useState<{ role: 'user' | 'model', text: string | React.ReactNode, suggestions?: string[] }[]>([]);
  const storyChat = useRef<Chat | null>(null);
  const [customStoryPrompt, setCustomStoryPrompt] = useState('');
  const [selectedStorySuggestion, setSelectedStorySuggestion] = useState<string | null>(null);

  // Expand state
  const [expandDirections, setExpandDirections] = useState<{ top: boolean, right: boolean, bottom: boolean, left: boolean }>({ top: false, right: false, bottom: false, left: false });
  const [expandPrompt, setExpandPrompt] = useState<string>('');
  const [expandNegativePrompt, setExpandNegativePrompt] = useState<string>('');

  // Voice Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Mask Editor State
  const [isMasking, setIsMasking] = useState(false);

  // Favorites State
  const favorites = useMemo(() => assistantSuggestions?.filter(s => s.isFavorite) ?? [], [assistantSuggestions]);

  // Prompt history
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  // Fullscreen view
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Landing page state
  const [showLandingPage, setShowLandingPage] = useState(true);

  // Image-dependent tabs that should only be available when an image is present
  const imageRequiredTabs = [Tab.EXPAND, Tab.ASSISTANT, Tab.UPSCALE];

  // Upscale state
  const [upscaleScale, setUpscaleScale] = useState<number>(2);
  const [upscaleFaceEnhance, setUpscaleFaceEnhance] = useState<boolean>(false);

  // VEO state
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [veoPrompt, setVeoPrompt] = useState<string>('');
  const [veoModel, setVeoModel] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [veoResolution, setVeoResolution] = useState<'720p' | '1080p'>('1080p');
  const [veoImages, setVeoImages] = useState<{ id: string, url: string }[]>([]);

  // Edit Tab Mode State
  const [editMode, setEditMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');

  // Text-to-Image State (for Edit tab)
  const [textToImagePrompt, setTextToImagePrompt] = useState<string>('');
  const [textToImageAspectRatio, setTextToImageAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '4:3' | '3:4'>('1:1');
  const [textToImageStyle, setTextToImageStyle] = useState<string>('photographic');

  // Flux State
  const [fluxPrompt, setFluxPrompt] = useState<string>('');
  const [fluxInputImage, setFluxInputImage] = useState<{ id: string, url: string } | null>(null);
  const [fluxAspectRatio, setFluxAspectRatio] = useState<'21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'>('16:9');
  const [fluxModel, setFluxModel] = useState<'flux-kontext-pro' | 'flux-kontext-max'>('flux-kontext-pro');
  const [fluxOutputFormat, setFluxOutputFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [fluxEnableTranslation, setFluxEnableTranslation] = useState<boolean>(true);
  const [fluxUploadCn, setFluxUploadCn] = useState<boolean>(false);
  const [fluxPromptUpsampling, setFluxPromptUpsampling] = useState<boolean>(false);
  const [fluxSafetyTolerance, setFluxSafetyTolerance] = useState<number>(2);
  const [fluxCallBackUrl, setFluxCallBackUrl] = useState<string>('');
  const [fluxWatermark, setFluxWatermark] = useState<string>('');

  // MJ State
  const [mjTaskType, setMjTaskType] = useState<'mj_txt2img' | 'mj_img2img' | 'mj_style_reference' | 'mj_omni_reference' | 'mj_video' | 'mj_video_hd'>('mj_txt2img');
  const [mjPrompt, setMjPrompt] = useState<string>('');
  const [mjSpeed, setMjSpeed] = useState<'relaxed' | 'fast' | 'turbo'>('relaxed');
  const [mjInputImage, setMjInputImage] = useState<{ id: string, url: string } | null>(null);
  const [mjAspectRatio, setMjAspectRatio] = useState<'1:2' | '9:16' | '2:3' | '3:4' | '5:6' | '6:5' | '4:3' | '3:2' | '1:1' | '16:9' | '2:1'>('16:9');
  const [mjVersion, setMjVersion] = useState<'7' | '6.1' | '6' | '5.2' | '5.1' | 'niji6'>('7');
  const [mjVariety, setMjVariety] = useState<number>(10);
  const [mjStylization, setMjStylization] = useState<number>(100);
  const [mjWeirdness, setMjWeirdness] = useState<number>(0);
  const [mjOmniIntensity, setMjOmniIntensity] = useState<number>(500);
  const [mjWatermark, setMjWatermark] = useState<string>('');
  const [mjEnableTranslation, setMjEnableTranslation] = useState<boolean>(false);
  const [mjCallbackUrl, setMjCallbackUrl] = useState<string>('');
  const [mjVideoBatchSize, setMjVideoBatchSize] = useState<1 | 2 | 4>(1);
  const [mjMotion, setMjMotion] = useState<'high' | 'low'>('high');
  const [mjGeneratedImages, setMjGeneratedImages] = useState<{ id: string, url: string, taskId: string }[]>([]);

  useEffect(() => {
    if (veoAspectRatio === '9:16' && veoResolution === '1080p') {
      setVeoResolution('720p');
    }
  }, [veoAspectRatio, veoResolution]);

  useEffect(() => {
    // Reset safety tolerance if it's out of bounds for the current mode (image editing vs. generation)
    const maxTolerance = fluxInputImage ? 2 : 6;
    if (fluxSafetyTolerance > maxTolerance) {
      setFluxSafetyTolerance(maxTolerance);
    }
  }, [fluxInputImage, fluxSafetyTolerance]);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string }), []);

  const currentImage = useMemo(() => history[historyIndex]?.imageDataUrl, [history, historyIndex]);

  // Auto-switch away from image-dependent tabs when no image is present
  useEffect(() => {
    if (!currentImage && imageRequiredTabs.includes(activeTab)) {
      // Switch to Edit tab as default when image is removed
      setActiveTab(Tab.EDIT);
    }
  }, [currentImage, activeTab, imageRequiredTabs]);

  // Helper function to handle tab switching with image clearing for generation tabs
  const handleTabSwitch = useCallback((tab: Tab) => {
    // Clear image when switching to generation-focused tabs (MJ, Flux)
    if ((tab === Tab.MJ || tab === Tab.FLUX) && currentImage) {
      // Clear the current image and reset to blank state
      setHistory([]);
      setHistoryIndex(-1);
      setMaskDataUrl(null);
      setReferenceImages([]);
      setPromptHistory([]);
      setStoryTheme(null);
      setStoryMessages([]);
      setGeneratedVideoUrl(null);
      setAssistantSuggestions(null);
      setMjGeneratedImages([]);
      setFluxInputImage(null);
    }
    setActiveTab(tab);
  }, [currentImage]);

  // --- Actions ---
  const addToHistory = useCallback((newImage: string, mask: string | null = maskDataUrl) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ imageDataUrl: newImage, maskDataUrl: mask });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, maskDataUrl]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setHistory([{ imageDataUrl: result, maskDataUrl: null }]);
      setHistoryIndex(0);
      setMaskDataUrl(null);
      setReferenceImages([]);
      setPromptHistory([]);
      setStoryTheme(null);
      setStoryMessages([]);
      setGeneratedVideoUrl(null);
      // Reset Assistant state on new image upload to trigger refetch
      setAssistantSuggestions(null);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const id = `ref_${Date.now()}`;
      setReferenceImages(prev => [...prev, { id, url, report: null, status: 'loading' }]);
      analyzeReferenceImage(id, url);
    };
    reader.readAsDataURL(file);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setMaskDataUrl(prevState.maskDataUrl ?? null);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setMaskDataUrl(nextState.maskDataUrl ?? null);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const base64ToPart = (base64DataUrl: string): Part | null => {
    const match = base64DataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;
    return { inlineData: { mimeType: match[1], data: match[2] } };
  };

  const generateImage = useCallback(async (currentPrompt: string) => {
    if (!currentImage || !currentPrompt) return;

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setLoadingMessage('');
    if (currentPrompt && !promptHistory.includes(currentPrompt)) {
      setPromptHistory(prev => [currentPrompt, ...prev].slice(0, 10));
    }

    try {
      const imagePart = base64ToPart(currentImage);
      if (!imagePart) throw new Error("Could not process the current image.");

      const contents: { parts: Part[] } = { parts: [imagePart] };

      if (maskDataUrl) {
        const maskPart = base64ToPart(maskDataUrl);
        if (maskPart) {
          contents.parts.push(maskPart);
        }
      }

      if (referenceImages.length > 0) {
        referenceImages.forEach(refImg => {
          const refPart = base64ToPart(refImg.url);
          if (refPart) contents.parts.push(refPart);
        });
      }

      contents.parts.push({ text: currentPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const imageOutputPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imageOutputPart && imageOutputPart.inlineData) {
        const newImageData = `data:${imageOutputPart.inlineData.mimeType};base64,${imageOutputPart.inlineData.data}`;
        addToHistory(newImageData);
        setPrompt('');
      } else {
        const textResponse = response?.text?.trim();
        if (textResponse) {
          throw new Error(`The model returned a text response instead of an image: "${textResponse}"`);
        } else {
          throw new Error("The AI did not return a valid image. It might be due to a safety policy violation or an internal error. Please try a different prompt.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, maskDataUrl, referenceImages, ai, addToHistory, promptHistory]);

  const handleGenerativeExpand = useCallback(async () => {
    const noDirectionSelected = Object.values(expandDirections).every(d => !d);
    if (!currentImage || noDirectionSelected) return;

    setIsLoading(true);
    setLoadingMessage('');
    setGeneratedVideoUrl(null);
    setError(null);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = (err) => reject(new Error("Failed to load current image for expansion."));
        image.src = currentImage;
      });

      const EXPAND_RATIO = 0.5;

      let newWidth = img.naturalWidth;
      let newHeight = img.naturalHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (expandDirections.left) {
        const expansion = img.naturalWidth * EXPAND_RATIO;
        newWidth += expansion;
        offsetX = expansion;
      }
      if (expandDirections.right) {
        newWidth += img.naturalWidth * EXPAND_RATIO;
      }
      if (expandDirections.top) {
        const expansion = img.naturalHeight * EXPAND_RATIO;
        newHeight += expansion;
        offsetY = expansion;
      }
      if (expandDirections.bottom) {
        newHeight += img.naturalHeight * EXPAND_RATIO;
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(img, offsetX, offsetY);
      const expandedImageDataUrl = canvas.toDataURL('image/png');
      const imagePart = base64ToPart(expandedImageDataUrl);
      if (!imagePart) throw new Error("Could not process the expanded image.");

      // Create an explicit mask to guide the AI
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = newWidth;
      maskCanvas.height = newHeight;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error("Could not create mask context");

      // White areas are for generation, black areas are preserved.
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, newWidth, newHeight);
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(offsetX, offsetY, img.naturalWidth, img.naturalHeight);
      const maskDataUrl = maskCanvas.toDataURL('image/png');
      const maskPart = base64ToPart(maskDataUrl);
      if (!maskPart) throw new Error("Could not process the expansion mask.");

      // A more explicit prompt that references the mask
      let prompt = `Using the provided mask, perform a high-quality outpainting task. Your goal is to fill the white-masked area, which corresponds to the transparent parts of the image. You must seamlessly extend the content from the black-masked (preserved) area. The result should be a single, cohesive image that perfectly matches the original's style, lighting, and subject matter. The original image content must not be altered.`;

      if (expandPrompt.trim()) {
        prompt += ` The newly generated areas should depict: ${expandPrompt.trim()}.`;
      }
      if (expandNegativePrompt.trim()) {
        prompt += ` Avoid generating any of the following elements: ${expandNegativePrompt.trim()}.`;
      }

      const contents = { parts: [imagePart, maskPart, { text: prompt }] };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const imageOutputPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imageOutputPart && imageOutputPart.inlineData) {
        const newImageData = `data:${imageOutputPart.inlineData.mimeType};base64,${imageOutputPart.inlineData.data}`;
        addToHistory(newImageData);
        setExpandDirections({ top: false, right: false, bottom: false, left: false });
        setExpandPrompt('');
        setExpandNegativePrompt('');
      } else {
        const textResponse = response?.text?.trim();
        if (textResponse) {
          throw new Error(`The model returned a text response instead of an image: "${textResponse}"`);
        } else {
          throw new Error("The AI did not return a valid image for expansion. It might be due to a safety policy violation or an internal error. Please try again.");
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during expansion.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, expandDirections, ai, addToHistory, expandPrompt, expandNegativePrompt]);

  const handleUpscale = useCallback(async () => {
    if (!currentImage) return;

    setIsLoading(true);
    setLoadingMessage('Upscaling image with Nano Banana...');
    setGeneratedVideoUrl(null);
    setError(null);

    try {
      const imagePart = base64ToPart(currentImage);
      if (!imagePart) throw new Error("Could not process the current image.");

      const upscalePrompt = `You are an expert image processing AI. Your task is to upscale the provided image.
        - Upscale Factor: ${upscaleScale}x. The final image should have ${upscaleScale} times the width and height of the original.
        - Face Enhancement: ${upscaleFaceEnhance ? 'Enabled. Pay special attention to enhancing and clarifying any human faces.' : 'Disabled.'}
        - Maintain the original style, lighting, and subject matter perfectly. Do not add, remove, or change any elements other than increasing the resolution and enhancing faces if requested.
        The output must be only the upscaled image.`;

      const contents = { parts: [imagePart, { text: upscalePrompt }] };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // This is the 'nano-banana' model
        contents,
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const imageOutputPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imageOutputPart && imageOutputPart.inlineData) {
        const newImageData = `data:${imageOutputPart.inlineData.mimeType};base64,${imageOutputPart.inlineData.data}`;
        addToHistory(newImageData);
      } else {
        const textResponse = response?.text?.trim();
        if (textResponse) {
          throw new Error(`The model returned a text response instead of an image: "${textResponse}"`);
        } else {
          throw new Error("The AI did not return a valid upscaled image. It might be due to a safety policy violation or an internal error. Please try again.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during upscaling.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentImage, upscaleScale, upscaleFaceEnhance, ai, addToHistory]);

  const enhancePrompt = useCallback(async () => {
    if (!prompt) return;
    setIsLoading(true);
    setLoadingMessage('');
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a creative visual assistant. Your task is to take a user's image editing prompt and expand it into a more descriptive and artistic instruction for an AI image generation model. Focus on visual details, atmosphere, lighting, and style. The user's prompt is: "${prompt}"`,
      });
      const enhancedPrompt = response.text;
      if (enhancedPrompt) {
        setPrompt(enhancedPrompt.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance prompt.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, ai]);

  const analyzeReferenceImage = useCallback(async (id: string, url: string) => {
    try {
      const imagePart = base64ToPart(url);
      if (!imagePart) throw new Error("Invalid image format");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            imagePart,
            { text: "Analyze this image and describe its key visual characteristics. Respond with a JSON object containing: 'palette' (an array of 5 dominant hex color codes), 'subject' (a brief description of the main subject), 'style' (e.g., 'photorealistic', 'impressionistic', 'minimalist'), and 'mood' (e.g., 'serene', 'energetic', 'somber')." }
          ]
        },
        config: { responseMimeType: 'application/json' },
      });

      const jsonText = response.text;
      const report = JSON.parse(jsonText) as StyleReport;
      setReferenceImages(prev => prev.map(img => img.id === id ? { ...img, report, status: 'idle' } : img));
    } catch (err) {
      console.error("Failed to analyze reference image:", err);
      setReferenceImages(prev => prev.map(img => img.id === id ? { ...img, status: 'error' } : img));
    }
  }, [ai]);

  // --- Voice Input ---
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setPrompt(prompt + finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [prompt]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setPrompt(''); // Clear prompt before starting new dictation
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleSaveMask = (maskData: string) => {
    setMaskDataUrl(maskData);
    setIsMasking(false);
  };

  // --- Story Mode Logic ---
  const parseStoryResponse = (text: string): { displayText: React.ReactNode, suggestions: string[] } => {
    const suggestions = [...text.matchAll(/\*\*(.*?)\*\*/g)].map(match => match[1]);

    if (suggestions.length === 0) {
      return { displayText: text, suggestions: [] };
    }

    const parts = text.split(/\*\*(.*?)\*\*/g);
    const displayText = (
      <>
        {parts.map((part, i) => {
          // The regex split captures the content within ** as every odd-indexed element
          return (i % 2 === 1) ? <strong key={i}>{part}</strong> : part;
        })}
      </>
    );

    return { displayText, suggestions };
  };

  const startStory = useCallback(async (systemInstruction: string) => {
    if (!currentImage) return;
    setIsLoading(true);
    setLoadingMessage('');
    setError(null);
    setStoryMessages([]);

    try {
      storyChat.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
      });

      const response = await storyChat.current.sendMessage({ message: "Start by giving me the first creative suggestion." });

      const { displayText, suggestions } = parseStoryResponse(response.text);
      setStoryMessages([{ role: 'model', text: displayText, suggestions }]);
      setSelectedStorySuggestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start story mode.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [ai, currentImage]);

  const handleApplyStorySuggestion = useCallback(async () => {
    if (!storyChat.current || !selectedStorySuggestion) return;

    setIsLoading(true);
    setLoadingMessage('');
    setError(null);

    const userMessage = `Okay, let's do this: "${selectedStorySuggestion}"`;
    setStoryMessages(prev => [...prev, { role: 'user', text: userMessage, suggestions: [] }]);

    try {
      await generateImage(selectedStorySuggestion);

      const response = await storyChat.current.sendMessage({ message: "Great, that's done. What should we do next?" });
      const { displayText, suggestions } = parseStoryResponse(response.text);
      const newModelMessage = { role: 'model' as const, text: displayText, suggestions };

      setStoryMessages(prev => [...prev, newModelMessage]);
      setSelectedStorySuggestion(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply story suggestion.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [storyChat, generateImage, selectedStorySuggestion]);

  const handleSuggestSomethingElse = useCallback(async () => {
    if (!storyChat.current) return;
    setIsLoading(true);
    setLoadingMessage('');
    setError(null);
    const userMessage = "Give me a different idea";
    setStoryMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const response = await storyChat.current.sendMessage({ message: userMessage });
      const { displayText, suggestions } = parseStoryResponse(response.text);
      const newModelMessage = { role: 'model' as const, text: displayText, suggestions };
      setStoryMessages(prev => [...prev, newModelMessage]);
      setSelectedStorySuggestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get another suggestion.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [storyChat]);

  const handleStoryThemeSelect = (theme: { name: string; systemInstruction: string; }) => {
    setStoryTheme(theme.name);
    setStorySystemInstruction(theme.systemInstruction);
    startStory(theme.systemInstruction);
  };

  const handleCustomStoryStart = () => {
    if (!customStoryPrompt.trim()) return;
    const theme = {
      name: "Custom Story",
      description: customStoryPrompt,
      systemInstruction: `You are an expert, step-by-step creative director. Your goal is to guide the user through creating an image based on their story idea: "${customStoryPrompt}". Start with a broad suggestion for the initial scene.`,
    };
    handleStoryThemeSelect(theme);
  };

  const resetStory = () => {
    setStoryTheme(null);
    setStoryMessages([]);
    storyChat.current = null;
    setSelectedStorySuggestion(null);
  };

  // --- Assistant Logic ---
  const fetchAssistantSuggestions = useCallback(async () => {
    if (!currentImage) return;
    setIsAssistantLoading(true);
    setError(null);
    try {
      const imagePart = base64ToPart(currentImage);
      if (!imagePart) throw new Error("Could not process image for suggestions.");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            imagePart,
            {
              text: `
              Analyze the image provided. Based on its content (e.g., portrait, landscape, architecture), generate a list of 10-15 creative editing suggestions.
              Categorize each suggestion into one of the following: "Photography", "People", "Architecture", "Landscapes", "Creative", "Car Tuner", "Garden Design", "Lighting".
              Return the response as a JSON array of objects. Each object must have:
              - "id": a unique string identifier (e.g., "photo_01").
              - "category": The category name.
              - "title": A short, catchy title for the suggestion (3-5 words).
              - "prompt": A detailed, descriptive prompt for an AI image model to apply the effect.
              Example: { "id": "creative_01", "category": "Creative", "title": "Surreal Dreamscape", "prompt": "Transform the image into a surreal dreamscape with floating islands, oversized glowing flora, and a pastel-colored sky with two moons." }
            `}
          ]
        },
        config: { responseMimeType: 'application/json' },
      });
      const suggestions = JSON.parse(response.text).map((s: any) => ({ ...s, isFavorite: false }));
      setAssistantSuggestions(suggestions);
    } catch (err) {
      console.error("Failed to fetch assistant suggestions:", err);
      setError("Could not get suggestions for this image.");
    } finally {
      setIsAssistantLoading(false);
    }
  }, [ai, currentImage]);

  const fetchMoreAssistantSuggestions = useCallback(async (category: string) => {
    if (!currentImage || !assistantSuggestions) return;
    setLoadingMoreCategory(category);
    setError(null);
    try {
      const imagePart = base64ToPart(currentImage);
      if (!imagePart) throw new Error("Could not process image for suggestions.");

      const existingTitles = assistantSuggestions
        .filter(s => s.category === category)
        .map(s => `"${s.title}"`)
        .join(', ');

      const moreIdeasPrompt = `
          Analyze the image provided. Generate 3-5 new, creative editing suggestions for the "${category}" category.
          Avoid generating suggestions that are similar to these existing ones: ${existingTitles}.
          Categorize each new suggestion as "${category}".
          Return the response as a JSON array of objects. Each object must have:
          - "id": a unique string identifier (e.g., "${category.toLowerCase()}_new_01").
          - "category": The category name ("${category}").
          - "title": A short, catchy title for the suggestion (3-5 words).
          - "prompt": A detailed, descriptive prompt for an AI image model to apply the effect.
          Example: { "id": "creative_new_01", "category": "Creative", "title": "Gothic Romance", "prompt": "Give the image a dark, gothic romance aesthetic with deep shadows, rich jewel tones, and a sense of dramatic melancholy." }
        `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: moreIdeasPrompt }] },
        config: { responseMimeType: 'application/json' },
      });

      const newSuggestionsData = JSON.parse(response.text);
      if (!Array.isArray(newSuggestionsData)) {
        console.warn("AI response for more suggestions was not an array.", newSuggestionsData);
        // Early exit, the finally block will still run.
        return;
      }

      const newSuggestions: AssistantSuggestion[] = newSuggestionsData.map((s: any) => ({
        ...s,
        id: `${s.category}_${Date.now()}_${Math.random()}`, // More robust unique ID
        isFavorite: false
      }));

      setAssistantSuggestions(prev => {
        if (!prev) return newSuggestions;
        // Filter for new suggestions that have a title and are not already present
        const trulyNewSuggestions = newSuggestions.filter(
          newSugg => newSugg.title && !prev.some(oldSugg => oldSugg.title === newSugg.title)
        );
        return [...prev, ...trulyNewSuggestions];
      });

    } catch (err) {
      console.error(`Failed to fetch more suggestions for ${category}:`, err);
      setError(`Could not get more suggestions for ${category}.`);
    } finally {
      setLoadingMoreCategory(null);
    }
  }, [ai, currentImage, assistantSuggestions]);

  const toggleFavorite = (id: string) => {
    setAssistantSuggestions(prev =>
      prev?.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s) ?? null
    );
  };

  // --- VEO Logic ---
  const handleVeoImageUpload = (file: File, slot: 'start' | 'end') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const id = `veo_${slot}_${Date.now()}`;
      setVeoImages(prev => {
        const newImages = [...prev];
        const existingIndex = slot === 'start' ? 0 : 1;
        if (newImages[existingIndex]) {
          newImages[existingIndex] = { id, url };
        } else {
          if (slot === 'start') newImages.unshift({ id, url });
          else newImages.push({ id, url });
        }
        return newImages.slice(0, 2);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = useCallback(async () => {
    if (!veoPrompt && veoImages.length === 0) {
      setError("Please provide a prompt or at least one image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    const messages = [
      "Initializing video generation...", "Warming up the pixels...", "Consulting the digital muses...",
      "Rendering the first few frames...", "This can take a few minutes, hang tight!",
      "Compositing the scene...", "Applying cinematic magic...", "Finalizing the video stream...",
    ];
    let messageIndex = 0;
    setLoadingMessage(messages[messageIndex]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 5000);

    try {
      const base64ToVideoGenPart = (b64: string) => {
        const match = b64.match(/^data:(.*?);base64,(.*)$/);
        if (!match) throw new Error("Invalid image data URL");
        return { imageBytes: match[2], mimeType: match[1] };
      };

      const payload: any = {
        model: veoModel,
        prompt: veoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: veoResolution,
          aspectRatio: veoAspectRatio,
        }
      };

      if (veoImages.length > 0) {
        payload.image = base64ToVideoGenPart(veoImages[0].url);
      }
      if (veoImages.length > 1) {
        payload.config.lastFrame = base64ToVideoGenPart(veoImages[1].url);
      }

      let operation = await ai.models.generateVideos(payload);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
      }

      setLoadingMessage("Downloading video...");
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }

      const videoBlob = await videoResponse.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during video generation.");
      console.error(err);
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval);
      setLoadingMessage('');
    }
  }, [ai, veoPrompt, veoModel, veoAspectRatio, veoResolution, veoImages]);

  // --- Flux Logic ---
  const handleFluxImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const id = `flux_${Date.now()}`;
      setFluxInputImage({ id, url });
    };
    reader.readAsDataURL(file);
  };

  const handleFluxGenerate = useCallback(async () => {
    if (!fluxPrompt) {
      setError("A prompt is required for Flux generation.");
      return;
    }

    if (!process.env.KIE_API_KEY) {
      setError("KIE API key is required for Flux generation. Please add KIE_API_KEY to your .env.local file.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating with Flux Kontext...');
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      // Use the correct KIE.ai API endpoint from documentation
      const endpoint = 'https://api.kie.ai/api/v1/flux/kontext/generate';

      // Prepare request body according to API spec
      const requestBody: any = {
        prompt: fluxPrompt,
        model: fluxModel,
        aspectRatio: fluxAspectRatio,
        outputFormat: fluxOutputFormat,
        safetyTolerance: fluxSafetyTolerance,
        enableTranslation: fluxEnableTranslation,
        promptUpsampling: fluxPromptUpsampling,
        uploadCn: fluxUploadCn
      };

      // Add optional parameters
      if (fluxCallBackUrl) requestBody.callBackUrl = fluxCallBackUrl;
      if (fluxWatermark) requestBody.watermark = fluxWatermark;

      // For image editing, add inputImage URL
      if (fluxInputImage) {
        requestBody.inputImage = fluxInputImage.url;
      }

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => '');
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use text as is
        }

        console.error('KIE.ai API Error:', {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          body: errorText,
          requestBody
        });

        throw new Error(`KIE.ai API error: ${apiResponse.status} - ${errorData.msg || errorData.message || errorText || apiResponse.statusText}`);
      }

      const result = await apiResponse.json();

      // Check if the API returned success
      if (result.code !== 200) {
        throw new Error(`KIE.ai API error: ${result.code} - ${result.msg || 'Unknown error'}`);
      }

      // The API returns a taskId, we need to poll for results
      const taskId = result.data?.taskId;
      if (!taskId) {
        throw new Error("No task ID returned from KIE.ai API");
      }

      setLoadingMessage(`Task ${taskId} submitted, waiting for results...`);
      console.log(`KIE.ai task submitted successfully. Task ID: ${taskId}`);
      console.log(`Task ID format: ${typeof taskId}, length: ${taskId.length}`);
      console.log(`You can check this task manually at: https://kie.ai/logs`);
      console.log(`Look for task ID: ${taskId}`);

      // Log the full API response for debugging
      console.log('Full API submission response:', result);

      // Poll for results with extended timeout since generation can take time
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max wait (KIE.ai can take longer)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;

        try {
          // Try the most likely correct endpoint based on the API documentation
          let statusResponse = null;
          let statusResult = null;

          try {
            // Use the correct record-info endpoint for polling
            statusResponse = await fetch(`https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
              }
            });

            if (statusResponse.ok) {
              statusResult = await statusResponse.json();
              console.log(`Record info response:`, statusResult);
            } else {
              console.log(`Record info failed with status: ${statusResponse.status}`);
              const errorText = await statusResponse.text();
              console.log(`Error response:`, errorText);
            }
          } catch (endpointError) {
            console.log(`Status endpoint failed:`, endpointError);
          }

          if (statusResponse && statusResponse.ok && statusResult) {
            // Log the full response to debug the structure
            console.log('Full status response:', statusResult);

            // Parse response according to KIE.ai record-info structure
            if (statusResult.code === 200) {
              const taskData = statusResult.data;
              const successFlag = taskData.successFlag;

              console.log(`Task ${taskId} successFlag: ${successFlag}`);

              if (successFlag === 1) {
                // Generation completed successfully
                console.log('Generation completed successfully!');
                const resultImageUrl = taskData.response?.resultImageUrl;

                if (resultImageUrl) {
                  console.log(`Found result image URL: ${resultImageUrl}`);

                  try {
                    const imageResponse = await fetch(resultImageUrl);
                    if (!imageResponse.ok) {
                      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
                    }
                    const imageBlob = await imageResponse.blob();
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64Data = reader.result as string;
                      if (fluxInputImage) {
                        addToHistory(base64Data);
                      } else {
                        // New generation, so reset history
                        setHistory([{ imageDataUrl: base64Data, maskDataUrl: null }]);
                        setHistoryIndex(0);
                        setMaskDataUrl(null);
                      }
                      console.log('Successfully processed image from KIE.ai!');
                    };
                    reader.readAsDataURL(imageBlob);
                    return; // Success!
                  } catch (imageError) {
                    console.error(`Failed to process image URL ${resultImageUrl}:`, imageError);
                    throw new Error(`Failed to download generated image: ${imageError.message}`);
                  }
                } else {
                  console.log('No result image URL found in response');
                }
              } else if (successFlag === 0) {
                // Task is generating, continue waiting
                console.log('Task is generating, continue waiting...');
              } else if (successFlag === 2) {
                // Create task failed
                const createError = taskData.errorMessage || 'Create task failed';
                console.error('Create task failed:', createError);
                if (taskData.errorCode) {
                  console.error('Error code:', taskData.errorCode);
                }
                throw new Error(createError);
              } else if (successFlag === 3) {
                // Generation failed
                const generateError = taskData.errorMessage || 'Generation failed';
                console.error('Generation failed:', generateError);
                if (taskData.errorCode) {
                  console.error('Error code:', taskData.errorCode);
                }
                throw new Error(generateError);
              } else {
                console.log(`Unknown successFlag: ${successFlag}`);
                if (taskData.errorMessage) {
                  console.error('Error message:', taskData.errorMessage);
                }
              }
            } else {
              // API call failed
              console.log(`Record info API failed: ${statusResult.code} - ${statusResult.msg || 'Unknown error'}`);
            }
            // Still processing, continue polling
          }
        } catch (pollError) {
          console.warn(`Error polling task status (attempt ${attempts}/${maxAttempts}):`, pollError);
          // Don't break the loop, continue trying
        }
      }

      // If we timeout, let's try one more direct approach - maybe the task completed but we couldn't poll it
      console.warn(`Polling timeout for task ${taskId}. Attempting direct result retrieval...`);

      // Make one final attempt using the correct Get Image Details endpoint
      try {
        console.log(`Final attempt: Record info for task ${taskId}`);
        const finalAttempt = await fetch(`https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
          }
        });

        if (finalAttempt.ok) {
          const finalResult = await finalAttempt.json();
          console.log(`Final attempt result:`, finalResult);

          if (finalResult.code === 200 && finalResult.data.successFlag === 1) {
            const resultImageUrl = finalResult.data.response?.resultImageUrl;

            if (resultImageUrl) {
              console.log(`Final attempt found image URL: ${resultImageUrl}`);

              const imageResponse = await fetch(resultImageUrl);
              const imageBlob = await imageResponse.blob();
              const reader = new FileReader();
              reader.onload = () => {
                const base64Data = reader.result as string;
                if (fluxInputImage) {
                  addToHistory(base64Data);
                } else {
                  setHistory([{ imageDataUrl: base64Data, maskDataUrl: null }]);
                  setHistoryIndex(0);
                  setMaskDataUrl(null);
                }
                console.log('Successfully retrieved image in final attempt!');
              };
              reader.readAsDataURL(imageBlob);
              return; // Success!
            }
          }
        } else {
          console.log(`Final attempt failed with status: ${finalAttempt.status}`);
        }
      } catch (finalError) {
        console.log(`Final attempt failed:`, finalError);
      }




      throw new Error(`Unable to retrieve generated image after ${maxAttempts} seconds. Task ID: ${taskId}. The image may have been generated successfully - check your KIE.ai dashboard at https://kie.ai/logs`);


    } catch (err) {
      // Fallback to Gemini if KIE.ai fails
      console.warn("KIE.ai Flux API failed, falling back to Gemini:", err);
      setLoadingMessage('KIE.ai failed, using Gemini fallback...');

      try {
        const contents: { parts: Part[] } = { parts: [] };

        if (fluxInputImage) {
          const imagePart = base64ToPart(fluxInputImage.url);
          if (!imagePart) throw new Error("Could not process the input image.");
          contents.parts.push(imagePart);
          contents.parts.push({ text: fluxPrompt });
        } else {
          // Text-to-image
          const generationPrompt = `${fluxPrompt} --ar ${fluxAspectRatio.replace(':', ':')}`;
          contents.parts.push({ text: generationPrompt });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents,
          config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        const imageOutputPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imageOutputPart && imageOutputPart.inlineData) {
          const newImageData = `data:${imageOutputPart.inlineData.mimeType};base64,${imageOutputPart.inlineData.data}`;
          if (fluxInputImage) {
            addToHistory(newImageData);
          } else {
            setHistory([{ imageDataUrl: newImageData, maskDataUrl: null }]);
            setHistoryIndex(0);
            setMaskDataUrl(null);
          }

          // Show warning to user
          setError("⚠️ KIE.ai Flux API unavailable - used Gemini fallback. Please check your KIE_API_KEY and account at https://kie.ai");
        } else {
          throw new Error("Both KIE.ai Flux API and Gemini fallback failed");
        }
      } catch (fallbackErr) {
        const originalError = err instanceof Error ? err.message : "Unknown KIE.ai error";
        const fallbackError = fallbackErr instanceof Error ? fallbackErr.message : "Unknown Gemini error";
        setError(`Both KIE.ai and Gemini failed.\n\nKIE.ai: ${originalError}\nGemini: ${fallbackError}\n\nPlease check your API keys and try again.`);
        console.error('Both APIs failed:', { original: err, fallback: fallbackErr });
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [fluxPrompt, fluxInputImage, fluxModel, fluxAspectRatio, fluxOutputFormat, fluxSafetyTolerance, fluxEnableTranslation, fluxPromptUpsampling, fluxCallBackUrl, fluxWatermark, fluxUploadCn, addToHistory]);

  // --- MJ Generation Logic ---
  const handleMjGenerate = useCallback(async () => {
    if (!mjPrompt) {
      setError("A prompt is required for Midjourney generation.");
      return;
    }

    if (!process.env.KIE_API_KEY) {
      setError("KIE API key is required for Midjourney generation. Please add KIE_API_KEY to your .env.local file.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating with Midjourney...');
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const endpoint = 'https://api.kie.ai/api/v1/mj/generate';

      // Prepare request body according to MJ API spec
      const requestBody: any = {
        taskType: mjTaskType,
        prompt: mjPrompt,
        aspectRatio: mjAspectRatio,
        version: mjVersion,
        variety: mjVariety,
        stylization: mjStylization,
        weirdness: mjWeirdness,
        enableTranslation: mjEnableTranslation
      };

      // Add speed only for non-video tasks
      if (mjTaskType !== 'mj_video' && mjTaskType !== 'mj_video_hd' && mjTaskType !== 'mj_omni_reference') {
        requestBody.speed = mjSpeed;
      }

      // Add optional parameters
      if (mjWatermark) requestBody.waterMark = mjWatermark;
      if (mjCallbackUrl) requestBody.callBackUrl = mjCallbackUrl;

      // Add omni intensity for omni reference tasks
      if (mjTaskType === 'mj_omni_reference') {
        requestBody.ow = mjOmniIntensity;
      }

      // Add video-specific parameters
      if (mjTaskType === 'mj_video' || mjTaskType === 'mj_video_hd') {
        requestBody.videoBatchSize = mjVideoBatchSize;
        requestBody.motion = mjMotion;
      }

      // Add input image for image-based tasks
      if (mjInputImage && (mjTaskType === 'mj_img2img' || mjTaskType === 'mj_style_reference' || mjTaskType === 'mj_omni_reference' || mjTaskType === 'mj_video' || mjTaskType === 'mj_video_hd')) {
        requestBody.fileUrls = [mjInputImage.url];
      }

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => '');
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use text as is
        }

        console.error('Midjourney API Error:', {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          body: errorText,
          requestBody
        });

        throw new Error(`Midjourney API error: ${apiResponse.status} - ${errorData.msg || errorData.message || errorText || apiResponse.statusText}`);
      }

      const result = await apiResponse.json();

      // Check if the API returned success
      if (result.code !== 200) {
        throw new Error(`Midjourney API error: ${result.code} - ${result.msg || 'Unknown error'}`);
      }

      // The API returns a taskId, we need to poll for results
      const taskId = result.data?.taskId;
      if (!taskId) {
        throw new Error("No task ID returned from Midjourney API");
      }

      setLoadingMessage(`Task ${taskId} submitted, waiting for results...`);
      console.log(`Midjourney task submitted successfully. Task ID: ${taskId}`);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes max wait (Midjourney can take longer)

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;

        try {
          const statusResponse = await fetch(`https://api.kie.ai/api/v1/mj/record-info?taskId=${taskId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
            }
          });

          if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            console.log(`MJ status response:`, statusResult);

            if (statusResult.code === 200) {
              const taskData = statusResult.data;
              const successFlag = taskData.successFlag;

              console.log(`Task ${taskId} successFlag: ${successFlag}`);

              if (successFlag === 1) {
                // Generation completed successfully
                console.log('Midjourney generation completed successfully!');
                const resultUrls = taskData.resultInfoJson?.resultUrls;

                if (resultUrls && resultUrls.length > 0) {
                  console.log(`Found ${resultUrls.length} result images`);

                  // Process all generated images
                  const newImages = resultUrls.map((result: any, index: number) => ({
                    id: `mj_${taskId}_${index}`,
                    url: result.resultUrl,
                    taskId: taskId
                  }));

                  setMjGeneratedImages(newImages);

                  // Set the first image as current if no image exists
                  if (!currentImage && newImages.length > 0) {
                    try {
                      const imageResponse = await fetch(newImages[0].url);
                      if (!imageResponse.ok) {
                        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
                      }
                      const imageBlob = await imageResponse.blob();
                      const reader = new FileReader();
                      reader.onload = () => {
                        const base64Data = reader.result as string;
                        setHistory([{ imageDataUrl: base64Data, maskDataUrl: null }]);
                        setHistoryIndex(0);
                        setMaskDataUrl(null);
                      };
                      reader.readAsDataURL(imageBlob);
                    } catch (imageError) {
                      console.error(`Failed to process first image:`, imageError);
                    }
                  }

                  console.log('Successfully processed Midjourney images!');
                  return; // Success!
                } else {
                  console.log('No result images found in response');
                }
              } else if (successFlag === 0) {
                // Task is generating, continue waiting
                console.log('Task is generating, continue waiting...');
                setLoadingMessage(`Generating... (${attempts * 5}s elapsed)`);
              } else if (successFlag === 2) {
                // Task creation failed
                const createError = taskData.errorMessage || 'Task creation failed';
                console.error('Task creation failed:', createError);
                throw new Error(createError);
              } else if (successFlag === 3) {
                // Generation failed
                const generateError = taskData.errorMessage || 'Generation failed';
                console.error('Generation failed:', generateError);
                throw new Error(generateError);
              } else {
                console.log(`Unknown successFlag: ${successFlag}`);
                if (taskData.errorMessage) {
                  console.error('Error message:', taskData.errorMessage);
                }
              }
            } else {
              console.log(`Status API failed: ${statusResult.code} - ${statusResult.msg || 'Unknown error'}`);
            }
          }
        } catch (pollError) {
          console.warn(`Error polling task status (attempt ${attempts}/${maxAttempts}):`, pollError);
        }
      }

      throw new Error(`Unable to retrieve generated images after ${maxAttempts * 5} seconds. Task ID: ${taskId}. Check your Midjourney dashboard for results.`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during Midjourney generation.");
      console.error('Midjourney generation error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [mjTaskType, mjPrompt, mjSpeed, mjInputImage, mjAspectRatio, mjVersion, mjVariety, mjStylization, mjWeirdness, mjOmniIntensity, mjWatermark, mjEnableTranslation, mjCallbackUrl, mjVideoBatchSize, mjMotion, currentImage, addToHistory]);

  const handleMjImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const id = `mj_input_${Date.now()}`;
      setMjInputImage({ id, url });
    };
    reader.readAsDataURL(file);
  };

  // --- Text-to-Image Generation Logic ---
  const handleTextToImageGenerate = useCallback(async () => {
    if (!textToImagePrompt) {
      setError('Please enter a prompt for image generation');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Generating image with Gemini...');
    setGeneratedVideoUrl(null);

    try {
      // Create a detailed prompt with style and aspect ratio guidance
      let enhancedPrompt = textToImagePrompt;

      // Add style guidance
      if (textToImageStyle === 'photographic') {
        enhancedPrompt += ', photorealistic, high quality, detailed';
      } else if (textToImageStyle === 'artistic') {
        enhancedPrompt += ', artistic style, creative, expressive';
      } else if (textToImageStyle === 'digital-art') {
        enhancedPrompt += ', digital art, modern, stylized';
      } else if (textToImageStyle === 'illustration') {
        enhancedPrompt += ', illustration style, drawn, artistic';
      }

      // Add aspect ratio guidance
      if (textToImageAspectRatio === '16:9') {
        enhancedPrompt += ', wide landscape format';
      } else if (textToImageAspectRatio === '9:16') {
        enhancedPrompt += ', tall portrait format';
      } else if (textToImageAspectRatio === '4:3') {
        enhancedPrompt += ', standard landscape format';
      } else if (textToImageAspectRatio === '3:4') {
        enhancedPrompt += ', portrait format';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const imageOutputPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imageOutputPart && imageOutputPart.inlineData) {
        const newImageData = `data:${imageOutputPart.inlineData.mimeType};base64,${imageOutputPart.inlineData.data}`;

        // Set as new image (replace history)
        setHistory([{ imageDataUrl: newImageData, maskDataUrl: null }]);
        setHistoryIndex(0);
        setMaskDataUrl(null);
        setReferenceImages([]);
        setPromptHistory([]);
        setStoryTheme(null);
        setStoryMessages([]);
        setGeneratedVideoUrl(null);

        // Add to prompt history
        if (textToImagePrompt && !promptHistory.includes(textToImagePrompt)) {
          setPromptHistory(prev => [textToImagePrompt, ...prev].slice(0, 10));
        }

        console.log('Text-to-image generated successfully');
      } else {
        const textResponse = response?.text?.trim();
        if (textResponse) {
          throw new Error(`Gemini returned a text response instead of an image: "${textResponse}"`);
        } else {
          throw new Error("Gemini did not return a valid image. Please try a different prompt or check for content policy violations.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
      console.error('Text-to-image generation error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [textToImagePrompt, textToImageStyle, textToImageAspectRatio, ai, promptHistory]);


  // --- UI Components ---
  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.EDIT:
        return (
          <div className="control-group">
            <h2>Edit</h2>

            {/* Mode Selection */}
            <div className="control-subgroup">
              <div className="segmented-control">
                <button
                  className={`segmented-control-btn ${editMode === 'text-to-image' ? 'active' : ''}`}
                  onClick={() => setEditMode('text-to-image')}
                >
                  Text to Image
                </button>
                <button
                  className={`segmented-control-btn ${editMode === 'image-to-image' ? 'active' : ''}`}
                  onClick={() => setEditMode('image-to-image')}
                >
                  Image to Image
                </button>
              </div>
            </div>

            {editMode === 'text-to-image' ? (
              // Text-to-Image Mode
              <>
                <p className="prompt-context-info">Generate images from text descriptions using AI.</p>

                <div className="control-subgroup">
                  <label htmlFor="text-to-image-prompt">Prompt</label>
                  <textarea
                    id="text-to-image-prompt"
                    className="prompt-textarea"
                    placeholder="e.g., A serene mountain landscape at sunset with a crystal clear lake"
                    value={textToImagePrompt}
                    onChange={(e) => setTextToImagePrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="control-subgroup">
                  <label>Style</label>
                  <div className="segmented-control">
                    <button className={`segmented-control-btn ${textToImageStyle === 'photographic' ? 'active' : ''}`} onClick={() => setTextToImageStyle('photographic')}>Photo</button>
                    <button className={`segmented-control-btn ${textToImageStyle === 'artistic' ? 'active' : ''}`} onClick={() => setTextToImageStyle('artistic')}>Artistic</button>
                    <button className={`segmented-control-btn ${textToImageStyle === 'digital-art' ? 'active' : ''}`} onClick={() => setTextToImageStyle('digital-art')}>Digital</button>
                    <button className={`segmented-control-btn ${textToImageStyle === 'illustration' ? 'active' : ''}`} onClick={() => setTextToImageStyle('illustration')}>Illustration</button>
                  </div>
                </div>

                <div className="control-subgroup">
                  <label>Aspect Ratio</label>
                  <div className="segmented-control">
                    <button className={`segmented-control-btn ${textToImageAspectRatio === '1:1' ? 'active' : ''}`} onClick={() => setTextToImageAspectRatio('1:1')}>1:1</button>
                    <button className={`segmented-control-btn ${textToImageAspectRatio === '4:3' ? 'active' : ''}`} onClick={() => setTextToImageAspectRatio('4:3')}>4:3</button>
                    <button className={`segmented-control-btn ${textToImageAspectRatio === '3:4' ? 'active' : ''}`} onClick={() => setTextToImageAspectRatio('3:4')}>3:4</button>
                    <button className={`segmented-control-btn ${textToImageAspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setTextToImageAspectRatio('16:9')}>16:9</button>
                    <button className={`segmented-control-btn ${textToImageAspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setTextToImageAspectRatio('9:16')}>9:16</button>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleTextToImageGenerate} disabled={isLoading || !textToImagePrompt}>
                  {isLoading ? <><div className="spinner-small" /> Generating...</> : 'Generate Image'}
                </button>
              </>
            ) : (
              // Image-to-Image Mode
              <>
                {!currentImage ? (
                  // No image - show upload option
                  <>
                    <p className="prompt-context-info">Upload an image to start editing, or drag and drop a file.</p>

                    <div className="control-subgroup">
                      <button className="btn btn-primary" onClick={() => document.getElementById('edit-upload-input')?.click()}>
                        <UploadIcon /> Upload Image
                      </button>
                      <input
                        id="edit-upload-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </>
                ) : (
                  // Image present - show editing interface
                  <>
                    <p className="prompt-context-info">Describe the changes you want to make to the current image. You can transfer objects from reference images by describing them in your prompt.</p>

                    <div className="prompt-container">
                      <textarea
                        className="prompt-textarea"
                        placeholder="e.g., Add the red car from the reference image to the street, or Transfer the flowers from the reference to the garden..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            generateImage(prompt);
                          }
                        }}
                      />
                      <div className="prompt-buttons-container">
                        <button className="btn-prompt-action btn-enhance-prompt" title="Enhance Prompt" onClick={enhancePrompt} disabled={isLoading || !prompt}>
                          {isLoading ? <div className="spinner-small" /> : <SparklesIcon />}
                        </button>
                        <button className={`btn-prompt-action btn-voice-prompt ${isListening ? 'listening' : ''}`} title="Voice Input" onClick={toggleVoiceInput}>
                          <MicIcon />
                        </button>
                        <button className="btn-prompt-action btn-clear-prompt" title="Clear Prompt" onClick={() => setPrompt('')} disabled={!prompt}>
                          <ClearIcon />
                        </button>
                      </div>
                    </div>

                    {/* Object Reference Images Section */}
                    <div className="control-subgroup">
                      <label>Object Reference Images (Optional)</label>
                      <div className="reference-library-grid">
                        {referenceImages.map((img) => (
                          <div key={img.id} className="reference-item-container">
                            <div className="reference-item">
                              <img src={img.url} alt="Object Reference" />
                              <button className="reference-item-remove-btn" onClick={() => setReferenceImages(prev => prev.filter(i => i.id !== img.id))}>&times;</button>
                            </div>
                            <div className="style-report-card">
                              {img.status === 'loading' && <div className="style-report-card status"><div className="spinner-small" />Analyzing...</div>}
                              {img.status === 'error' && <div className="style-report-card status error"><span>!</span>Error</div>}
                              {img.status === 'idle' && img.report && (
                                <>
                                  <div className="style-palette">
                                    {img.report.palette.map(color => <div key={color} className="style-palette-swatch" style={{ backgroundColor: color }}></div>)}
                                  </div>
                                  <div className="style-details">
                                    <p><strong>Objects:</strong> {img.report.subject}</p>
                                    <p><strong>Elements:</strong> {img.report.style}</p>
                                    <p><strong>Context:</strong> {img.report.mood}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        <label htmlFor="ref-upload-edit" className="reference-item-add-btn">
                          <UploadIcon />
                          <span>Add Object</span>
                        </label>
                        <input id="ref-upload-edit" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff" onChange={(e) => e.target.files && handleReferenceImageUpload(e.target.files[0])} style={{ display: 'none' }} />
                      </div>
                      {referenceImages.length > 0 && (
                        <p className="prompt-context-info" style={{ marginTop: '8px', fontSize: '0.85em' }}>
                          Objects from these reference images can be transferred into your main image. Describe what objects you want to add in your prompt.
                        </p>
                      )}
                    </div>

                    {promptHistory.length > 0 && (
                      <div className="prompt-history">
                        <div className="prompt-history-header">
                          <h4>History</h4>
                          <button className="btn-link" onClick={() => setPromptHistory([])}>Clear</button>
                        </div>
                        <div className="prompt-history-log">
                          {promptHistory.map((p, i) => (
                            <div key={i} className="prompt-history-item" onClick={() => setPrompt(p)} title="Click to reuse">{p}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button className="btn btn-primary" onClick={() => generateImage(prompt)} disabled={isLoading || !prompt}>
                      {isLoading ? <><div className="spinner-small" /> Generating...</> : 'Generate'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        );

      case Tab.EXPAND:
        const toggleDirection = (dir: 'top' | 'right' | 'bottom' | 'left') => {
          setExpandDirections(prev => ({ ...prev, [dir]: !prev[dir] }));
        };
        const noDirectionSelected = Object.values(expandDirections).every(d => !d);
        return (
          <div className="control-group">
            <h2>Generative Expand</h2>

            {!currentImage ? (
              // No image state
              <>
                <p className="prompt-context-info">Upload an image to expand its canvas with AI-generated content.</p>

                <div className="no-image-state">
                  <div className="no-image-icon">
                    <ExpandIcon />
                  </div>
                  <h3>No Image to Expand</h3>
                  <p>You need to upload an image first before you can expand it.</p>

                  <div className="no-image-actions">
                    <button className="btn btn-primary" onClick={() => document.getElementById('expand-upload-input')?.click()}>
                      <UploadIcon /> Upload Image
                    </button>
                    <input
                      id="expand-upload-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                    />

                    <div className="quick-start-options">
                      <p>Or generate an image first:</p>
                      <div className="quick-start-buttons">
                        <button className="btn btn-secondary" onClick={() => setActiveTab(Tab.EDIT)}>
                          <EditIcon /> Text to Image
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleTabSwitch(Tab.FLUX)}>
                          <FluxIcon /> Flux AI
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleTabSwitch(Tab.MJ)}>
                          <MjIcon /> Midjourney
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Image present - show expand controls
              <>
                <p className="prompt-context-info">Expand the image canvas and let AI fill in the new areas. Select the direction(s) to expand, then click generate.</p>

                <div className="expand-controls">
                  <div className="expand-grid">
                    <div /> {/* Top-left corner spacer */}
                    <button
                      className={`expand-direction-btn ${expandDirections.top ? 'active' : ''}`}
                      onClick={() => toggleDirection('top')}
                      title="Expand Top"
                    >
                      <ArrowUpIcon />
                    </button>
                    <div />

                    <button
                      className={`expand-direction-btn ${expandDirections.left ? 'active' : ''}`}
                      onClick={() => toggleDirection('left')}
                      title="Expand Left"
                    >
                      <ArrowLeftIcon />
                    </button>
                    <div className="expand-grid-center">
                      <ImageIcon />
                    </div>
                    <button
                      className={`expand-direction-btn ${expandDirections.right ? 'active' : ''}`}
                      onClick={() => toggleDirection('right')}
                      title="Expand Right"
                    >
                      <ArrowRightIcon />
                    </button>

                    <div />
                    <button
                      className={`expand-direction-btn ${expandDirections.bottom ? 'active' : ''}`}
                      onClick={() => toggleDirection('bottom')}
                      title="Expand Bottom"
                    >
                      <ArrowDownIcon />
                    </button>
                    <div />
                  </div>
                </div>

                <div className="expand-prompt-group">
                  <div className="control-subgroup">
                    <label htmlFor="expand-prompt">Prompt (Optional)</label>
                    <textarea
                      id="expand-prompt"
                      className="prompt-textarea"
                      placeholder="Describe what to add, e.g., 'a field of wildflowers, a starry night sky'"
                      value={expandPrompt}
                      onChange={(e) => setExpandPrompt(e.target.value)}
                    />
                  </div>
                  <div className="control-subgroup">
                    <label htmlFor="expand-negative-prompt">Negative Prompt (Optional)</label>
                    <textarea
                      id="expand-negative-prompt"
                      className="prompt-textarea"
                      placeholder="Describe what to avoid, e.g., 'buildings, people, text'"
                      value={expandNegativePrompt}
                      onChange={(e) => setExpandNegativePrompt(e.target.value)}
                    />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleGenerativeExpand} disabled={isLoading || noDirectionSelected}>
                  {isLoading ? <><div className="spinner-small" /> Expanding...</> : 'Generate Expand'}
                </button>
              </>
            )}
          </div>
        );
      case Tab.UPSCALE:
        return (
          <div className="control-group">
            <h2>Upscale Image</h2>

            {!currentImage ? (
              // No image state
              <>
                <p className="prompt-context-info">Upload an image to enhance its resolution with AI upscaling.</p>

                <div className="no-image-state">
                  <div className="no-image-icon">
                    <UpscaleIcon />
                  </div>
                  <h3>No Image to Upscale</h3>
                  <p>You need to upload an image first before you can upscale it.</p>

                  <div className="no-image-actions">
                    <button className="btn btn-primary" onClick={() => document.getElementById('upscale-upload-input')?.click()}>
                      <UploadIcon /> Upload Image
                    </button>
                    <input
                      id="upscale-upload-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                    />

                    <div className="quick-start-options">
                      <p>Or generate an image first:</p>
                      <div className="quick-start-buttons">
                        <button className="btn btn-secondary" onClick={() => setActiveTab(Tab.EDIT)}>
                          <EditIcon /> Text to Image
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleTabSwitch(Tab.FLUX)}>
                          <FluxIcon /> Flux AI
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleTabSwitch(Tab.MJ)}>
                          <MjIcon /> Midjourney
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Image present - show upscale controls
              <>
                <p className="prompt-context-info">Enhance your image resolution. Upscale up to 4x with optional face enhancement for portraits.</p>

                <div className="control-subgroup">
                  <label>Scale Factor</label>
                  <div className="segmented-control">
                    {[2, 3, 4].map(scale => (
                      <button
                        key={scale}
                        className={`segmented-control-btn ${upscaleScale === scale ? 'active' : ''}`}
                        onClick={() => setUpscaleScale(scale)}
                      >
                        {scale}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-subgroup">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={upscaleFaceEnhance}
                      onChange={(e) => setUpscaleFaceEnhance(e.target.checked)}
                    />
                    <span>Enhance Faces</span>
                  </label>
                  <p className="prompt-context-info" style={{ marginTop: '4px' }}>Good for portraits and photos with people. May produce unnatural results on other types of images.</p>
                </div>

                <button className="btn btn-primary" onClick={handleUpscale} disabled={isLoading}>
                  {isLoading ? <><div className="spinner-small" /> Upscaling...</> : 'Upscale Image'}
                </button>
              </>
            )}
          </div>
        );
      case Tab.FLUX:
        return (
          <div className="control-group">
            <h2>Flux Kontext AI</h2>
            <p className="prompt-context-info">Generate or edit images using KIE.ai's Flux Kontext models. Requires KIE_API_KEY in your environment.</p>

            <div className="control-subgroup">
              <label htmlFor="flux-prompt">Prompt</label>
              <textarea
                id="flux-prompt"
                className="prompt-textarea"
                placeholder="A serene mountain landscape at sunset..."
                value={fluxPrompt}
                onChange={(e) => setFluxPrompt(e.target.value)}
              />
            </div>

            <div className="control-subgroup">
              <label>Input Image (for editing)</label>
              <div className="veo-image-slots" style={{ gridTemplateColumns: '1fr' }}>
                <label htmlFor="flux-upload-start" className="veo-image-slot">
                  {fluxInputImage ? (
                    <>
                      <img src={fluxInputImage.url} alt="Input" />
                      <button className="veo-image-slot-remove-btn" onClick={(e) => { e.preventDefault(); setFluxInputImage(null); }}>&times;</button>
                    </>
                  ) : (
                    <>
                      <UploadIcon />
                      <span>Upload Image</span>
                    </>
                  )}
                </label>
                <input id="flux-upload-start" type="file" accept="image/*" onChange={(e) => e.target.files && handleFluxImageUpload(e.target.files[0])} style={{ display: 'none' }} />
              </div>
            </div>

            <div className="control-subgroup">
              <label>Aspect Ratio</label>
              <div className="segmented-control">
                {(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] as const).map(ratio => (
                  <button
                    key={ratio}
                    className={`segmented-control-btn ${fluxAspectRatio === ratio ? 'active' : ''}`}
                    onClick={() => setFluxAspectRatio(ratio)}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
              <p className="prompt-context-info" style={{ marginTop: '4px' }}>For text-to-image only. Edits retain original aspect ratio.</p>
            </div>

            <div className="control-subgroup">
              <label>Model</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${fluxModel === 'flux-kontext-pro' ? 'active' : ''}`} onClick={() => setFluxModel('flux-kontext-pro')}>Pro</button>
                <button className={`segmented-control-btn ${fluxModel === 'flux-kontext-max' ? 'active' : ''}`} onClick={() => setFluxModel('flux-kontext-max')}>Max</button>
              </div>
            </div>

            <div className="control-subgroup">
              <label>Safety Tolerance ({fluxSafetyTolerance})</label>
              <input
                type="range"
                min="0"
                max={fluxInputImage ? 2 : 6}
                value={fluxSafetyTolerance}
                onChange={(e) => setFluxSafetyTolerance(Number(e.target.value))}
              />
            </div>

            <div className="control-subgroup">
              <label>Output Format</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${fluxOutputFormat === 'jpeg' ? 'active' : ''}`} onClick={() => setFluxOutputFormat('jpeg')}>JPEG</button>
                <button className={`segmented-control-btn ${fluxOutputFormat === 'png' ? 'active' : ''}`} onClick={() => setFluxOutputFormat('png')}>PNG</button>
              </div>
            </div>

            <div className="control-subgroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={fluxEnableTranslation} onChange={(e) => setFluxEnableTranslation(e.target.checked)} />
                <span>Auto-Translate</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={fluxPromptUpsampling} onChange={(e) => setFluxPromptUpsampling(e.target.checked)} />
                <span>Upsample Prompt</span>
              </label>
            </div>

            <button className="btn btn-primary" onClick={handleFluxGenerate} disabled={isLoading || !fluxPrompt}>
              {isLoading ? <><div className="spinner-small" /> Generating...</> : (fluxInputImage ? 'Edit Image' : 'Generate Image')}
            </button>
          </div>
        );

      case Tab.MJ:
        return (
          <div className="control-group">
            <h2>Midjourney Generation</h2>
            <p className="prompt-context-info">Generate high-quality images using Midjourney AI. Supports text-to-image, image-to-image, and video generation.</p>

            {/* Task Type Selection */}
            <div className="control-subgroup">
              <label>Generation Type</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${mjTaskType === 'mj_txt2img' ? 'active' : ''}`} onClick={() => setMjTaskType('mj_txt2img')}>Text to Image</button>
                <button className={`segmented-control-btn ${mjTaskType === 'mj_img2img' ? 'active' : ''}`} onClick={() => setMjTaskType('mj_img2img')}>Image to Image</button>
                <button className={`segmented-control-btn ${mjTaskType === 'mj_style_reference' ? 'active' : ''}`} onClick={() => setMjTaskType('mj_style_reference')}>Style Reference</button>
                <button className={`segmented-control-btn ${mjTaskType === 'mj_video' ? 'active' : ''}`} onClick={() => setMjTaskType('mj_video')}>Video</button>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="control-subgroup">
              <label htmlFor="mj-prompt">Prompt</label>
              <textarea
                id="mj-prompt"
                className="prompt-textarea"
                placeholder="e.g., A majestic dragon soaring through clouds at sunset, fantasy art style"
                value={mjPrompt}
                onChange={(e) => setMjPrompt(e.target.value)}
                rows={4}
              />
            </div>

            {/* Input Image for img2img, style reference, and video */}
            {(mjTaskType === 'mj_img2img' || mjTaskType === 'mj_style_reference' || mjTaskType === 'mj_omni_reference' || mjTaskType === 'mj_video' || mjTaskType === 'mj_video_hd') && (
              <div className="control-subgroup">
                <label>Input Image</label>
                {mjInputImage ? (
                  <div className="flux-input-image-preview">
                    <img src={mjInputImage.url} alt="Input" />
                    <button className="flux-input-image-remove" onClick={() => setMjInputImage(null)}>&times;</button>
                  </div>
                ) : (
                  <div>
                    <button className="btn btn-secondary" onClick={() => document.getElementById('mj-image-input')?.click()}>
                      <UploadIcon /> Upload Image
                    </button>
                    <input
                      id="mj-image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                      onChange={(e) => e.target.files && handleMjImageUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Speed Selection (not for video or omni reference) */}
            {mjTaskType !== 'mj_video' && mjTaskType !== 'mj_video_hd' && mjTaskType !== 'mj_omni_reference' && (
              <div className="control-subgroup">
                <label>Speed</label>
                <div className="segmented-control">
                  <button className={`segmented-control-btn ${mjSpeed === 'relaxed' ? 'active' : ''}`} onClick={() => setMjSpeed('relaxed')}>Relaxed</button>
                  <button className={`segmented-control-btn ${mjSpeed === 'fast' ? 'active' : ''}`} onClick={() => setMjSpeed('fast')}>Fast</button>
                  <button className={`segmented-control-btn ${mjSpeed === 'turbo' ? 'active' : ''}`} onClick={() => setMjSpeed('turbo')}>Turbo</button>
                </div>
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="control-subgroup">
              <label>Aspect Ratio</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${mjAspectRatio === '1:1' ? 'active' : ''}`} onClick={() => setMjAspectRatio('1:1')}>1:1</button>
                <button className={`segmented-control-btn ${mjAspectRatio === '4:3' ? 'active' : ''}`} onClick={() => setMjAspectRatio('4:3')}>4:3</button>
                <button className={`segmented-control-btn ${mjAspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setMjAspectRatio('16:9')}>16:9</button>
                <button className={`segmented-control-btn ${mjAspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setMjAspectRatio('9:16')}>9:16</button>
              </div>
            </div>

            {/* Model Version */}
            <div className="control-subgroup">
              <label>Model Version</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${mjVersion === '7' ? 'active' : ''}`} onClick={() => setMjVersion('7')}>v7</button>
                <button className={`segmented-control-btn ${mjVersion === '6.1' ? 'active' : ''}`} onClick={() => setMjVersion('6.1')}>v6.1</button>
                <button className={`segmented-control-btn ${mjVersion === '6' ? 'active' : ''}`} onClick={() => setMjVersion('6')}>v6</button>
                <button className={`segmented-control-btn ${mjVersion === 'niji6' ? 'active' : ''}`} onClick={() => setMjVersion('niji6')}>Niji 6</button>
              </div>
            </div>

            {/* Advanced Parameters */}
            <div className="control-subgroup">
              <label>Variety (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={mjVariety}
                onChange={(e) => setMjVariety(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{mjVariety}</span>
            </div>

            <div className="control-subgroup">
              <label>Stylization (0-1000)</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={mjStylization}
                onChange={(e) => setMjStylization(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{mjStylization}</span>
            </div>

            <div className="control-subgroup">
              <label>Weirdness (0-3000)</label>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={mjWeirdness}
                onChange={(e) => setMjWeirdness(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{mjWeirdness}</span>
            </div>

            {/* Video-specific parameters */}
            {(mjTaskType === 'mj_video' || mjTaskType === 'mj_video_hd') && (
              <>
                <div className="control-subgroup">
                  <label>Video Batch Size</label>
                  <div className="segmented-control">
                    <button className={`segmented-control-btn ${mjVideoBatchSize === 1 ? 'active' : ''}`} onClick={() => setMjVideoBatchSize(1)}>1</button>
                    <button className={`segmented-control-btn ${mjVideoBatchSize === 2 ? 'active' : ''}`} onClick={() => setMjVideoBatchSize(2)}>2</button>
                    <button className={`segmented-control-btn ${mjVideoBatchSize === 4 ? 'active' : ''}`} onClick={() => setMjVideoBatchSize(4)}>4</button>
                  </div>
                </div>

                <div className="control-subgroup">
                  <label>Motion Level</label>
                  <div className="segmented-control">
                    <button className={`segmented-control-btn ${mjMotion === 'high' ? 'active' : ''}`} onClick={() => setMjMotion('high')}>High</button>
                    <button className={`segmented-control-btn ${mjMotion === 'low' ? 'active' : ''}`} onClick={() => setMjMotion('low')}>Low</button>
                  </div>
                </div>
              </>
            )}

            {/* Optional Settings */}
            <div className="control-subgroup">
              <label>
                <input
                  type="checkbox"
                  checked={mjEnableTranslation}
                  onChange={(e) => setMjEnableTranslation(e.target.checked)}
                />
                Enable automatic translation
              </label>
            </div>

            {/* Generated Images Display */}
            {mjGeneratedImages.length > 0 && (
              <div className="control-subgroup">
                <label>Generated Images</label>
                <div className="mj-generated-images-grid">
                  {mjGeneratedImages.map((img, index) => (
                    <div key={img.id} className="mj-generated-image-item">
                      <img
                        src={img.url}
                        alt={`Generated ${index + 1}`}
                        onClick={() => setFullscreenImage(img.url)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="mj-generated-image-actions">
                        <button
                          className="btn btn-small"
                          onClick={() => setFullscreenImage(img.url)}
                        >
                          View Full Size
                        </button>
                        <button
                          className="btn btn-small"
                          onClick={() => {
                            // Set as current image
                            fetch(img.url)
                              .then(response => response.blob())
                              .then(blob => {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const base64Data = reader.result as string;
                                  addToHistory(base64Data);
                                };
                                reader.readAsDataURL(blob);
                              });
                          }}
                        >
                          Use Image
                        </button>
                        <a href={img.url} download={`midjourney_${img.id}.jpg`} className="btn btn-small">
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleMjGenerate} disabled={isLoading || !mjPrompt}>
              {isLoading ? <><div className="spinner-small" /> Generating...</> : 'Generate with Midjourney'}
            </button>
          </div>
        );

      case Tab.VEO:
        return (
          <div className="control-group">
            <h2>VEO 3.1 Video Generation</h2>
            <p className="prompt-context-info">Create videos from text or images. Video generation can take several minutes.</p>

            <div className="control-subgroup">
              <label htmlFor="veo-prompt">Prompt</label>
              <textarea
                id="veo-prompt"
                className="prompt-textarea"
                placeholder="e.g., A majestic eagle soaring over a mountain range at sunrise"
                value={veoPrompt}
                onChange={(e) => setVeoPrompt(e.target.value)}
              />
            </div>

            <div className="control-subgroup">
              <label>Images (Optional)</label>
              <div className="veo-image-slots">
                <label htmlFor="veo-upload-start" className="veo-image-slot">
                  {veoImages[0] ? (
                    <>
                      <img src={veoImages[0].url} alt="Start frame" />
                      <button className="veo-image-slot-remove-btn" onClick={(e) => { e.preventDefault(); setVeoImages(p => p.filter((_, i) => i !== 0)); }}>&times;</button>
                    </>
                  ) : (
                    <>
                      <UploadIcon />
                      <span>Start Image</span>
                    </>
                  )}
                </label>
                <input id="veo-upload-start" type="file" accept="image/*" onChange={(e) => e.target.files && handleVeoImageUpload(e.target.files[0], 'start')} style={{ display: 'none' }} />

                <label htmlFor="veo-upload-end" className="veo-image-slot">
                  {veoImages[1] ? (
                    <>
                      <img src={veoImages[1].url} alt="End frame" />
                      <button className="veo-image-slot-remove-btn" onClick={(e) => { e.preventDefault(); setVeoImages(p => p.filter((_, i) => i !== 1)); }}>&times;</button>
                    </>
                  ) : (
                    <>
                      <UploadIcon />
                      <span>End Image</span>
                    </>
                  )}
                </label>
                <input id="veo-upload-end" type="file" accept="image/*" onChange={(e) => e.target.files && handleVeoImageUpload(e.target.files[0], 'end')} style={{ display: 'none' }} />
              </div>
              <p className="prompt-context-info" style={{ marginTop: '4px' }}>Provide one image to animate it, or two images to transition from start to end.</p>
            </div>

            <div className="control-subgroup">
              <label>Model</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${veoModel === 'veo-3.1-fast-generate-preview' ? 'active' : ''}`} onClick={() => setVeoModel('veo-3.1-fast-generate-preview')}>Fast</button>
                <button className={`segmented-control-btn ${veoModel === 'veo-3.1-generate-preview' ? 'active' : ''}`} onClick={() => setVeoModel('veo-3.1-generate-preview')}>Quality</button>
              </div>
            </div>

            <div className="control-subgroup">
              <label>Aspect Ratio & Resolution</label>
              <div className="segmented-control">
                <button className={`segmented-control-btn ${veoAspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setVeoAspectRatio('16:9')}>16:9</button>
                <button className={`segmented-control-btn ${veoAspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setVeoAspectRatio('9:16')}>9:16</button>
              </div>
              <div className="segmented-control" style={{ marginTop: '8px' }}>
                <button className={`segmented-control-btn ${veoResolution === '720p' ? 'active' : ''}`} onClick={() => setVeoResolution('720p')}>720p</button>
                <button className={`segmented-control-btn ${veoResolution === '1080p' ? 'active' : ''}`} onClick={() => setVeoResolution('1080p')} disabled={veoAspectRatio === '9:16'}>1080p</button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleGenerateVideo} disabled={isLoading || (!veoPrompt && veoImages.length === 0)}>
              {isLoading ? <><div className="spinner-small" /> Generating Video...</> : 'Generate Video'}
            </button>
          </div>
        );
      case Tab.ASSISTANT:
        if (!currentImage) {
          return (
            <div className="control-group">
              <h2>AI Assistant</h2>
              <p className="prompt-context-info">Upload an image to get AI-powered editing suggestions and creative ideas.</p>

              <div className="no-image-state">
                <div className="no-image-icon">
                  <AssistantIcon />
                </div>
                <h3>No Image to Analyze</h3>
                <p>You need to upload an image first before the AI can provide suggestions.</p>

                <div className="no-image-actions">
                  <button className="btn btn-primary" onClick={() => document.getElementById('assistant-upload-input')?.click()}>
                    <UploadIcon /> Upload Image
                  </button>
                  <input
                    id="assistant-upload-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                  />

                  <div className="quick-start-options">
                    <p>Or generate an image first:</p>
                    <div className="quick-start-buttons">
                      <button className="btn btn-secondary" onClick={() => setActiveTab(Tab.EDIT)}>
                        <EditIcon /> Text to Image
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleTabSwitch(Tab.FLUX)}>
                        <FluxIcon /> Flux AI
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleTabSwitch(Tab.MJ)}>
                        <MjIcon /> Midjourney
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (isAssistantLoading) {
          return <div className="loader"><div className="spinner" /> <p>Analyzing image...</p></div>;
        }

        if (!assistantSuggestions) {
          return (
            <div className="control-group">
              <h2>AI Assistant</h2>
              <div className="assistant-onboarding">
                <LightbulbIcon />
                <h3>Unlock Creative Ideas</h3>
                <p>Let the AI analyze your image and provide personalized editing suggestions.</p>
                <button className="btn btn-primary" onClick={fetchAssistantSuggestions} disabled={isLoading}>
                  Analyze Image
                </button>
              </div>
            </div>
          );
        }

        const categories = [...new Set(assistantSuggestions.map(s => s.category))];
        return (
          <div className="control-group assistant-categories">
            <h2>AI Assistant</h2>
            {categories.map(category => (
              <div key={category} className={`assistant-category ${collapsedCategories.has(category) ? 'collapsed' : ''}`}>
                <button
                  className="assistant-category-header"
                  onClick={() => setCollapsedCategories(prev => {
                    const next = new Set(prev);
                    next.has(category) ? next.delete(category) : next.add(category);
                    return next;
                  })}
                  aria-expanded={!collapsedCategories.has(category)}
                >
                  <h3>{category}</h3>
                  <ChevronIcon isCollapsed={collapsedCategories.has(category)} />
                </button>
                <div className="suggestion-buttons">
                  {assistantSuggestions.filter(s => s.category === category).map(suggestion => (
                    <div key={suggestion.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className={`btn btn-secondary assistant-btn ${suggestion.category.toLowerCase().replace(/ /g, '-')}`}
                        onClick={() => generateImage(suggestion.prompt)}
                        disabled={isLoading}
                      >
                        <div className="assistant-btn-icon-container">
                          <LightbulbIcon />
                        </div>
                        <div className="assistant-btn-text-container">
                          <span className="assistant-btn-title">{suggestion.title}</span>
                        </div>
                      </button>
                      <button
                        className="btn-favorite"
                        title={suggestion.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                        onClick={() => toggleFavorite(suggestion.id)}
                      >
                        <StarIcon filled={suggestion.isFavorite} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="more-ideas-container">
                  <button
                    className="btn btn-secondary btn-more-ideas"
                    onClick={() => fetchMoreAssistantSuggestions(category)}
                    disabled={isAssistantLoading || loadingMoreCategory !== null}
                  >
                    {loadingMoreCategory === category ? (
                      <><div className="spinner-small" /> Generating...</>
                    ) : (
                      <><SparklesIcon /> More Ideas</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case Tab.FAVORITES:
        return (
          <div className="control-group favorites-tab">
            <h2>Favorite Prompts</h2>
            {favorites.length === 0 ? (
              <div className="favorites-empty">
                <h3>No Favorites Yet</h3>
                <p>Click the <StarIcon filled={false} /> icon next to an assistant suggestion to save it here.</p>
              </div>
            ) : (
              <div className="favorites-list">
                {favorites.map(fav => (
                  <div key={fav.id} className={`favorite-card ${fav.category.toLowerCase().replace(' ', '-')}`}>
                    <div className="favorite-card-visual">
                      <LightbulbIcon />
                    </div>
                    <div className="favorite-card-content">
                      <div className="favorite-card-header">
                        <h3>{fav.title}</h3>
                        <button className="btn-favorite" title="Remove from Favorites" onClick={() => toggleFavorite(fav.id)}>
                          <StarIcon filled={true} />
                        </button>
                      </div>
                      <p className="favorite-prompt-text">{fav.prompt}</p>
                      <div className="favorite-card-actions">
                        <button className="btn btn-secondary" onClick={() => { setPrompt(fav.prompt); setActiveTab(Tab.EDIT); }}>Use Prompt</button>
                        <button className="btn btn-primary" onClick={() => generateImage(fav.prompt)} disabled={isLoading}>Apply Now</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case Tab.STORY:
        if (!storyTheme) {
          return (
            <div className="story-theme-selection">
              <h2>Choose a Story Theme</h2>
              <p>Select a theme to begin your guided creative journey, or write your own idea below.</p>
              {storyThemes.map(theme => (
                <button key={theme.name} className="story-theme-card" onClick={() => handleStoryThemeSelect(theme)}>
                  <div className="story-theme-card-icon">{theme.icon}</div>
                  <div>
                    <h3>{theme.name}</h3>
                    <p>{theme.description}</p>
                  </div>
                </button>
              ))}
              <div className="custom-story-input-group">
                <h3>Or create your own story</h3>
                <textarea
                  className="prompt-textarea"
                  placeholder="e.g., A serene underwater city of bioluminescent creatures..."
                  value={customStoryPrompt}
                  onChange={(e) => setCustomStoryPrompt(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleCustomStoryStart}
                  disabled={!customStoryPrompt.trim() || isLoading}
                >
                  Start My Story
                </button>
              </div>
            </div>
          );
        }
        const lastMessage = storyMessages[storyMessages.length - 1];
        return (
          <div className="story-chat-container">
            <div className="story-chat-header">
              <h3>Story: {storyTheme}</h3>
              <button className="btn btn-secondary" onClick={resetStory}>End Story</button>
            </div>
            <div className="story-chat-log">
              {storyMessages.map((msg, i) => (
                <div key={i} className={`story-message ${msg.role}`}>{msg.text}</div>
              ))}
              {isLoading && lastMessage?.role === 'user' && <div className="story-message model"><div className="spinner-small" /></div>}
            </div>

            {!isLoading && lastMessage?.role === 'model' && lastMessage.suggestions && lastMessage.suggestions.length > 0 && (
              <div className="story-suggestion-options">
                <h4>Choose a suggestion:</h4>
                {lastMessage.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`suggestion-option-btn ${selectedStorySuggestion === suggestion ? 'selected' : ''}`}
                    onClick={() => setSelectedStorySuggestion(suggestion)}
                  >
                    {selectedStorySuggestion === suggestion && <CheckIcon />}
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="story-actions">
              <p className="prompt-context-info">The AI is guiding you. Choose a response to continue the story.</p>
              <button className="btn btn-primary" onClick={handleApplyStorySuggestion} disabled={isLoading || !selectedStorySuggestion}>Apply Suggestion</button>
              <button className="btn btn-secondary" onClick={handleSuggestSomethingElse} disabled={isLoading}>Suggest Something Else</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Tabs that don't require an image to function
  const tabsWithoutImageRequirement = [Tab.FLUX, Tab.MJ, Tab.VEO, Tab.STORY, Tab.EDIT];
  const canWorkWithoutImage = tabsWithoutImageRequirement.includes(activeTab);

  const handleStartWithoutImage = (tab: Tab) => {
    setActiveTab(tab);
    // If switching to Edit tab without an image, default to text-to-image mode
    if (tab === Tab.EDIT && !currentImage) {
      setEditMode('text-to-image');
    }
  };

  // Show landing page first
  if (showLandingPage) {
    return <LandingPage onGetStarted={() => setShowLandingPage(false)} />;
  }

  if (!currentImage && !canWorkWithoutImage) {
    return <UploadView onImageUpload={handleImageUpload} onStartWithoutImage={handleStartWithoutImage} />;
  }

  return (
    <div className="editor-view">
      {isMasking && <MaskEditor imageSrc={currentImage} initialMaskSrc={maskDataUrl} onSave={handleSaveMask} onCancel={() => setIsMasking(false)} ai={ai} />}
      {fullscreenImage && (
        <div className="fullscreen-image-overlay" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt="Full screen view" />
          <button className="btn-icon btn-close-fullscreen" onClick={() => setFullscreenImage(null)}>&times;</button>
        </div>
      )}
      <header className="app-header">
        <h1 className="app-title">Imagina</h1>
        <div className="header-controls">
          <button className="btn-icon" onClick={undo} disabled={historyIndex <= 0}><UndoIcon /> <span className="visually-hidden">Undo</span></button>
          <button className="btn-icon" onClick={redo} disabled={historyIndex >= history.length - 1}><RedoIcon /> <span className="visually-hidden">Redo</span></button>
          <button className="btn btn-secondary" onClick={() => document.getElementById('upload-input')?.click()}><UploadIcon /> <span className="btn-text">New</span></button>
          <input id="upload-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} style={{ display: 'none' }} />
          {currentImage && <a href={currentImage} download="edited-image.png" className="btn btn-primary"><DownloadIcon /> <span className="btn-text">Download</span></a>}
        </div>
      </header>
      <div className="app-layout">
        <nav className="main-nav">
          <button className={`tab-button ${activeTab === Tab.EDIT ? 'active' : ''}`} onClick={() => setActiveTab(Tab.EDIT)}><EditIcon /><span>Edit</span></button>

          {/* Image-dependent tabs - only show when image is present */}
          {currentImage && (
            <>
              <button className={`tab-button ${activeTab === Tab.EXPAND ? 'active' : ''}`} onClick={() => setActiveTab(Tab.EXPAND)}><ExpandIcon /><span>Expand</span></button>
              <button className={`tab-button ${activeTab === Tab.ASSISTANT ? 'active' : ''}`} onClick={() => setActiveTab(Tab.ASSISTANT)}><AssistantIcon /><span>Assistant</span></button>
              <button className={`tab-button ${activeTab === Tab.UPSCALE ? 'active' : ''}`} onClick={() => setActiveTab(Tab.UPSCALE)}><UpscaleIcon /><span>Upscale</span></button>
            </>
          )}

          <button className={`tab-button ${activeTab === Tab.STORY ? 'active' : ''}`} onClick={() => setActiveTab(Tab.STORY)}><BookOpenIcon /><span>Story</span></button>
          <button className={`tab-button ${activeTab === Tab.FAVORITES ? 'active' : ''}`} onClick={() => setActiveTab(Tab.FAVORITES)}>
            <StarIcon filled={activeTab === Tab.FAVORITES} />
            <span>Favorites</span>
          </button>
          <button className={`tab-button ${activeTab === Tab.FLUX ? 'active' : ''}`} onClick={() => handleTabSwitch(Tab.FLUX)}><FluxIcon /><span>Flux</span></button>
          <button className={`tab-button ${activeTab === Tab.MJ ? 'active' : ''}`} onClick={() => handleTabSwitch(Tab.MJ)}><MjIcon /><span>MJ</span></button>
          <button className={`tab-button ${activeTab === Tab.VEO ? 'active' : ''}`} onClick={() => setActiveTab(Tab.VEO)}><VideoIcon /><span>VEO</span></button>
        </nav>
        <aside className="control-panel">
          <div className="tab-content">
            {error && <div className="error-message">{error}</div>}
            {renderTabContent()}
          </div>
        </aside>
        <main className="main-workspace">
          {generatedVideoUrl ? (
            <div className="video-display-container">
              <video src={generatedVideoUrl} controls autoPlay loop />
            </div>
          ) : currentImage ? (
            <ImageDisplay imageUrl={currentImage} isLoading={isLoading} loadingMessage={loadingMessage} onExpand={() => setFullscreenImage(currentImage)} />
          ) : (
            <div className="no-image-workspace">
              <div className="workspace-placeholder">
                <h2>Ready to Create</h2>
                <p>Use the {activeTab === Tab.EDIT ? 'Edit' : activeTab === Tab.FLUX ? 'Flux' : activeTab === Tab.MJ ? 'Midjourney' : activeTab === Tab.VEO ? 'VEO' : 'Story'} panel to generate content.</p>
                {isLoading && (
                  <div className="loader">
                    <div className="spinner" />
                    <p>{loadingMessage || 'Generating...'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};


const ImageDisplay = ({ imageUrl, isLoading, loadingMessage, onExpand }: { imageUrl: string, isLoading: boolean, loadingMessage?: string, onExpand: () => void }) => (
  <div className="image-display-container">
    <div className="image-display">
      {isLoading && (
        <div className="loader">
          <div className="spinner" />
          <p>{loadingMessage || 'Generating...'}</p>
        </div>
      )}
      <img src={imageUrl} alt="Edited result" />
      <button className="btn btn-icon btn-expand-image" onClick={onExpand} title="Expand Image">
        <ExpandIcon />
      </button>
    </div>
  </div>
);

const UploadView: React.FC<{ onImageUpload: (file: File) => void, onStartWithoutImage: (tab: Tab) => void }> = ({ onImageUpload, onStartWithoutImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="upload-view" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className={`hero-section ${isDragging ? 'drag-over' : ''}`}>
        <div className="hero-content">
          <h1 className="hero-title">Imagina</h1>
          <p className="hero-subtitle">AI-Powered Creative Studio</p>
          <p className="hero-description">
            Generate images from text • Edit with AI • Transfer objects • Create videos • Expand canvases • Upscale resolution
          </p>

          <div className="hero-enter-container">
            <button className="btn-enter" onClick={() => onStartWithoutImage(Tab.EDIT)}>
              ENTER
            </button>
          </div>

          <div className="hero-features">
            <div className="feature-pill">✨ Text-to-Image</div>
            <div className="feature-pill">🎨 Object Transfer</div>
            <div className="feature-pill">🎬 Video Generation</div>
            <div className="feature-pill">🔍 AI Upscaling</div>
          </div>
        </div>

        {/* Hidden file input for drag and drop */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>
    </div>
  );
};


const root = createRoot(document.getElementById('root')!);
root.render(<App />);