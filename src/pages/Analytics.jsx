import { useSession } from '../context/SessionContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const emotionColors = {
  Engaged: '#6366f1',
  Confused: '#f59e0b',
  Stressed: '#ec4899',
  Frustrated: '#ef4444',
  Bored: '#3b82f6',
  Excited: '#22c55e',
  Breakthrough: '#a855f7',
};

const emotionIcons = {
  Engaged: '😊',
  Confused: '😕',
  Stressed: '😰',
  Frustrated: '😤',
  Bored: '😐',
  Excited: '😄',
  Breakthrough: '🤩',
};

const emotionPillClasses = {
  Engaged: 'bg-indigo-100 text-indigo-700',
  Confused: 'bg-amber-100 text-amber-700',
  Stressed: 'bg-pink-100 text-pink-700',
  Frustrated: 'bg-red-100 text-red-700',
  Bored: 'bg-blue-100 text-blue-700',
  Excited: 'bg-green-100 text-green-700',
  Breakthrough: 'bg-purple-100 text-purple-700',
};

const formatTimestamp = (date) => {
  const d = new Date(date);
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${m}:${s}`;
};

const Analytics = () => {
  const { emotionEvents, engagementScore, paceAdjustments, hintsUsed, sessionStartTime } = useSession();

  // Session duration
  const now = new Date();
  const durationSec = Math.floor((now - new Date(sessionStartTime)) / 1000);
  const durationStr = `${Math.floor(durationSec / 60).toString().padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`;

  // Average engagement
  const avgEngagement = emotionEvents.length > 0
    ? Math.round(emotionEvents.reduce((sum, e) => sum + e.engagementScore, 0) / emotionEvents.length)
    : engagementScore;

  // Line chart data
  const lineData = emotionEvents.map((e, i) => ({
    time: formatTimestamp(e.timestamp),
    score: e.engagementScore,
    emotion: e.emotion,
    isStress: e.emotion === 'Stressed' || e.emotion === 'Confused' || e.emotion === 'Frustrated',
  }));

  // Pie chart data
  const emotionCounts = {};
  emotionEvents.forEach(e => {
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
  });
  const pieData = Object.entries(emotionCounts).map(([name, value]) => ({
    name,
    value,
    color: emotionColors[name] || '#6b7280',
  }));

  const metrics = [
    { label: 'Session Duration', value: durationStr, icon: '⏱️' },
    { label: 'Avg Engagement', value: `${avgEngagement}/100`, icon: '📈' },
    { label: 'Pace Adjustments', value: paceAdjustments, icon: '⚡' },
    { label: 'Hints Used', value: hintsUsed, icon: '💡' },
  ];

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.isStress) {
      return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Analytics Dashboard</h1>

      {/* TOP — 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl">
              {m.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-extrabold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE — Charts */}
      {emotionEvents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Line Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Engagement Over Time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value, name) => [`${value}`, 'Score']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#engagementGradient)"
                  dot={<CustomDot />}
                  activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Emotion Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Emotion Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#d1d5db' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex items-center justify-center text-gray-400 text-sm font-medium col-span-2">
            No chart data yet — start a session to see engagement trends.
          </div>
        </div>
      )}

      {/* BOTTOM — Emotion Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Emotion Timeline</h2>
        {emotionEvents.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {[...emotionEvents].reverse().map((event, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-mono text-gray-400 w-14 shrink-0">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${emotionPillClasses[event.emotion] || 'bg-gray-100 text-gray-600'}`}>
                  <span>{emotionIcons[event.emotion] || '❓'}</span>
                  {event.emotion}
                </span>
                <span className="ml-auto text-sm font-mono font-semibold text-gray-700">
                  {event.engagementScore}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-4">📊</p>
            <p className="font-medium">No data yet — start a session</p>
            <p className="text-sm mt-1">Emotion events will appear here in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
