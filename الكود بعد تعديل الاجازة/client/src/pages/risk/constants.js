export const CATEGORIES = [
  "Application Security",
  "Application Security / Mobile",
  "Business Continuity",
  "Cloud Security",
  "Compliance",
  "Compliance / Cybersecurity",
  "Compliance / Legal",
  "Cybersecurity",
  "Cybersecurity / Fraud",
  "Emerging Technology / AI",
  "Human Risk",
  "Human Risk / Emerging Technology",
  "Human Risk / Security Monitoring",
  "Information Security",
  "Operational",
  "Operational / BCP",
  "Operational / Third Party",
  "Physical Security",
  "Physical Security / Fraud",
  "Risk Management",
  "Third Party Risk",
  "Third Party Risk / Cybersecurity",
];

export const STATUSES = ["Open", "In Progress", "Accepted", "Closed"];
export const TREATMENTS = ["Mitigate", "Accept", "pending_acceptance", "Transfer", "Avoid"];
export const SCALE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

export const SCALE_LABELS = {
  1: "Rare / Insignificant",
  2: "Unlikely / Minor",
  3: "Possible / Moderate",
  4: "Likely / Major",
  5: "Almost certain / Severe",
};

export const IMPACT_DIMENSIONS = [
  { key: "impactFinance", name: "Financial" },
  { key: "impactRegulatory", name: "Regulatory" },
  { key: "impactReputational", name: "Reputational" },
  { key: "impactSafety", name: "Safety" },
  { key: "impactOperational", name: "Operational" },
  { key: "impactC", name: "Confidentiality" },
  { key: "impactI", name: "Integrity" },
  { key: "impactA", name: "Availability" },
];

export const STANDARD_CRITERIA = IMPACT_DIMENSIONS.map((d) => ({ name: d.name, weight: 0.125 }));

export const CRITERIA_CATALOG = IMPACT_DIMENSIONS.map((d) => d.name);

export const LEVELS = ["Low", "Medium", "High", "Critical"];
