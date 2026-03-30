import { useEffect, useRef, useState } from 'react';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { useSession } from '../context/SessionContext';
import WebcamFER from '../components/WebcamFER';
import ContentCard from '../components/ContentCard';
import StateMachine from '../components/StateMachine';
import { LESSONS } from '../constants/lessonContent';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const Session = () => {
  const detection = useEmotionDetection();
  const { 
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
  } = detection;
  const { engagementScore, paceAdjustments, hintsUsed, addEmotionEvent, resetSession } = useSession();

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const prevEmotionRef = useRef(currentEmotion);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Log emotion events when emotion changes
  useEffect(() => {
    if (prevEmotionRef.current !== currentEmotion) {
      addEmotionEvent(currentEmotion);
      prevEmotionRef.current = currentEmotion;
    }
  }, [currentEmotion, addEmotionEvent]);

  const lesson = LESSONS[currentEmotion] || LESSONS['Engaged'];

  const difficultyColors = {
    easy: 'text-green-700 bg-green-100',
    medium: 'text-indigo-700 bg-indigo-100',
    hard: 'text-purple-700 bg-purple-100'
  };

  const handleReset = () => {
    resetSession();
    setElapsed(0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-64px)]">

      {/* LEFT — Webcam (30%) */}
      <div className="w-full lg:w-[30%] flex flex-col">
        <WebcamFER
          currentEmotion={currentEmotion}
          primaryConfidence={primaryConfidence}
          secondaryEmotion={secondaryEmotion}
          secondaryConfidence={secondaryConfidence}
          isReady={isReady}
          hasFace={hasFace}
          outOfFrame={outOfFrame}
          error={error}
          videoRef={videoRef}
          canvasRef={canvasRef}
        />
      </div>

      {/* CENTER — Content (45%) */}
      <div className="w-full lg:w-[45%]">
        <ContentCard currentEmotion={currentEmotion} voiceEnabled={voiceEnabled} />
      </div>

      {/* RIGHT — Controls (25%) */}
      <div className="w-full lg:w-[25%] flex flex-col gap-6">

        {/* Session Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center bg-gray-50 -mx-6 -mt-6 p-6 rounded-t-2xl border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Session Timer</h3>
            <span className="font-mono text-2xl font-bold text-gray-900 tracking-tighter">
              {formatTime(elapsed)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <h3 className="text-sm font-semibold text-gray-700">Difficulty</h3>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${difficultyColors[lesson.difficulty]}`}>
              {lesson.difficulty}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Engagement</h3>
            <span className="font-mono text-sm font-bold text-indigo-600">{engagementScore}/100</span>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Pace Changes</h3>
            <span className="font-mono text-sm font-bold text-gray-700">{paceAdjustments}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Hints Used</h3>
            <span className="font-mono text-sm font-bold text-gray-700">{hintsUsed}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">Voice Assistant</span>
              <span className="text-xs text-gray-400">Reads content aloud</span>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${voiceEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full mt-2 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Restart Session
          </button>
        </div>

        {/* State Machine */}
        <StateMachine currentEmotion={currentEmotion} />
      </div>
    </div>
  );
};

export default Session;
