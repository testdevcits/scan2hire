import { useId } from "react";
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
}) => {
  const safeSeries = series.length ? series : [{ key: "value", name: "Value" }];
  const chartId = useId().replace(/:/g, "");

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: yLabel ? 6 : -8, bottom: 0 }}>
        <defs>
          {safeSeries.map((item, index) => {
            const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            return (
              <linearGradient key={item.key} id={`${chartId}-trendGradient-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.34} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#f6dcd4" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={{ stroke: "#ffa826", strokeWidth: 2 }}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 },
                }
              : undefined
          }
        />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{
            borderRadius: 2,
            borderColor: "#ffd8cf",
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
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default TrendAreaChart;
