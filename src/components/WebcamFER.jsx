import { LESSONS } from '../constants/lessonContent';

const WebcamFER = ({ currentEmotion, primaryConfidence, secondaryEmotion, secondaryConfidence, isReady, hasFace, outOfFrame, error, videoRef, canvasRef }) => {
  const lessonData = LESSONS[currentEmotion] || LESSONS['Engaged'];

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 w-full text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Camera Access Required</h3>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Live FER Output</h2>
        {isReady ? (
          <div className="flex flex-col items-end">
            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-semibold text-sm ${lessonData.badge} shadow-sm border border-white/20`}>
              <span>{lessonData.emoji}</span>
              {currentEmotion} — {Math.round(primaryConfidence * 100)}%
              {secondaryEmotion && (
                <span className="ml-2 pl-2 border-l border-current opacity-75 font-medium text-xs">
                  also: {secondaryEmotion} {Math.round(secondaryConfidence * 100)}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 font-medium text-sm">
            Starting...
          </div>
        )}
      </div>

      <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
        {!isReady && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium animate-pulse">Loading FER models...</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${!isReady ? 'opacity-0' : 'opacity-100'}`}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-1000 ${!isReady ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Out of frame warning */}
        {isReady && hasFace && outOfFrame && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg animate-pulse whitespace-nowrap">
            ⚠️ Move closer or center your face
          </div>
        )}

        {/* No Face / Lost Face overlay */}
        {isReady && !hasFace && (
          <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-md flex items-center justify-center transition-all duration-500">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center shadow-inner mb-4 animate-bounce">
                <span className="text-2xl">👀</span>
              </div>
              <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl text-white font-medium shadow-2xl flex flex-col items-center gap-1">
                <span className="text-lg font-bold">No face detected</span>
                <span className="text-sm text-gray-300">Please look directly at the camera</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamFER;
