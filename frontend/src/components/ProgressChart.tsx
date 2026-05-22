// ─────────────────────────────────────────────────────────────
// components/ProgressChart.tsx
// Recharts line/bar chart of change % across time steps
// ─────────────────────────────────────────────────────────────
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface DataPoint {
  step: string;
  change: number;
  expected?: number;
  regions: number;
}

interface Props {
  data: DataPoint[];
  title?: string;
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-sm p-3 shadow-xl text-sm">
      <p className="font-semibold text-slate-200 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.dataKey}:</span>
          <span className="font-mono font-medium" style={{ color: p.color }}>
            {typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const barColor = (pct: number) => {
  if (pct < 5)  return '#64748b';
  if (pct < 20) return '#3b82f6';
  if (pct < 40) return '#f59e0b';
  if (pct < 65) return '#f97316';
  return '#ef4444';
};

export default function ProgressChart({ data, title }: Props) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-0.5">Progress Timeline</p>
          <h3 className="text-base font-semibold text-slate-200">
            {title ?? 'Construction Change Over Time'}
          </h3>
        </div>
        <div className="flex gap-1 p-1 bg-surface-700 rounded-lg">
          <button
            onClick={() => setChartType('line')}
            className={clsx(
              'w-8 h-8 rounded-md flex items-center justify-center transition-all',
              chartType === 'line' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={clsx(
              'w-8 h-8 rounded-md flex items-center justify-center transition-all',
              chartType === 'bar' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#253362" strokeOpacity={0.5} />
            <XAxis
              dataKey="step"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#253362' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#253362' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(val) => (
                <span className="text-xs text-slate-400 capitalize">{val}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="change"
              stroke="#27a5f9"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#27a5f9', strokeWidth: 0 }}
              activeDot={{ r: 7, fill: '#27a5f9', stroke: '#fff', strokeWidth: 2 }}
              name="Change %"
            />
            {data.some((d) => d.expected != null) && (
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                name="Expected %"
              />
            )}
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#253362" strokeOpacity={0.5} />
            <XAxis
              dataKey="step"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#253362' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#253362' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="change" name="Change %" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.change)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.05]">
        {[
          { label: 'Peak Change', value: `${Math.max(...data.map((d) => d.change)).toFixed(1)}%` },
          { label: 'Avg Change',  value: `${(data.reduce((s, d) => s + d.change, 0) / data.length).toFixed(1)}%` },
          { label: 'Time Steps',  value: String(data.length) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-lg font-bold text-brand-400 font-mono">{value}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
