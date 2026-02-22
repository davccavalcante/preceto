import { cn } from '@/lib/utils'

type PrecetoLogoProps = React.ComponentProps<'svg'>

function PrecetoLogo({ className, ...props }: PrecetoLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Preceto"
      className={cn('size-10', className)}
      {...props}
    >
      <rect width="200" height="200" rx="40" className="fill-foreground" />
      <rect
        x="93"
        y="30"
        width="14"
        height="90"
        rx="4"
        className="fill-background"
        transform="rotate(-45 100 100)"
      />
      <polygon
        points="100,148 93,135 107,135"
        className="fill-background"
        transform="rotate(-45 100 100)"
      />
      <circle
        cx="136"
        cy="136"
        r="4"
        className="fill-background"
        opacity="0.6"
      />
      <line
        x1="42"
        y1="155"
        x2="100"
        y2="155"
        className="stroke-background"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1="42"
        y1="165"
        x2="85"
        y2="165"
        className="stroke-background"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <line
        x1="42"
        y1="175"
        x2="92"
        y2="175"
        className="stroke-background"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  )
}

export { PrecetoLogo }
