export function FlowGrip() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" className="shrink-0 text-muted-foreground/70">
      {[3, 8, 13].flatMap((y) => [
        <circle key={`l${y}`} cx="3" cy={y} r="1.1" fill="currentColor" />,
        <circle key={`r${y}`} cx="7.5" cy={y} r="1.1" fill="currentColor" />,
      ])}
    </svg>
  );
}
