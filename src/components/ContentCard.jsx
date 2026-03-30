import { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { LESSONS } from '../constants/lessonContent';

const ContentCard = ({ currentEmotion, voiceEnabled }) => {
  const { incrementHints } = useSession();
  const [activeHint, setActiveHint] = useState(null);

  const lesson = LESSONS[currentEmotion] || LESSONS['Engaged'];

  useEffect(() => {
    if (voiceEnabled && lesson?.body) {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(lesson.body);
      window.speechSynthesis.speak(speech);
    }
    setActiveHint(null);
  }, [currentEmotion, voiceEnabled]);

  const getPaceColor = (pace) => {
    if (pace > 60) return 'bg-green-500';
    if (pace > 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    hard: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const handleHintClick = (idx) => {
    if (activeHint !== idx) {
      incrementHints();
    }
    setActiveHint(activeHint === idx ? null : idx);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-500 relative">
      {currentEmotion === 'Breakthrough' && (
        <div className="bg-green-500 text-white text-sm font-bold py-2 px-6 flex justify-center items-center">
          ✨ Excellent progress! You've reached a breakthrough!
        </div>
      )}
      
      <div className="p-8 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-8">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${difficultyColors[lesson.difficulty]}`}>
            {lesson.difficulty}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Pace: {lesson.pace}%</span>
            <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div 
                className={`h-full transition-all duration-1000 ${getPaceColor(lesson.pace)}`}
                style={{ width: `${lesson.pace}%` }}
              ></div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 transition-colors duration-500">
          {lesson.title}
        </h2>
        
        <p className="text-gray-700 text-lg leading-relaxed mb-8 flex-grow">
          {lesson.body}
        </p>

        {lesson.hints && lesson.hints.length > 0 && (
          <div className="mt-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-t border-gray-100 pt-6">
              Available Hints
            </h3>
            <div className="flex flex-wrap gap-3">
              {lesson.hints.map((hint, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHintClick(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                    activeHint === idx 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {activeHint === idx ? hint : `Hint ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
