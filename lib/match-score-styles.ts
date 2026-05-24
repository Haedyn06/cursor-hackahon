/** Match score pill colors — aligned with the HTML prototype */
export function matchScorePillStyle(score: number) {
  if (score >= 80) {
    return {
      background: "var(--mint)",
      color: "#1a7a4a",
    };
  }
  if (score >= 60) {
    return {
      background: "var(--yellow)",
      color: "#8a6a00",
    };
  }
  return {
    background: "var(--peach)",
    color: "#a03030",
  };
}

export function matchScoreCircleColor(score: number) {
  if (score >= 80) return "var(--mint)";
  if (score >= 60) return "var(--yellow)";
  return "var(--peach)";
}
