export const withRiskParam = (target, riskId) => {
  if (!riskId) return target;
  const [base, queryString = ""] = target.split("?");
  const params = new URLSearchParams(queryString);
  params.set("riskId", riskId);
  return `${base}?${params.toString()}`;
};

export const RISK_LIFECYCLE_STEPS = [
  { key: "view", label: "Identify", path: "/risk/view" },
  { key: "scoring", label: "Assess", path: "/risk/scoring" },
  { key: "treatment", label: "Treat", path: "/risk/treatment" },
  { key: "reviews", label: "Review", path: "/risk/reviews" },
  { key: "poam", label: "POAM", path: "/risk/poam" },
  { key: "close", label: "Close", path: "/risk/close" },
];
