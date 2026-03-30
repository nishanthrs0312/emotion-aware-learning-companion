import { createContext, useContext, useState, useCallback, useRef } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [emotionEvents, setEmotionEvents] = useState([]);
  const [engagementScore, setEngagementScore] = useState(50);
  const [paceAdjustments, setPaceAdjustments] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [sessionStartTime] = useState(() => new Date());
  const lastEmotionRef = useRef(null);

  const addEmotionEvent = useCallback((emotion) => {
    const scoreDeltas = {
      Engaged: 2,
      Excited: 3,
      Breakthrough: 3,
      Confused: -1,
      Bored: -2,
      Frustrated: -3,
      Stressed: -3,
    };

    const delta = scoreDeltas[emotion] ?? 0;

    setEngagementScore(prev => Math.max(0, Math.min(100, prev + delta)));

    setEmotionEvents(prev => [
      ...prev,
      {
        timestamp: new Date(),
        emotion,
        engagementScore: Math.max(0, Math.min(100, 
          (prev.length > 0 ? prev[prev.length - 1].engagementScore : 50) + delta
        )),
      }
    ]);

    if (lastEmotionRef.current !== null && lastEmotionRef.current !== emotion) {
      setPaceAdjustments(prev => prev + 1);
    }
    lastEmotionRef.current = emotion;
  }, []);

  const incrementHints = useCallback(() => {
    setHintsUsed(prev => prev + 1);
  }, []);

  const resetSession = useCallback(() => {
    setEmotionEvents([]);
    setEngagementScore(50);
    setPaceAdjustments(0);
    setHintsUsed(0);
    lastEmotionRef.current = null;
  }, []);

  const value = {
    emotionEvents,
    engagementScore,
    paceAdjustments,
    hintsUsed,
    sessionStartTime,
    addEmotionEvent,
    incrementHints,
    resetSession,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
