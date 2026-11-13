import { useContext, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ThemeContext } from "../../contexts/ThemeContext";

const DEFAULT_COLORS = ["#f84525", "#16a36a", "#64748b", "#ffa826", "#3b82f6"];

/** Donut chart with a compact legend and total, for status breakdowns. */
const DonutSummaryChart = ({
  data = [],
  nameKey = "name",
  valueKey = "value",
  colors = DEFAULT_COLORS,
  totalLabel = "Total",
  height = 208,
  className = "",
}) => {
  const { mode } = useContext(ThemeContext);
  const dark = mode === "dark";
  const total = useMemo(
    () => data.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0),
    [data, valueKey]
  );
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <div className={`grid min-w-0 grid-cols-[minmax(130px,0.9fr)_minmax(130px,1.1fr)] items-center gap-2 sm:gap-4 ${className}`}>
      <div className="relative min-w-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke={dark ? "#111827" : "#ffffff"}
              strokeWidth={2}
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                if (percent < 0.08) return null;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.62;
                const angle = (-midAngle * Math.PI) / 180;
                return (
                  <text
                    x={cx + radius * Math.cos(angle)}
                    y={cy + radius * Math.sin(angle)}
                    fill="#ffffff"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {`${Math.round(percent * 100)}%`}
                  </text>
                );
              }}
            >
              {chartData.map((item, index) => <Cell key={`${item[nameKey]}-${index}`} fill={item.fill} />)}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{
                borderRadius: 2,
                borderColor: dark ? "#374151" : "#ffd8cf",
                backgroundColor: dark ? "#111827" : "#ffffff",
                color: dark ? "#f3f4f6" : "#111827",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{totalLabel}</span>
          <strong className="text-xl leading-tight text-gray-900 dark:text-gray-100">{total}</strong>
        </div>
      </div>

      <div className="min-w-0">
        <ul className="space-y-2">
          {chartData.map((item, index) => {
            const value = Number(item[valueKey]) || 0;
            const percent = total ? Math.round((value / total) * 100) : 0;
            return (
              <li key={`${item[nameKey]}-${index}`} className="flex min-w-0 items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.fill }} />
                <span className="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-300">{item[nameKey]}</span>
                <span className="shrink-0 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {value}<span className="ml-1 font-normal text-gray-500 dark:text-gray-400">({percent}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-xs dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400">{totalLabel}</span>
          <strong className="tabular-nums text-gray-900 dark:text-gray-100">{total}</strong>
        </div>
      </div>
    </div>
  );
};

export default DonutSummaryChart;
