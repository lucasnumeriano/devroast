import { twMerge } from 'tailwind-merge'

type ScoreRingProps = {
  score: number
  max?: number
  size?: number
  className?: string
}

function ScoreRing({ score, max = 10, size = 180, className }: ScoreRingProps) {
  const center = size / 2
  const radius = center - 4
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(score / max, 1)
  const offset = circumference * (1 - ratio)

  return (
    <div
      className={twMerge('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <title>{`Score: ${score} out of ${max}`}</title>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-zinc-800"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex items-end gap-0.5">
        <span className="font-mono text-5xl font-bold text-zinc-50 leading-none">{score}</span>
        <span className="font-mono text-base text-zinc-600 leading-none">/{max}</span>
      </div>
    </div>
  )
}

export { ScoreRing, type ScoreRingProps }
