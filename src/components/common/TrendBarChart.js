import { useContext } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ThemeContext } from "../../contexts/ThemeContext";

const DEFAULT_COLORS = ["#f84525", "#7775ff", "#16a36a", "#ffa826"];

/** Compact grouped bar chart for comparing multiple series by category. */
const TrendBarChart = ({
  data = [],
  xKey = "name",
  series = [{ key: "value", name: "Value" }],
  height = "100%",
  yLabel,
  tooltipFormatter,
  showLegend = true,
}) => {
  const { mode } = useContext(ThemeContext);
  const dark = mode === "dark";
  const axisColor = dark ? "#9ca3af" : "#94a3b8";
  const gridColor = dark ? "#374151" : "#e9edf2";
  const maxValue = Math.max(0, ...data.flatMap((row) => series.map((item) => Number(row[item.key]) || 0)));
  const compactScale = maxValue <= 8;
  const yMax = Math.max(1, maxValue);
  const yTicks = compactScale ? Array.from({ length: yMax + 1 }, (_, index) => index) : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: yLabel ? 8 : 0, bottom: 0 }} barCategoryGap="32%">
        <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={{ stroke: gridColor }}
          tick={{ fill: axisColor, fontSize: 11 }}
          interval={0}
          tickMargin={8}
        />
        <YAxis
          domain={[0, compactScale ? yMax : "auto"]}
          ticks={yTicks}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: axisColor, fontSize: 11 }}
          width={32}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: axisColor, fontSize: 11 } : undefined}
        />
        <Tooltip
          formatter={tooltipFormatter || ((value, name) => [value, name])}
          cursor={{ fill: dark ? "#1f2937" : "#f8fafc" }}
          contentStyle={{
            borderRadius: 6,
            borderColor: dark ? "#374151" : "#e8eaf0",
            backgroundColor: dark ? "#111827" : "#ffffff",
            color: dark ? "#f3f4f6" : "#111827",
            boxShadow: "0 8px 24px rgba(17, 24, 39, 0.10)",
          }}
          itemStyle={{ color: dark ? "#f3f4f6" : "#111827" }}
          labelStyle={{ color: axisColor, marginBottom: 4 }}
        />
        {showLegend && (
          <Legend
            verticalAlign="top"
            align="left"
            height={28}
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: axisColor }}
          />
        )}
        {series.map((item, index) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.name || item.key}
            fill={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            radius={[6, 6, 6, 6]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TrendBarChart;
