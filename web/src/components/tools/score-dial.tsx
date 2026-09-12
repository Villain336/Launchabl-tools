export function ScoreDial({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex flex-col items-center">
      <div className={`text-4xl font-extrabold ${color}`}>{score}</div>
      <p className="text-xs text-muted-foreground">out of 100</p>
    </div>
  );
}
