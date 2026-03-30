import { useEffect, useMemo, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from '@vladmandic/face-api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const BACKEND_URL = 'http://localhost:5000';
const MAX_SMOOTHING_FRAMES = 5;
const VOICE_COOLDOWN_MS = 7000;

const EMOTION_META = {
  Engaged: { emoji: '😊', color: 'bg-emerald-600', label: 'Engaged' },
  Normal: { emoji: '😐', color: 'bg-sky-600', label: 'Normal' },
  Confused: { emoji: '😕', color: 'bg-amber-500', label: 'Confused' },
  Stressed: { emoji: '😣', color: 'bg-rose-600', label: 'Stressed' },
};

const INITIAL_COUNTS = {
  Engaged: 0,
  Normal: 0,
  Confused: 0,
  Stressed: 0,
};

const emotionScoreValue = {
  Engaged: 3,
  Normal: 2,
  Confused: 1,
  Stressed: 0,
};

const defaultLearningCard = {
  title: 'Adaptive Learning Module',
  headline: 'Dynamic learning content that responds to your state in real time.',
  bullets: [
    'Watch the webcam for emotion feedback.',
    'Receive hints when you feel confused.',
    'Slow down when stress is detected.',
    'Follow adaptive guidance to improve your focus.',
  ],
};

const learningModules = [
  {
    title: 'Lesson 1: Adaptive Attention',
    topic: 'Emotion-aware focus and pacing',
    description:
      'Learn how the system reads facial expressions to adjust pace, hints, and difficulty in real time.',
    elaboration: [
      'Adaptive attention helps learners stay aware of their emotional state while studying. The system tracks facial expressions and maps them to meaningful states like Engaged, Confused, Stressed, and Normal.',
      'When you are engaged, the module encourages deeper reasoning and challenge. When confusion appears, it offers simplified explanations and concrete examples.',
      'This first lesson builds the foundation for using emotion feedback to guide learning rather than relying only on timers or fixed lesson plans.',
    ],
    keyPoints: [
      'Real-time emotion detection increases awareness.',
      'Smoothing over recent frames avoids jittery feedback.',
      'Emotion mapping enables smart pacing and support.',
    ],
    quiz: [
      {
        question: 'Why is emotion smoothing important in a live FER system?',
        options: [
          'It removes small expression spikes and stabilizes feedback.',
          'It makes the model run faster.',
          'It increases the number of detected faces.',
        ],
        answer: 'It removes small expression spikes and stabilizes feedback.',
      },
      {
        question: 'Which emotion state should trigger more challenge?',
        options: ['Engaged', 'Confused', 'Stressed'],
        answer: 'Engaged',
      },
    ],
    tips: [
      'Take a moment to breathe and scan the lesson from the start.',
      'Ask yourself which part of the explanation feels unclear.',
      'Look for the example sentence that ties the concept to a real case.',
    ],
  },
  {
    title: 'Lesson 2: Guided Feedback',
    topic: 'Hints, simplification, and confidence support',
    description:
      'The companion adapts explanations based on whether you feel confused, stressed, or comfortable.',
    elaboration: [
      'Guided feedback means the system provides just enough help when you need it. If the model detects confusion, it can show a simpler example or a step-by-step hint.',
      'When stress is detected, the learning engine encourages a short break, reduces pace, and rephrases content to avoid overload.',
      'Normal and engaged experiences are rewarded with consistent progress and optional challenge extension.',
    ],
    keyPoints: [
      'Hints reduce mental load during confusion.',
      'Stress-aware pacing prevents burnout.',
      'Adaptive messaging supports learner confidence.',
    ],
    quiz: [
      {
        question: 'What should the system do when a learner appears confused?',
        options: ['Offer a hint', 'Increase difficulty', 'End the session'],
        answer: 'Offer a hint',
      },
      {
        question: 'What is the best response to stress?',
        options: ['Slow down and simplify', 'Keep going faster', 'Ignore it'],
        answer: 'Slow down and simplify',
      },
    ],
    tips: [
      'Break the content into smaller pieces and review one step at a time.',
      'Try paraphrasing the explanation in your own words.',
      'Use the hint section to connect the idea with a familiar example.',
    ],
  },
  {
    title: 'Lesson 3: Practice Activity',
    topic: 'Reflection and active recall',
    description:
      'Apply the learning module through short practice questions and reflection prompts.',
    elaboration: [
      'Active recall helps embed new knowledge after understanding the concept. This lesson encourages practice while the companion tracks your emotional state.',
      'It is normal to feel confused during an active task. The assistant responds with tips and a gentle hint instead of pushing too fast.',
      'Practice sessions should be short, focused, and adapt in difficulty based on your emotional feedback.',
    ],
    keyPoints: [
      'Practice strengthens understanding after theory.',
      'Emotion-aware tasks keep learning sustainable.',
      'A calm review is better than rushing through new material.',
    ],
    quiz: [
      {
        question: 'What is active recall?',
        options: ['Trying to remember information without looking', 'Reading the material again', 'Watching a video'],
        answer: 'Trying to remember information without looking',
      },
      {
        question: 'If you feel stressed during practice, what is the best next step?',
        options: ['Take a short break', 'Continue without change', 'Start a new topic'],
        answer: 'Take a short break',
      },
    ],
    tips: [
      'Focus on one question at a time and avoid multitasking.',
      'If you get stuck, review the key points from the previous section.',
      'Use the module questions to guide your thinking instead of memorizing answers.',
    ],
  },
  {
    title: 'Lesson 4: Study Habits',
    topic: 'Building sustainable learning routines',
    description:
      'Learn how to set up study habits that match your emotional rhythm and keep learning enjoyable.',
    elaboration: [
      'Sustainable habits combine consistent effort with recovery. The companion encourages breaks when stress appears and reinforcement when engagement is high.',
      'A good routine includes short review sessions, regular emotion check-ins, and varied activities to avoid fatigue.',
      'You can use this module to build self-awareness as well as academic understanding.',
    ],
    keyPoints: [
      'Regular breaks reduce stress accumulation.',
      'Reflective questions deepen long-term retention.',
      'Emotion-aware routines support wellbeing during study.',
    ],
    quiz: [
      {
        question: 'Why are regular breaks important during study?',
        options: ['They reduce stress and improve focus', 'They waste time', 'They make lessons harder'],
        answer: 'They reduce stress and improve focus',
      },
      {
        question: 'What is one sign the system uses to suggest a break?',
        options: ['Stressed emotion', 'Engaged emotion', 'Normal emotion'],
        answer: 'Stressed emotion',
      },
    ],
    tips: [
      'Schedule short breaks after every focused practice block.',
      'Note one thing you understood well and one thing to review.',
      'Keep your study space calm and free from distractions.',
    ],
  },
];

function getAdaptiveModuleContent(emotion, difficulty) {
  const base = {
    Engaged:
      'You are engaged. The lesson can increase the challenge and introduce a new concept now.',
    Normal:
      'You are doing well. Continue at the current pace and keep practicing with the same level of detail.',
    Confused:
      'You seem confused. The system will simplify the explanation and offer a concrete example.',
    Stressed:
      'You look stressed. Slow down, review the previous step, and take a short pause before continuing.',
  };

  const difficultyHint = {
    easy: 'Focus on core ideas with a smaller step.',
    medium: 'Maintain steady progress and check your understanding.',
    hard: 'Challenge yourself with the next active prompt.',
  };

  return `${base[emotion] ?? base.Normal} ${difficultyHint[difficulty] ?? ''}`;
}

function averageExpressions(buffer) {
  if (!buffer.length) return null;
  const totals = buffer.reduce(
    (acc, expressions) => {
      for (const key of Object.keys(expressions)) {
        acc[key] = (acc[key] || 0) + (expressions[key] ?? 0);
      }
      return acc;
    },
    {}
  );
  const average = {};
  const count = buffer.length;
  for (const key of Object.keys(totals)) {
    average[key] = totals[key] / count;
  }
  return average;
}

function mapExpressionsToState(expressions) {
  if (!expressions) return 'Normal';
  const surprised = expressions.surprised ?? 0;
  const happy = expressions.happy ?? 0;
  const neutral = expressions.neutral ?? 0;
  const sad = expressions.sad ?? 0;
  const angry = expressions.angry ?? 0;
  const fearful = expressions.fearful ?? 0;
  const disgusted = expressions.disgusted ?? 0;
  const negative = Math.max(sad, angry, fearful, disgusted);

  const topEmotion = Object.entries(expressions).reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    ['neutral', 0]
  );

  if (surprised > 0.55) return 'Confused';
  if (topEmotion[0] === 'surprised' && topEmotion[1] > 0.4) return 'Confused';
  if (negative > 0.35) return 'Stressed';
  if (topEmotion[0] === 'sad' || topEmotion[0] === 'angry' || topEmotion[0] === 'fearful' || topEmotion[0] === 'disgusted') {
    if (topEmotion[1] > 0.3) return 'Stressed';
  }
  if (happy > 0.45) return 'Engaged';
  if (neutral > 0.45) return 'Normal';
  if (topEmotion[0] === 'happy' && topEmotion[1] > 0.35) return 'Engaged';
  if (topEmotion[0] === 'neutral' && topEmotion[1] > 0.35) return 'Normal';
  if (surprised > 0.35) return 'Confused';
  if (negative > 0.25) return 'Stressed';
  return 'Normal';
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function App() {
  const webcamRef = useRef(null);
  const detectInterval = useRef(null);
  const expressionHistory = useRef([]);
  const previousEmotionRef = useRef('Normal');
  const lastVoiceAtRef = useRef(0);
  const speechUtteranceRef = useRef(null);

  const [modelReady, setModelReady] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('Normal');
  const [statusMessage, setStatusMessage] = useState('Loading FER models...');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');
  const [adaptiveMessage, setAdaptiveMessage] = useState('Waiting for emotion inference...');
  const [hintText, setHintText] = useState('Hints will appear here when confusion or stress is detected.');
  const [emotionCounts, setEmotionCounts] = useState({ ...INITIAL_COUNTS });
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [confusedTips, setConfusedTips] = useState([]);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const emotionMeta = EMOTION_META[currentEmotion] ?? EMOTION_META.Normal;
  const currentModule = learningModules[currentModuleIndex];
  const adaptiveLessonContent = useMemo(
    () => getAdaptiveModuleContent(currentEmotion, difficulty),
    [currentEmotion, difficulty]
  );

  const engagementScore = useMemo(() => {
    return (
      emotionCounts.Engaged +
      emotionCounts.Normal -
      emotionCounts.Confused -
      emotionCounts.Stressed
    );
  }, [emotionCounts]);

  const progressPercent = Math.min(Math.max((engagementScore + 10) * 4, 0), 100);

  useEffect(() => {
    checkCameraPermission();
    loadFaceModels();
  }, []);

  useEffect(() => {
    if (cameraAllowed && modelReady) {
      startDetection();
    }
    return () => stopDetection();
  }, [cameraAllowed, modelReady]);

  useEffect(() => {
    const tick = setInterval(() => setSessionSeconds((value) => value + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!currentEmotion) return;
    if (currentEmotion !== previousEmotionRef.current) {
      previousEmotionRef.current = currentEmotion;
      handleEmotionUpdate(currentEmotion);
    }
  }, [currentEmotion]);

  useEffect(() => {
    if (currentEmotion === 'Stressed') {
      setQuizData(currentModule.quiz);
      setConfusedTips([]);
    } else if (currentEmotion === 'Confused') {
      setQuizData(null);
      setConfusedTips(currentModule.tips);
    }
  }, [currentModuleIndex, currentEmotion, currentModule.quiz, currentModule.tips]);

  useEffect(() => {
    setSelectedAnswers({});
  }, [quizData]);

  function goToPreviousModule() {
    setCurrentModuleIndex((index) => Math.max(index - 1, 0));
  }

  function goToNextModule() {
    setCurrentModuleIndex((index) => Math.min(index + 1, learningModules.length - 1));
  }

  async function checkCameraPermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraAllowed(true);
    } catch (error) {
      setCameraAllowed(false);
      setStatusMessage('Camera access denied. Enable webcam permission to begin.');
    }
  }

  async function loadFaceModels() {
    try {
      setStatusMessage('Loading FER model bundles...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setModelReady(true);
      setStatusMessage('FER models ready. Tracking emotion now.');
      addToast('FER models loaded successfully.');
    } catch (error) {
      console.error('Model load error', error);
      setStatusMessage('Unable to load face detection models. Check network connection.');
      addToast('Error loading FER models.', 'danger');
    }
  }

  function startDetection() {
    if (detectInterval.current) return;
    detectInterval.current = window.setInterval(() => {
      detectFaceEmotion();
    }, 700);
  }

  function stopDetection() {
    if (detectInterval.current) {
      window.clearInterval(detectInterval.current);
      detectInterval.current = null;
    }
  }

  async function detectFaceEmotion() {
    if (!webcamRef.current?.video || webcamRef.current.video.readyState !== 4) {
      return;
    }

    const video = webcamRef.current.video;
    try {
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      const detection = await faceapi.detectSingleFace(video, options).withFaceExpressions();
      if (!detection?.expressions) {
        setFaceDetected(false);
        setStatusMessage('Please look at the screen so the camera can detect your face.');
        return;
      }

      setFaceDetected(true);
      setStatusMessage('Face detected. Processing emotion...');

      const expressionData = {
        happy: detection.expressions.happy ?? 0,
        neutral: detection.expressions.neutral ?? 0,
        sad: detection.expressions.sad ?? 0,
        angry: detection.expressions.angry ?? 0,
        fearful: detection.expressions.fearful ?? 0,
        disgusted: detection.expressions.disgusted ?? 0,
        surprised: detection.expressions.surprised ?? 0,
      };

      expressionHistory.current.unshift(expressionData);
      if (expressionHistory.current.length > MAX_SMOOTHING_FRAMES) {
        expressionHistory.current.pop();
      }

      const smoothed = averageExpressions(expressionHistory.current);
      const mappedState = mapExpressionsToState(smoothed);
      setCurrentEmotion(mappedState);

      setEmotionCounts((prev) => ({
        ...prev,
        [mappedState]: prev[mappedState] + 1,
      }));

      setTimeline((prev) => [
        ...prev.slice(-39),
        {
          time: formatDuration(sessionSeconds),
          emotion: mappedState,
          value: emotionScoreValue[mappedState] ?? 2,
        },
      ]);
    } catch (error) {
      console.error('Detection error', error);
    }
  }

  async function handleEmotionUpdate(emotion) {
    const feedbackText = getVoiceFeedbackText(emotion);
    if (voiceEnabled) {
      speak(feedbackText);
    }

    const module = learningModules[currentModuleIndex];
    if (emotion === 'Stressed') {
      setQuizData(module.quiz);
      setConfusedTips([]);
    } else if (emotion === 'Confused') {
      setConfusedTips(module.tips);
      setQuizData(null);
    } else {
      setQuizData(null);
      setConfusedTips([]);
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/emotion`,
        { emotion },
        { timeout: 4000 }
      );

      const payload = response.data;
      setDifficulty(payload.difficulty);
      setAdaptiveMessage(payload.message);
      setHintText(payload.message);
      addToast(payload.message);
      postSessionData({ emotion, action: payload.action, difficulty: payload.difficulty });
      fetchAnalytics();
    } catch (error) {
      console.warn('Backend emotion API error', error);
    }
  }

  function getVoiceFeedbackText(emotion) {
    switch (emotion) {
      case 'Engaged':
        return 'Great job! Keep it up.';
      case 'Confused':
        return 'You seem confused. Let me help you with a hint.';
      case 'Stressed':
        return 'You look stressed. Take a short break.';
      case 'Normal':
      default:
        return "You're doing okay. Keep going.";
    }
  }

  function speak(message) {
    if (!isSpeechSupported || !voiceEnabled) return;
    const now = Date.now();
    if (now - lastVoiceAtRef.current < VOICE_COOLDOWN_MS) return;
    if (speechUtteranceRef.current) {
      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
    }
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      speechUtteranceRef.current = null;
    };
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    lastVoiceAtRef.current = now;
  }

  async function postSessionData(entry) {
    try {
      await axios.post(`${BACKEND_URL}/session-data`, {
        ...entry,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Session data error', error);
    }
  }

  async function fetchAnalytics() {
    try {
      const response = await axios.get(`${BACKEND_URL}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.warn('Analytics error', error);
    }
  }

  function addToast(message, variant = 'info') {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast = { id, message, variant };
    setToastQueue((previous) => [...previous, newToast]);
    window.setTimeout(() => {
      setToastQueue((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function toggleVoice() {
    if (!isSpeechSupported) {
      addToast('Speech synthesis is not supported in this browser.', 'danger');
      return;
    }
    setVoiceEnabled((value) => !value);
    addToast(`Voice feedback ${voiceEnabled ? 'disabled' : 'enabled'}.`);
  }

  function resetSession() {
    expressionHistory.current = [];
    previousEmotionRef.current = 'Normal';
    setEmotionCounts({ ...INITIAL_COUNTS });
    setTimeline([]);
    setSessionSeconds(0);
    setAdaptiveMessage('Session reset. Ready for a fresh start.');
    setHintText('Hints will appear here when confusion or stress is detected.');
    setQuizData(null);
    setSelectedAnswers({});
    setConfusedTips([]);
    setCurrentEmotion('Normal');
    addToast('Session has been reset.');
  }

  const chartData = timeline.map((entry, index) => ({
    ...entry,
    label: `${index + 1}`,
  }));

  const mostFrequentEmotion = useMemo(() => {
    const counts = emotionCounts;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'Normal';
  }, [emotionCounts]);

  if (cameraAllowed === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-10 shadow-2xl">
          <h1 className="text-3xl font-semibold text-rose-300">Camera access required</h1>
          <p className="mt-4 text-slate-300">
            Please allow webcam access in your browser settings and reload the page to start the adaptive learning companion.
          </p>
          <button
            className="mt-6 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6 text-slate-100 sm:px-6 lg:px-10">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Emotion-Aware Adaptive Companion</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-4xl">Real-time learning that adapts to how you feel</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Webcam-based FER, emotion smoothing, adaptive learning guidance, voice feedback, and analytics all in one demo-ready experience.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-800/80 p-4 text-center shadow-inner shadow-slate-950/20">
            <p className="text-sm uppercase text-slate-400">Session time</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{formatDuration(sessionSeconds)}</p>
          </div>
          <div className="rounded-2xl bg-slate-800/80 p-4 text-center shadow-inner shadow-slate-950/20">
            <p className="text-sm uppercase text-slate-400">Engagement score</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{engagementScore}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1.8fr_1fr]">
        <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Live emotion feed</h2>
              <p className="mt-1 text-sm text-slate-400">Webcam-based FER with smoothing and threshold classification.</p>
            </div>
            <div className={`inline-flex items-center rounded-2xl px-3 py-1.5 text-sm font-semibold ${emotionMeta.color} text-slate-950`}>
              {emotionMeta.emoji} {emotionMeta.label}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/40 shadow-inner">
            <Webcam
              audio={false}
              ref={webcamRef}
              mirrored={true}
              screenshotFormat="image/jpeg"
              className="h-96 w-full object-cover"
            />
            {!faceDetected && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center text-slate-100">
                <div>
                  <p className="text-xl font-semibold">No face detected</p>
                  <p className="mt-2 text-sm text-slate-400">Please look at the screen so the system can analyze your expression.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 rounded-3xl bg-slate-800/80 p-4 text-slate-300">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 p-4">
              <span className="text-sm uppercase tracking-[0.3em] text-slate-400">Emotion</span>
              <span className="font-semibold text-slate-100">{currentEmotion}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 p-4">
              <span className="text-sm uppercase tracking-[0.3em] text-slate-400">Status</span>
              <span className="font-semibold text-slate-100">{statusMessage}</span>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Learning companion</h2>
            <p className="mt-2 text-sm text-slate-400">Adaptive explanation and content change with each emotion update.</p>
          </div>

          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6 shadow-xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Learning module</p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-100">{currentModule.title}</h3>
                  <p className="mt-3 text-slate-400">{currentModule.description}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Topic</p>
                  <p className="mt-2 text-slate-100">{currentModule.topic}</p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-slate-300">
                {currentModule.keyPoints?.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-4 text-slate-300">
                {currentModule.elaboration?.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">{paragraph}</p>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={goToPreviousModule}
                  className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"
                  disabled={currentModuleIndex === 0}
                >
                  Previous lesson
                </button>
                <button
                  onClick={goToNextModule}
                  className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                  disabled={currentModuleIndex === learningModules.length - 1}
                >
                  Next lesson
                </button>
              </div>
            </div>
          </div>

          {quizData && currentEmotion === 'Stressed' && (
            <div className="rounded-[2rem] border border-rose-600 bg-slate-950/80 p-6 shadow-inner">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-rose-200">Stress quiz</h3>
                  <p className="mt-1 text-sm text-slate-400">A short review quiz based on the active learning lesson.</p>
                </div>
                <span className="rounded-full bg-rose-700 px-3 py-1 text-sm text-slate-100">Quiz mode</span>
              </div>
              <div className="mt-5 space-y-4">
                {quizData.map((item, idx) => (
                  <div key={item.question} className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="font-semibold text-slate-100">{idx + 1}. {item.question}</p>
                    <div className="mt-3 grid gap-2">
                      {item.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [idx]: option }))}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-slate-200 transition ${
                            selectedAnswers[idx] === option
                              ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                              : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {selectedAnswers[idx] ? (
                      <p className="mt-3 text-sm text-slate-400">
                        Selected: <span className="font-semibold text-slate-100">{selectedAnswers[idx]}</span>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {confusedTips.length > 0 && currentEmotion === 'Confused' && (
            <div className="rounded-[2rem] border border-amber-500 bg-slate-950/80 p-6 shadow-inner">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-amber-200">Confused tips</h3>
                  <p className="mt-1 text-sm text-slate-400">Quick study tips to help you regain clarity.</p>
                </div>
                <span className="rounded-full bg-amber-700 px-3 py-1 text-sm text-slate-100">Tip mode</span>
              </div>
              <ul className="mt-5 space-y-3 text-slate-300">
                {confusedTips.map((tip) => (
                  <li key={tip} className="rounded-3xl bg-slate-900/80 p-4 text-slate-200">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-100">Adaptive explanation</h3>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{difficulty}</span>
            </div>
            <p className="mt-4 text-slate-300">{adaptiveLessonContent}</p>
            <div className="mt-6 rounded-3xl bg-slate-900/80 p-4 text-slate-300">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Hint summary</p>
              <p className="mt-2 text-slate-100">{hintText}</p>
            </div>
          </div>
        </section>

        <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Controls & status</h2>
            <p className="mt-2 text-sm text-slate-400">Toggle voice feedback, reset the session, and monitor the adaptive engine.</p>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-slate-700 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-900/80 p-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Voice feedback</p>
                <p className="mt-2 text-base font-semibold text-slate-100">{voiceEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                onClick={toggleVoice}
                className={`rounded-2xl px-4 py-2 font-semibold ${voiceEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}
              >
                {voiceEnabled ? 'Turn off' : 'Turn on'}
              </button>
            </div>

            <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Current difficulty</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{difficulty}</p>
            </div>

            <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Most frequent emotion</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{mostFrequentEmotion}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={resetSession}
                className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Reset session
              </button>
              <button
                onClick={fetchAnalytics}
                className="rounded-2xl bg-slate-700 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-600"
              >
                Refresh analytics
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Emotion timeline</h2>
              <p className="mt-1 text-sm text-slate-400">Real-time emotion history over the current session.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">Last {chartData.length} entries</span>
          </div>
          <div className="mt-6 h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8' }}
                    domain={[0, 3]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(value) => {
                      if (value === 0) return 'Stressed';
                      if (value === 1) return 'Confused';
                      if (value === 2) return 'Normal';
                      if (value === 3) return 'Engaged';
                      return value;
                    }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#0ea5e9', strokeWidth: 1 }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 text-slate-500">
                No timeline data yet. Start the webcam to collect emotion history.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Analytics summary</h2>
              <p className="mt-1 text-sm text-slate-400">Live metrics from the backend analytics API.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/80 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Total events</p>
                <p className="mt-3 text-3xl font-semibold text-slate-100">{analytics?.totalEvents ?? timeline.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Engagement</p>
                <p className="mt-3 text-3xl font-semibold text-slate-100">{analytics?.engagementScore ?? engagementScore}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Most frequent emotion</p>
              <p className="mt-3 text-2xl font-semibold text-slate-100">{analytics?.mostFrequentEmotion ?? mostFrequentEmotion}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Stress / confusion spikes</p>
              <div className="mt-3 space-y-2 text-slate-300">
                {analytics?.spikes?.length > 0 ? (
                  analytics.spikes.map((item) => (
                    <div key={item.timestamp} className="rounded-2xl bg-slate-900/80 p-3">
                      <p className="text-sm text-slate-400">{item.timestamp}</p>
                      <p className="mt-1 text-base font-semibold text-slate-100">{item.emotion}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No stress or confusion events yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-50">Engagement meter</h2>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{progressPercent}%</span>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 flex w-full max-w-xs flex-col gap-3">
        {toastQueue.map((toast) => (
          <div
            key={toast.id}
            className={`animate-fade-in rounded-3xl border px-4 py-3 text-sm shadow-xl transition ${
              toast.variant === 'danger'
                ? 'border-rose-500 bg-rose-500/10 text-rose-100'
                : 'border-slate-700 bg-slate-900/90 text-slate-100'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
