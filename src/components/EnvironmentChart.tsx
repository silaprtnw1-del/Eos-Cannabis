/**
 * EnvironmentChart – SVG line chart + linear trend line for one climate
 * metric (temp/RH/VPD) over a room's recent `environmental_logs` history.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';
import type { ClimatePoint } from '../types';

const CHART_HEIGHT = 130;
const PAD_X = 4;
const PAD_TOP = 10;
const PAD_BOTTOM = 16;

type MetricKey = 'tempc' | 'humidityrh' | 'vpd';

interface EnvironmentChartProps {
  data: ClimatePoint[];
  metric: MetricKey;
  unit: string;
  color?: string;
  decimals?: number;
}

/** Least-squares fit: y = intercept + slope * x. */
function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

export function EnvironmentChart({ data, metric, unit, color = colors.accent, decimals = 1 }: EnvironmentChartProps) {
  const chart = useMemo(() => {
    if (data.length < 2) return null;

    const width = 300; // viewBox units; Svg scales to 100% container width
    const t0 = new Date(data[0].recordedat).getTime();
    const xs = data.map((d) => new Date(d.recordedat).getTime() - t0);
    const ys = data.map((d) => d[metric]);

    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const yRange = maxY - minY || 1; // avoid divide-by-zero on a flat line
    const maxX = xs[xs.length - 1] || 1;

    const plotW = width - PAD_X * 2;
    const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const toX = (x: number) => PAD_X + (x / maxX) * plotW;
    const toY = (y: number) => PAD_TOP + plotH - ((y - minY) / yRange) * plotH;

    const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${toX(x).toFixed(1)} ${toY(ys[i]).toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${toX(maxX).toFixed(1)} ${(PAD_TOP + plotH).toFixed(1)} L ${toX(0).toFixed(1)} ${(PAD_TOP + plotH).toFixed(1)} Z`;

    const { slope, intercept } = linearRegression(xs, ys);
    const trendStart = { x: toX(0), y: toY(intercept) };
    const trendEnd = { x: toX(maxX), y: toY(intercept + slope * maxX) };
    const perHour = slope * 3_600_000; // units per hour

    return { width, linePath, areaPath, trendStart, trendEnd, perHour, minY, maxY };
  }, [data, metric]);

  if (!chart) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Not enough data yet</Text>
      </View>
    );
  }

  const { width, linePath, areaPath, trendStart, trendEnd, perHour, minY, maxY } = chart;
  const arrow = perHour > 0.005 ? '▲' : perHour < -0.005 ? '▼' : '→';
  const trendColor = perHour > 0.005 ? colors.warning : perHour < -0.005 ? colors.info : colors.textMuted;

  return (
    <View>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaFill)" stroke="none" />
        <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Line
          x1={trendStart.x}
          y1={trendStart.y}
          x2={trendEnd.x}
          y2={trendEnd.y}
          stroke={colors.textMuted}
          strokeWidth={1.2}
          strokeDasharray="4,3"
        />
        <SvgText x={PAD_X} y={PAD_TOP - 2} fill={colors.textMuted} fontSize={8}>
          {maxY.toFixed(decimals)}
        </SvgText>
        <SvgText x={PAD_X} y={CHART_HEIGHT - 4} fill={colors.textMuted} fontSize={8}>
          {minY.toFixed(decimals)}
        </SvgText>
      </Svg>
      <Text style={[styles.trendText, { color: trendColor }]}>
        {arrow} {perHour >= 0 ? '+' : ''}
        {perHour.toFixed(decimals === 0 ? 1 : decimals + 1)} {unit}/hr
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontFamily: 'monospace',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
