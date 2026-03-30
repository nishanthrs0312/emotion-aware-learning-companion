const steps = [
  { num: '01', title: 'Webcam captures face' },
  { num: '02', title: 'FER model detects expression' },
  { num: '03', title: 'Emotion smoothing (7-frame buffer)' },
  { num: '04', title: 'State machine triggers content change' },
  { num: '05', title: 'Analytics logged in real time' }
];

const techStack = [
  'React',
  'TensorFlow.js',
  'face-api.js',
  'Recharts',
  'Tailwind CSS'
];

const About = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          How It Works
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">
          The technical pipeline powering the adaptive learning companion.
        </p>
      </div>

      {/* Stepper Section */}
      <div className="mb-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          {/* Horizontal connecting line - hidden on mobile */}
          <div className="hidden md:block absolute top-[28px] left-0 w-full h-[2px] bg-indigo-100 z-0"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="flex flex-row md:flex-col items-center gap-4 z-10 w-full md:w-1/5">
              <div className="flex bg-white items-center justify-center w-14 h-14 rounded-full border-4 border-indigo-100 bg-indigo-50 text-indigo-600 font-bold text-lg shadow-sm">
                {step.num}
              </div>
              <div className="text-left md:text-center flex-1">
                <p className="text-sm font-semibold text-gray-900 md:px-2 leading-snug">
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Built With Modern Tools
        </h2>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {techStack.map((tech, index) => (
            <span
              key={index}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
