/**
 * Simple Line Chart Component
 * 
 * A lightweight line chart using react-native-svg
 * that doesn't require external charting libraries.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { COLORS, FONT_SIZE, SPACING } from '../../constants';

interface SimpleLineChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  labels = [],
  height = 180,
  color = COLORS.primary,
  showDots = true,
  showGrid = true,
}) => {
  const width = Dimensions.get('window').width - (SPACING.md * 2) - 32; // Account for padding
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const minValue = Math.min(...data) * 0.9;
  const maxValue = Math.max(...data) * 1.1;
  const valueRange = maxValue - minValue || 1;

  // Calculate points
  const points = data.map((value, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y, value };
  });

  // Create path
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create smooth curve path using quadratic bezier
  const createSmoothPath = () => {
    if (points.length < 2) return pathData;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      
      if (i === 0) {
        path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
      } else {
        path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
      }
    }
    
    // Last point
    const last = points[points.length - 1];
    path += ` L ${last.x} ${last.y}`;
    
    return path;
  };

  // Grid lines (horizontal)
  const gridLines = 4;
  const gridYPositions = Array.from({ length: gridLines + 1 }, (_, i) => 
    padding.top + (i / gridLines) * chartHeight
  );
  const gridYValues = Array.from({ length: gridLines + 1 }, (_, i) => 
    maxValue - (i / gridLines) * valueRange
  );

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {showGrid && gridYPositions.map((y, i) => (
          <G key={`grid-${i}`}>
            <Line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={COLORS.gray[200]}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          </G>
        ))}

        {/* Line path */}
        <Path
          d={createSmoothPath()}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && points.map((point, index) => (
          <Circle
            key={`dot-${index}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={COLORS.white}
            stroke={color}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Y-axis labels */}
      <View style={[styles.yAxisLabels, { top: padding.top, height: chartHeight }]}>
        {gridYValues.map((value, i) => (
          <Text key={`y-${i}`} style={styles.yAxisLabel}>
            {value.toFixed(1)}
          </Text>
        ))}
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxisLabels, { left: padding.left, width: chartWidth }]}>
        {labels.length > 0 ? (
          labels.map((label, i) => (
            <Text key={`x-${i}`} style={styles.xAxisLabel}>{label}</Text>
          ))
        ) : (
          data.map((_, i) => (
            <Text key={`x-${i}`} style={styles.xAxisLabel}>{i + 1}</Text>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  noData: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    width: 35,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default SimpleLineChart;
