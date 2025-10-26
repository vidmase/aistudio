/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Part } from "@google/genai";

interface MaskEditorProps {
  imageSrc: string;
  initialMaskSrc: string | null;
  onSave: (maskDataUrl: string) => void;
  onCancel: () => void;
  ai: GoogleGenAI;
}

// --- ICONS ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BrushIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const EraserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H8.5l-4.5 4.5 6 6L20 5z"/><path d="M6 13l-4 4 4 4Z"/></svg>;
const MagicWandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3L7 17l-5-5L17 3h4z"/><path d="M18 6L6 18"/></svg>;
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="15" width="18" height="6" rx="2"/><path d="M3 11V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/></svg>;

const base64ToPart = (base64DataUrl: string): Part | null => {
  const match = base64DataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
};

const MaskEditor: React.FC<MaskEditorProps> = ({ imageSrc, initialMaskSrc, onSave, onCancel, ai }) => {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(40);
  const [activeTool, setActiveTool] = useState<'brush' | 'erase' | 'magic'>('brush');
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [isMaskPresent, setIsMaskPresent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimatingMask, setIsAnimatingMask] = useState<boolean>(false);
  
  // Auto-segment state
  const [segmentationMapUrl, setSegmentationMapUrl] = useState<string | null>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Computed states for clarity
  const isErasing = activeTool === 'erase';
  const isAutoSelecting = activeTool === 'magic';
  const anyLoading = loadingMessage !== null;
  const isSegmenting = segmentationMapUrl !== null;

  // Masking Canvas Logic
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const canvasDimensionsRef = useRef<{width: number; height: number;}>({width: 0, height: 0});
  
  const clearSegmentation = useCallback(() => {
    setSegmentationMapUrl(null);
    setHoveredColor(null);
    const detectionCanvas = detectionCanvasRef.current;
    if (detectionCanvas) {
      const ctx = detectionCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
      }
    }
    const maskCanvas = maskCanvasRef.current;
    // Clear any leftover highlight from mask canvas but preserve user's drawing
    if (maskCanvas) {
        const {width, height} = maskCanvas;
        const ctx = maskCanvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (ctx && tempCtx) {
            tempCtx.drawImage(maskCanvas, 0, 0); // Save current state
            ctx.clearRect(0,0,width,height); // Clear
            ctx.drawImage(tempCanvas, 0, 0); // Restore
        }
    }
  }, []);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    clearSegmentation();
    if (isAutoSelecting) return;
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      setIsMaskPresent(true);
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const drawToCanvas = useCallback((
    maskImg: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    logicalWidth: number,
    logicalHeight: number
  ) => {
    const { width, height } = canvas; // physical dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskImg.naturalWidth;
    tempCanvas.height = maskImg.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    tempCtx.drawImage(maskImg, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, maskImg.naturalWidth, maskImg.naturalHeight);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
        data[i] = 255;     // R
        data[i + 1] = 0;   // G
        data[i + 2] = 0;   // B
        data[i + 3] = 255 * 0.7; // Alpha
      } else {
        data[i + 3] = 0;
      }
    }
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, logicalWidth, logicalHeight);
  }, []);

  const processAndDrawGeneratedMask = useCallback((maskDataUrl: string) => {
    const maskImg = new Image();
    maskImg.crossOrigin = "anonymous";
    maskImg.src = maskDataUrl;
    maskImg.onload = () => {
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas?.getContext('2d');
      if (maskCanvas && maskCtx) {
        const { width: logicalWidth, height: logicalHeight } = canvasDimensionsRef.current;
        drawToCanvas(maskImg, maskCanvas, maskCtx, logicalWidth, logicalHeight);
        setIsMaskPresent(true);
      }
    };
    maskImg.onerror = () => setError("Failed to load generated mask image.");
  }, [drawToCanvas]);


  const handleSegmentSubject = async () => {
      if (!imageSrc) return;
      setLoadingMessage("Segmenting subject...");
      setError(null);
      clearSegmentation();
      try {
          const imagePart = base64ToPart(imageSrc);
          if (!imagePart) throw new Error("Could not process the image.");
          
          const prompt = "Analyze the image and identify the main subject. Create a segmentation mask where the main subject is completely white and the entire background is completely black. The output MUST be an image containing this black and white mask. Do not respond with text.";
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image-preview',
              contents: { parts: [imagePart, { text: prompt }] },
              config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
          });
  
          const maskPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (maskPart && maskPart.inlineData) {
              const maskImageData = `data:${maskPart.inlineData.mimeType};base64,${maskPart.inlineData.data}`;
              
              const maskCanvas = maskCanvasRef.current;
              const maskCtx = maskCanvas?.getContext('2d');
              if (maskCanvas && maskCtx) {
                  const { width: logicalWidth, height: logicalHeight } = canvasDimensionsRef.current;
                  maskCtx.clearRect(0, 0, logicalWidth, logicalHeight);
              }

              processAndDrawGeneratedMask(maskImageData);
          } else {
              throw new Error("AI did not return a valid mask for the subject.");
          }
      } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to segment subject.");
          console.error(err);
      } finally {
          setLoadingMessage(null);
      }
  };

  const handleAutoSelect = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    setLoadingMessage("Detecting object at point...");
    setError(null);
    clearSegmentation();
    try {
      const originalImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
      });
      const { naturalWidth, naturalHeight } = originalImage;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const scaleX = naturalWidth / rect.width;
      const scaleY = naturalHeight / rect.height;
      const originalX = Math.round(x * scaleX);
      const originalY = Math.round(y * scaleY);

      const markerCanvas = document.createElement('canvas');
      markerCanvas.width = naturalWidth;
      markerCanvas.height = naturalHeight;
      const ctx = markerCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not create marker canvas.");
      ctx.drawImage(originalImage, 0, 0);
      const markerRadius = Math.max(5, Math.min(naturalWidth, naturalHeight) * 0.005);
      ctx.fillStyle = '#FF00FF';
      ctx.beginPath();
      ctx.arc(originalX, originalY, markerRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = markerRadius * 0.4;
      ctx.stroke();

      const markedImageBase64 = markerCanvas.toDataURL('image/jpeg');
      const imagePart = base64ToPart(markedImageBase64);
      if (!imagePart) throw new Error("Could not process the marked image.");

      const prompt = "You are an expert photo editing assistant specializing in high-quality object segmentation. In the provided image, the user has marked a point with a magenta circle. Generate a precise, pixel-perfect, black and white mask for the primary object located at that point. The main object under the marker should be completely white (#FFFFFF). Everything else, including other objects and the background, must be completely black (#000000). The mask's edges must follow the object's contours perfectly. If multiple objects are layered, select only the topmost object under the marker. Return ONLY the mask image. Your entire response must be the image file, with no accompanying text or explanation.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      const maskPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (maskPart && maskPart.inlineData) {
        const maskImageData = `data:${maskPart.inlineData.mimeType};base64,${maskPart.inlineData.data}`;
        processAndDrawGeneratedMask(maskImageData);
      } else {
        throw new Error("AI did not return a valid mask.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to auto-select object.");
      console.error(err);
    } finally {
      setLoadingMessage(null);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    }

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPointRef.current = { x, y };
  };

  useEffect(() => {
    if (!imageSrc) return;
    const imageCanvas = imageCanvasRef.current;
    const detectionCanvas = detectionCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas || !detectionCanvas) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => { setError('Could not load image into the editor.'); onCancel(); };
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      const container = imageCanvas.parentElement;
      if (!container) return;
      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
      const aspectRatio = naturalWidth / naturalHeight;
      let canvasWidth = containerWidth;
      let canvasHeight = containerWidth / aspectRatio;
      if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = containerHeight * aspectRatio;
      }
      canvasDimensionsRef.current = { width: canvasWidth, height: canvasHeight };
      const dpr = window.devicePixelRatio || 1;
      [imageCanvas, detectionCanvas, maskCanvas].forEach(canvas => {
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) ctx.scale(dpr, dpr);
      });
      const imageCtx = imageCanvas.getContext('2d');
      if (imageCtx) imageCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        if (initialMaskSrc) {
          const maskImg = new Image();
          maskImg.crossOrigin = "anonymous";
          maskImg.src = initialMaskSrc;
          maskImg.onload = () => { drawToCanvas(maskImg, maskCanvas, maskCtx, canvasWidth, canvasHeight); setIsMaskPresent(true); };
        } else { setIsMaskPresent(false); }
      }
    }
    img.src = imageSrc;
  }, [imageSrc, initialMaskSrc, onCancel, drawToCanvas]);
  
  useEffect(() => {
    const canvas = detectionCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !segmentationMapUrl) return;

    const { width: logicalWidth, height: logicalHeight } = canvasDimensionsRef.current;
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    
    const mapImage = new Image();
    mapImage.crossOrigin = "anonymous";
    mapImage.src = segmentationMapUrl;
    mapImage.onload = () => {
        ctx.drawImage(mapImage, 0, 0, logicalWidth, logicalHeight);
    };
    mapImage.onerror = () => setError("Failed to load segmentation map.");
  }, [segmentationMapUrl]);

  useEffect(() => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const detectionCanvas = detectionCanvasRef.current;
    if (!canvas || !ctx || !detectionCanvas || !isSegmenting) {
        if(canvas) canvas.style.cursor = isAutoSelecting ? 'crosshair' : 'none';
        return;
    }
    
    const tempUserMask = document.createElement('canvas');
    const tempUserMaskCtx = tempUserMask.getContext('2d');
    tempUserMask.width = canvas.width;
    tempUserMask.height = canvas.height;
    if (tempUserMaskCtx) tempUserMaskCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hoveredColor) {
        const { width, height } = detectionCanvas;
        const detectionCtx = detectionCanvas.getContext('2d', { willReadFrequently: true });
        if (!detectionCtx) return;
        
        const imageData = detectionCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const highlightImageData = ctx.createImageData(width, height);
        const highlightData = highlightImageData.data;
        const [r, g, b] = hoveredColor.replace(/[rgb() ]/g, '').split(',').map(Number);

        for (let i = 0; i < data.length; i += 4) {
            if (Math.abs(data[i] - r) < 5 && Math.abs(data[i+1] - g) < 5 && Math.abs(data[i+2] - b) < 5) {
                highlightData[i] = 255;
                highlightData[i+1] = 255;
                highlightData[i+2] = 255;
                highlightData[i+3] = 255 * 0.7;
            }
        }
        ctx.putImageData(highlightImageData, 0, 0);
    }
    
    if (tempUserMaskCtx) ctx.drawImage(tempUserMask, 0, 0);
  }, [hoveredColor, isSegmenting, isAutoSelecting]);

  const handleSaveMask = () => {
    const maskCanvas = maskCanvasRef.current;
    const sourceImage = imageSrc;
    if (!maskCanvas || !sourceImage) return;
    setLoadingMessage("Processing Mask...");
    const originalImage = new Image();
    originalImage.crossOrigin = "anonymous";
    originalImage.onload = () => {
      const { naturalWidth, naturalHeight } = originalImage;
      const finalMaskCanvas = document.createElement('canvas');
      finalMaskCanvas.width = naturalWidth;
      finalMaskCanvas.height = naturalHeight;
      const finalCtx = finalMaskCanvas.getContext('2d', { willReadFrequently: true });
      if (!finalCtx) { setError("Could not create the final mask."); setLoadingMessage(null); return; }
      finalCtx.drawImage(maskCanvas, 0, 0, naturalWidth, naturalHeight);
      const imageData = finalCtx.getImageData(0, 0, naturalWidth, naturalHeight);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If pixel is not transparent
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
        } else {
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
        }
      }
      finalCtx.putImageData(imageData, 0, 0);
      onSave(finalMaskCanvas.toDataURL('image/png'));
      setLoadingMessage(null);
    };
    originalImage.onerror = () => { setError("Could not load original image to create mask."); setLoadingMessage(null); };
    originalImage.src = sourceImage;
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      setIsMaskPresent(false);
    }
  };

  const triggerMaskAnimation = () => {
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    setIsAnimatingMask(true);
    animationTimeoutRef.current = window.setTimeout(() => { setIsAnimatingMask(false); }, 500);
  };

  const featherMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !isMaskPresent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const blurAmount = 4;
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    triggerMaskAnimation();
  }, [isMaskPresent]);

  const expandMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !isMaskPresent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const expandAmount = 5;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, 0, 0);
    ctx.shadowColor = 'rgba(255,0,0,0.7)';
    ctx.shadowBlur = expandAmount;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.shadowBlur = 0;
    ctx.drawImage(tempCanvas, 0, 0);
    triggerMaskAnimation();
  }, [isMaskPresent]);

  const contractMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !isMaskPresent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const contractAmount = 5;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = contractAmount;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    triggerMaskAnimation();
  }, [isMaskPresent]);
  
  const autoSegment = async () => {
    if (!imageSrc) return;
    setLoadingMessage("Auto-segmenting objects...");
    setError(null);
    clearSegmentation();
    try {
        const imagePart = base64ToPart(imageSrc);
        if (!imagePart) throw new Error("Could not process the image.");
        const prompt = "You are an expert instance segmentation model. Analyze the provided image and identify all distinct, non-overlapping objects. Your task is to generate a new image of the exact same dimensions, which will serve as a segmentation map. In this map, the background must be pure black (#000000). Every distinct object you identify must be filled with a unique, solid, and vibrant color (e.g., pure red, pure green, pure blue). Ensure that the colors are distinct and edges are clean and precise. Do not use any shading or gradients. The output MUST be only the segmentation map image, with no other text or explanation.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const mapPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (mapPart && mapPart.inlineData) {
            const mapDataUrl = `data:${mapPart.inlineData.mimeType};base64,${mapPart.inlineData.data}`;
            setSegmentationMapUrl(mapDataUrl);
        } else {
            throw new Error("AI did not return a segmentation map.");
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to auto-segment image.");
        console.error(err);
    } finally {
        setLoadingMessage(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSegmenting) {
        if (hoveredColor) {
            const detectionCanvas = detectionCanvasRef.current;
            if(!detectionCanvas) return;
            const { width, height } = detectionCanvas;
            const detectionCtx = detectionCanvas.getContext('2d', { willReadFrequently: true });
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!detectionCtx || !tempCtx) return;
            
            const imageData = detectionCtx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const maskImageData = tempCtx.createImageData(width, height);
            const maskData = maskImageData.data;
            const [r, g, b] = hoveredColor.replace(/[rgb() ]/g, '').split(',').map(Number);
            
            for (let i = 0; i < data.length; i += 4) {
              if (Math.abs(data[i] - r) < 5 && Math.abs(data[i+1] - g) < 5 && Math.abs(data[i+2] - b) < 5) {
                maskData[i] = 255; maskData[i+1] = 255; maskData[i+2] = 255; maskData[i+3] = 255;
              }
            }
            tempCtx.putImageData(maskImageData, 0, 0);
            processAndDrawGeneratedMask(tempCanvas.toDataURL());
        }
        clearSegmentation();
        return;
    }
    
    if (isAutoSelecting) { 
        handleAutoSelect(e); 
    } else { 
        startDrawing(e); 
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    if (isSegmenting) {
        const detectionCanvas = detectionCanvasRef.current;
        const detectionCtx = detectionCanvas?.getContext('2d', {willReadFrequently: true});
        if (!detectionCtx) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pixel = detectionCtx.getImageData(x * dpr, y * dpr, 1, 1).data;
        
        if (pixel[3] > 0 && (pixel[0] > 10 || pixel[1] > 10 || pixel[2] > 10)) {
            const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            canvas.style.cursor = 'pointer';
            if (color !== hoveredColor) setHoveredColor(color);
            return;
        }
        canvas.style.cursor = 'crosshair';
        if (hoveredColor !== null) setHoveredColor(null);
        return;
    }

    if (isAutoSelecting) {
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'none';
        draw(e);
        setCursorPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    stopDrawing();
    setCursorPosition(null);
    if (hoveredColor !== null) setHoveredColor(null);
    if (maskCanvasRef.current) maskCanvasRef.current.style.cursor = 'default';
  };

  return (
    <div className={`masking-overlay ${isAutoSelecting || isSegmenting ? 'autoselect-active' : ''}`}>
      {anyLoading && (
        <div className="mask-saver-loader">
          <div className="spinner" />
          <p>{loadingMessage}</p>
        </div>
      )}
      {!isAutoSelecting && !isSegmenting && cursorPosition && (
        <div
          className={`brush-cursor ${isErasing ? 'erasing' : ''}`}
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            width: `${brushSize}px`,
            height: `${brushSize}px`,
          }}
        />
      )}
      <div className="masking-canvas-container">
        <canvas ref={imageCanvasRef} className="image-canvas" />
        <canvas ref={detectionCanvasRef} className="detection-canvas" style={{ pointerEvents: 'none' }} />
        <canvas
          ref={maskCanvasRef}
          className={`mask-canvas ${isAnimatingMask ? 'highlight' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={(e) => {
             const canvas = maskCanvasRef.current;
             if(canvas && !isSegmenting && !isAutoSelecting) {
                canvas.style.cursor = 'none';
                setCursorPosition({ x: e.clientX, y: e.clientY });
             }
          }}
          onMouseMove={handleCanvasMouseMove}
        />
      </div>
      <div className="masking-toolbar">
         <div className="toolbar-group">
          <button className="btn btn-tool" onClick={autoSegment} disabled={anyLoading}>
            <LayersIcon /> Auto Segment
          </button>
          <button className="btn btn-tool" onClick={handleSegmentSubject} disabled={anyLoading}>
            <UserIcon /> Segment Subject
          </button>
        </div>
        <div className="toolbar-group">
          <button
            className={`btn btn-tool ${activeTool === 'magic' ? 'active' : ''}`}
            onClick={() => { setActiveTool('magic'); clearSegmentation(); }}
            aria-label="Magic select tool"
            title="Magic Select"
            disabled={anyLoading}
          >
            <MagicWandIcon /> Magic Select
          </button>
          <button
            className={`btn btn-tool ${activeTool === 'brush' ? 'active' : ''}`}
            onClick={() => setActiveTool('brush')}
            aria-label="Brush tool"
            disabled={anyLoading}
          >
            <BrushIcon /> Brush
          </button>
          <button
            className={`btn btn-tool ${activeTool === 'erase' ? 'active' : ''}`}
            onClick={() => setActiveTool('erase')}
            aria-label="Eraser tool"
            disabled={anyLoading}
          >
            <EraserIcon /> Erase
          </button>
        </div>

        <div className="toolbar-group">
          <label>Brush Size: {brushSize}</label>
          <input
            type="range"
            min="5"
            max="150"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            disabled={isAutoSelecting || anyLoading || isSegmenting}
          />
        </div>
        
        <div className="toolbar-group refine">
          <button className="btn btn-tool" onClick={featherMask} disabled={!isMaskPresent || anyLoading}>Feather</button>
          <button className="btn btn-tool" onClick={expandMask} disabled={!isMaskPresent || anyLoading}>Expand</button>
          <button className="btn btn-tool" onClick={contractMask} disabled={!isMaskPresent || anyLoading}>Contract</button>
        </div>

        <div className="toolbar-group">
          <button className="btn btn-secondary" onClick={clearMask} disabled={!isMaskPresent || anyLoading}>Clear</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveMask} disabled={!isMaskPresent || anyLoading}>Save Mask</button>
        </div>
      </div>
       {error && <div className="error-message" style={{position: 'absolute', top: '20px', zIndex: 105}}>{error}</div>}
    </div>
  );
};

export default MaskEditor;
