import { gaugeArcPath } from '../../utils/svgPath';

type Props = {
  percent: number;
  valueLabel: string;
  unitLabel?: string;
};

export function CalorieGauge({ percent, valueLabel, unitLabel = 'kcal' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center relative mt-2 pt-2">
      <svg width={176} height={96} viewBox="0 0 100 50">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#eef0f6"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d={gaugeArcPath(percent)}
          fill="none"
          stroke="#6c63ff"
          strokeWidth={8}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute bottom-1 text-center">
        <p className="text-base font-extrabold text-[var(--text)]">
          {valueLabel}{' '}
          <span className="text-xs font-semibold text-[var(--muted)]">{unitLabel}</span>
        </p>
      </div>
    </div>
  );
}
