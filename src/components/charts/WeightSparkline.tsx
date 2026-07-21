import { smoothPath } from '../../utils/svgPath';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function WeightSparkline({
  values,
  width = 128,
  height = 56,
  color = '#c6ff3d',
}: Props) {
  if (values.length < 2) {
    return <svg width={width} height={height} viewBox="0 0 100 40" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 5;
  const usableWidth = 100 - padX * 2;

  const points = values.map((value, index) => ({
    x: padX + (index / (values.length - 1)) * usableWidth,
    y: 5 + (1 - (value - min) / range) * 30,
  }));

  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox="0 0 100 40">
      <path
        d={smoothPath(points)}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
      <circle cx={last.x} cy={last.y} r={6} fill={color} fillOpacity={0.2} />
    </svg>
  );
}
