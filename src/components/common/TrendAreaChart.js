import { useContext, useId } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_COLORS = ["#f84525", "#ffa826", "#ef4444", "#1f2937"];

const TrendAreaChart = ({
  data,
  xKey = "name",
  series = [{ key: "value", name: "Value" }],
  height = "100%",
  yLabel,
  tooltipFormatter,
  showXAxis = true,
  showYAxis = true,
  showGrid = true,
  showLatestDot = false,
  strokeWidth = 3,
  gradientOpacity = 0.34,
  variant = "default",
}) => {
  const { mode } = useContext(ThemeContext);
  const dark = mode === "dark";
  const axisColor = dark ? "#9ca3af" : "#6b7280";
  const gridColor = dark ? "#374151" : "#f6dcd4";
  const safeSeries = series.length ? series : [{ key: "value", name: "Value" }];
  const chartId = useId().replace(/:/g, "");
  const sparkline = variant === "sparkline";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: showLatestDot ? 8 : 10, left: yLabel ? 6 : -8, bottom: 0 }}>
        <defs>
          {safeSeries.map((item, index) => {
            const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            return (
              <linearGradient key={item.key} id={`${chartId}-trendGradient-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={gradientOpacity} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="2 5" vertical={false} stroke={gridColor} />}
        <XAxis
          hide={!showXAxis}
          dataKey={xKey}
          tickLine={false}
          axisLine={{ stroke: sparkline ? (dark ? "#4b5563" : "#eef0f4") : (dark ? "#9ca3af" : "#ffa826"), strokeWidth: sparkline ? 1 : 2 }}
          tick={{ fill: axisColor, fontSize: sparkline ? 10 : 12 }}
          interval={0}
          tickMargin={8}
        />
        <YAxis
          hide={!showYAxis}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: axisColor, fontSize: sparkline ? 10 : 12 }}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: axisColor, fontSize: 12 },
                }
              : undefined
          }
        />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{
            borderRadius: 2,
            borderColor: dark ? "#374151" : "#ffd8cf",
            backgroundColor: dark ? "#111827" : "#ffffff",
            color: dark ? "#f3f4f6" : "#111827",
            boxShadow: "0 12px 30px rgba(17, 24, 39, 0.12)",
          }}
          cursor={{ stroke: "#f84525", strokeOpacity: 0.16, strokeWidth: 2 }}
        />
        {safeSeries.map((item, index) => {
          const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          return (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name || item.key}
              stroke={color}
              fill={`url(#${chartId}-trendGradient-${item.key})`}
              strokeWidth={strokeWidth}
              dot={showLatestDot ? (point) => point.index === data.length - 1 ? (
                <circle key={`${item.key}-latest-dot`} cx={point.cx} cy={point.cy} r={4} fill={dark ? "#111827" : "#ffffff"} stroke={color} strokeWidth={2.5} />
              ) : null : false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default TrendAreaChart;
