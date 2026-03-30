import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models';

const EMOTION_COLORS = {
  Engaged: '#6366f1',
  Confused: '#f59e0b',
  Stressed: '#ec4899',
  Frustrated: '#ef4444',
  Bored: '#3b82f6',
  Excited: '#22c55e',
  Breakthrough: '#a855f7',
};

export function useEmotionDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  
  const [isReady, setIsReady] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('Engaged');
  
  // Expanded stats
  const [primaryConfidence, setPrimaryConfidence] = useState(0);
  const [secondaryEmotion, setSecondaryEmotion] = useState(null);
  const [secondaryConfidence, setSecondaryConfidence] = useState(0);
  const [outOfFrame, setOutOfFrame] = useState(false);

  const [hasFace, setHasFace] = useState(true); // default true to avoid premature flashing
  const [error, setError] = useState(null);

  const rawBufferRef = useRef([]);
  const mountedRef = useRef(true);
  
  // Timers
  const boredomTimerRef = useRef(0);
  const faceLostTimerRef = useRef(0);

  // Initialization
  useEffect(() => {
    mountedRef.current = true;
    let localStream = null;

    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        if (!mountedRef.current) return;
      } catch (err) {
        console.error("Model load error:", err);
        if (mountedRef.current) setError('Failed to load FER models. Check your models directory.');
        return;
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });

        if (!mountedRef.current) {
          localStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = localStream;

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          await new Promise((resolve) => {
            videoRef.current.onloadeddata = () => {
              videoRef.current.play().then(resolve).catch(resolve);
            };
          });
          if (!mountedRef.current) return;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Webcam error:", err);
        if (mountedRef.current) {
          setError('Camera access denied or unavailable. Please allow webcam permissions.');
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const normalizeExpressions = (expressions) => {
    const total = Object.values(expressions).reduce((sum, val) => sum + val, 0);
    if (total === 0) return expressions;
    let normalized = {};
    for (const [key, val] of Object.entries(expressions)) {
      normalized[key] = val / total;
    }
    return normalized;
  };

  const getModeWithThreshold = (arr, thresholdPct) => {
    if (!arr.length) return null;
    const counts = {};
    let maxNum = 0;
    let mode = arr[0];
    for (const val of arr) {
      if (!val) continue;
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxNum) {
        maxNum = counts[val];
        mode = val;
      }
    }
    const ratio = maxNum / arr.length;
    return ratio >= thresholdPct ? mode : null;
  };

  const computeEmotions = (norm) => {
    const n = norm.neutral || 0;
    const h = norm.happy || 0;
    const s = norm.sad || 0;
    const a = norm.angry || 0;
    const f = norm.fearful || 0;
    const d = norm.disgusted || 0;
    const su = norm.surprised || 0;

    const scores = [];

    // Engaged bypass check
    let isEngaged = false;
    if (n > 0.25 && h <= 0.5) {
      scores.push({ state: 'Engaged', score: (n * 0.6) + (h * 0.3) });
      isEngaged = true;
    }
    if (h > 0.45) {
      scores.push({ state: 'Excited', score: (h * 0.7) + (su * 0.2) });
      isEngaged = false; // Excitement overrides simple engagement
    }
    if ((s + f) > 0.30) {
      scores.push({ state: 'Confused', score: (s * 0.4) + (f * 0.3) + (su * 0.3) });
      isEngaged = false;
    }
    if (f > 0.15 || (f > 0.1 && s > 0.2)) {
      scores.push({ state: 'Stressed', score: (f * 0.6) + (s * 0.3) });
      isEngaged = false;
    }
    if ((a + d) > 0.30) {
      scores.push({ state: 'Frustrated', score: (a * 0.6) + (d * 0.3) });
      isEngaged = false;
    }
    if (h > 0.40 && su > 0.25) {
      scores.push({ state: 'Breakthrough', score: (h * 0.5) + (su * 0.5) });
      isEngaged = false;
    }
    
    // Sort descending by score
    scores.sort((A, B) => B.score - A.score);

    // Boredom Tracking (~40 frames accounts for processing delay, ~4-6 seconds RT)
    if (isEngaged && scores[0]?.state === 'Engaged') {
      boredomTimerRef.current += 1;
      if (boredomTimerRef.current > 40) {
        // Boost bored to the top
        return [{ state: 'Bored', score: (n * 0.8) }, ...scores];
      }
    } else {
      boredomTimerRef.current = 0;
    }

    return scores;
  };

  const drawTracking = (detection, displaySize, currentColor) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, displaySize.width, displaySize.height);

    const resized = faceapi.resizeResults(detection, displaySize);
    const box = resized.detection.box;

    // Boundary check (Move closer / out of frame logic)
    const margin = 10;
    const isOut = (
      box.x < margin || 
      box.y < margin || 
      box.x + box.width > displaySize.width - margin || 
      box.y + box.height > displaySize.height - margin
    );
    setOutOfFrame(isOut);

    // Draw Box
    ctx.strokeStyle = EMOTION_COLORS[currentColor] || '#6366f1';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw text above box
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(currentColor, box.x, box.y - 5);

    // Draw Landmarks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const landmarks = resized.landmarks.positions;
    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !mountedRef.current) return;
    const video = videoRef.current;
    
    if (video.paused || video.ended || !video.videoWidth) return;

    try {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const detection = await faceapi.detectSingleFace(
        video, 
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!mountedRef.current) return;

      if (detection) {
        setHasFace(true);
        faceLostTimerRef.current = 0;

        // Top expression unweighted check > 0.35
        let maxRawScore = 0;
        for (const [em, score] of Object.entries(detection.expressions)) {
          if (score > maxRawScore) maxRawScore = score;
        }

        let bestState = currentEmotion; // default fallback
        
        if (maxRawScore > 0.35) {
          const norm = normalizeExpressions(detection.expressions);
          const ranked = computeEmotions(norm);

          if (ranked.length > 0) {
            const topCandidate = ranked[0].state;
            
            rawBufferRef.current.push(topCandidate);
            if (rawBufferRef.current.length > 5) rawBufferRef.current.shift();

            // 40% majority trigger
            const stableMode = getModeWithThreshold(rawBufferRef.current, 0.40);

            if (stableMode && stableMode !== currentEmotion) {
              setCurrentEmotion(stableMode);
              bestState = stableMode;
            } else {
              bestState = currentEmotion;
            }

            // Update stats
            setPrimaryConfidence(detection.expressions[ranked[0].state.toLowerCase()] || maxRawScore);
            
            if (ranked.length > 1) {
              setSecondaryEmotion(ranked[1].state);
              // lookup original raw normalized mapping if we assume the raw value
              setSecondaryConfidence(norm[ranked[1].state.toLowerCase()] || ranked[1].score);
            } else {
              setSecondaryEmotion(null);
            }
          }
        }

        // Always tick draw frame
        setCurrentEmotion((currentState) => {
             drawTracking(detection, displaySize, currentState);
             return currentState;
        });

      } else {
        faceLostTimerRef.current += 1;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
        
        // 100ms per interval * 20 = 2000ms (2 seconds)
        if (faceLostTimerRef.current >= 20) {
          setHasFace(false);
          setCurrentEmotion('Engaged'); // Fallback safely
          rawBufferRef.current = [];
          setPrimaryConfidence(0);
          setSecondaryEmotion(null);
        }
      }
    } catch (err) {
      // frame catch
    }
  }, [currentEmotion]);

  useEffect(() => {
    if (isReady) {
      intervalRef.current = setInterval(runDetection, 100);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isReady, runDetection]);

  return { 
    currentEmotion, 
    primaryConfidence, 
    secondaryEmotion, 
    secondaryConfidence,
    isReady, 
    hasFace, 
    outOfFrame,
    error, 
    videoRef, 
    canvasRef 
  };
}
