import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

const axis = { fontSize: 12, fill: '#94a3b8' };
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 4px 12px rgb(0 0 0 / .08)' },
  cursor: { fill: 'rgba(99,102,241,.06)' },
};
const barColor = (v) => (v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#f43f5e');
export const PIE_COLORS = ['#0ea5e9', '#f43f5e', '#8b5cf6', '#10b981'];

export function ScoreTrend({ data, height = 260 }) {
  const rows = data.map((d, i) => ({
    i: i + 1,
    label: new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    score: d.percentage,
    quiz: d.quizTitle,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(_, p) => p?.[0]?.payload.quiz || ''} />
        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#g)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AverageBars({ data, height = 260, dataKey = 'average', nameKey = 'name', layout = 'vertical' }) {
  if (layout === 'horizontal')
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
          <XAxis dataKey={nameKey} tick={axis} tickLine={false} axisLine={false} interval={0} tickFormatter={(s) => (s.length > 14 ? s.slice(0, 13) + '…' : s)} />
          <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Average']} />
          <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => <Cell key={i} fill={barColor(d[dataKey])} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  return (
    <ResponsiveContainer width="100%" height={Math.max(height, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey={nameKey} tick={axis} tickLine={false} axisLine={false} width={120} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Average']} />
        <Bar dataKey={dataKey} radius={[0, 8, 8, 0]} barSize={22} background={{ fill: 'rgba(148,163,184,.12)', radius: 8 }}>
          {data.map((d, i) => <Cell key={i} fill={barColor(d[dataKey])} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SubjectRadar({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
        <PolarAngleAxis dataKey="name" tick={axis} />
        <Radar dataKey="average" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Average']} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
