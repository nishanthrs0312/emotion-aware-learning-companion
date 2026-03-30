import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📸',
    title: 'Live FER Detection',
    description: 'Continuously analyzes facial expressions to detect engagement, confusion, or frustration.'
  },
  {
    icon: '⚡',
    title: 'Adaptive Pacing',
    description: 'Automatically adjusts the speed of content delivery based on real-time cognitive load.'
  },
  {
    icon: '💡',
    title: 'Scaffolded Hints',
    description: 'Provides contextual help exactly when frustration or confusion levels rise.'
  },
  {
    icon: '📊',
    title: 'Session Analytics',
    description: 'Comprehensive post-session reports detailing emotional journey and learning efficiency.'
  }
];

const Home = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Real-time learning that <br className="hidden md:block" />
          <span className="text-indigo-600">adapts to how you feel</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-600 mx-auto mb-10">
          AI-powered facial emotion recognition adjusts your lesson pace, hints, and difficulty in real time.
        </p>
        <Link
          to="/session"
          className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg transition-colors shadow-sm"
        >
          Start a Live Session
        </Link>
      </section>

      {/* Features Section */}
      <section className="w-full bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-start hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4 bg-indigo-50 w-14 h-14 rounded-xl flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
