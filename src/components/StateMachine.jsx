const states = [
  { id: 'Engaged', label: 'Engaged' },
  { id: 'Confused', label: 'Confused' },
  { id: 'Stressed', label: 'Stressed' },
  { id: 'Frustrated', label: 'Frustrated' },
  { id: 'Bored', label: 'Bored' },
  { id: 'Excited', label: 'Excited' },
  { id: 'Breakthrough', label: 'Breakthrough' }
];

const actionMap = {
  Engaged: 'Maintaining steady pace',
  Confused: 'Simplifying content',
  Stressed: 'Pausing new material',
  Frustrated: 'Changing approach completely',
  Bored: 'Adding real-world context',
  Excited: 'Accelerating curriculum',
  Breakthrough: 'Introducing advanced concepts'
};

const StateMachine = ({ currentEmotion }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
        State Machine Engine
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {states.map((state, idx) => {
          const isActive = currentEmotion === state.id;
          return (
            <div key={state.id} className="flex items-center gap-1.5">
              <div 
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md scale-105' 
                    : 'bg-transparent border border-gray-200 text-gray-400'
                }`}
              >
                {state.label}
              </div>
              {idx < states.length - 1 && (
                <svg className="w-2.5 h-2.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-5 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
          Current Engine Action
        </span>
        <span className="text-base font-medium text-indigo-700 block">
          {actionMap[currentEmotion] || 'Analyzing state...'}
        </span>
      </div>
    </div>
  );
};

export default StateMachine;
