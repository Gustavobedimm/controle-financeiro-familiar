export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "bad" | "warn" | "neutral" }) {
  const tones = {
    good: "bg-primary/10 text-primary",
    bad: "bg-destructive/10 text-destructive",
    warn: "bg-accent/30 text-accent-foreground",
    neutral: "bg-muted text-muted-foreground"
  };

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
