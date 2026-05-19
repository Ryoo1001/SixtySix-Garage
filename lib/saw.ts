import { MOCK_OILS, Oil } from "./mock-data";

export type BudgetCategory = "Low" | "Medium" | "High";

export type SawInput = {
  transmission: "Matic" | "Manual";
  cc: number;
  budget: BudgetCategory;
};

// Criteria weights (sum = 1)
const WEIGHTS = {
  transmissionMatch: 0.30, // 30%
  ccMatch: 0.25,           // 25%
  budgetMatch: 0.20,       // 20%
  apiGrade: 0.15,          // 15%
  reputation: 0.10         // 10%
};

// Helper functions to calculate raw scores (0 to 1) for each criteria
function getTransmissionScore(oil: Oil, input: SawInput): number {
  return oil.transmission === input.transmission ? 1 : 0;
}

function getCcScore(oil: Oil, input: SawInput): number {
  // 1 if perfectly within range, 0.5 if slightly outside, 0 if completely unsuitable
  if (input.cc >= oil.minCc && input.cc <= oil.maxCc) return 1;
  const padding = 50;
  if (input.cc >= oil.minCc - padding && input.cc <= oil.maxCc + padding) return 0.5;
  return 0.1;
}

function getBudgetScore(oil: Oil, input: SawInput): number {
  const price = oil.price;
  let targetMin = 0;
  let targetMax = 9999999;
  
  if (input.budget === "Low") {
    targetMin = 25000;
    targetMax = 49999;
  } else if (input.budget === "Medium") {
    targetMin = 50000;
    targetMax = 79999;
  } else if (input.budget === "High") {
    targetMin = 80000;
  }

  if (price >= targetMin && price <= targetMax) return 1;
  // If slightly cheaper or slightly more expensive, give partial score
  if (price < targetMin) return 0.8; // Cheaper is usually still okay
  if (price > targetMax && price <= targetMax + 20000) return 0.5;
  return 0.2;
}

function getApiGradeScore(oil: Oil): number {
  return oil.apiGradeScore / 100; // normalize to 0-1
}

function getReputationScore(oil: Oil): number {
  return oil.rating / 5; // normalize to 0-1
}

export type SawResult = Oil & { sawScore: number };

export function calculateSawRecommendation(input: SawInput): SawResult[] {
  // Step 1: Create Decision Matrix & Normalization
  // In this simplified SAW, all criteria are "Benefit" criteria after our helper scoring logic
  // (meaning higher raw score is better). The helpers already normalize scores to 0-1.
  
  const results: SawResult[] = MOCK_OILS.map((oil) => {
    const c1 = getTransmissionScore(oil, input);
    const c2 = getCcScore(oil, input);
    const c3 = getBudgetScore(oil, input);
    const c4 = getApiGradeScore(oil);
    const c5 = getReputationScore(oil);

    // Filter out oils with mismatched transmission immediately if you want strict filtering,
    // but standard SAW just calculates scores. We will set transmission score to 0.
    
    // Step 2 & 3: Calculate Preference Value (Vi)
    const sawScore = 
      (c1 * WEIGHTS.transmissionMatch) +
      (c2 * WEIGHTS.ccMatch) +
      (c3 * WEIGHTS.budgetMatch) +
      (c4 * WEIGHTS.apiGrade) +
      (c5 * WEIGHTS.reputation);
      
    return {
      ...oil,
      sawScore: Number(sawScore.toFixed(3))
    };
  });

  // Strict filter: If transmission doesn't match at all, it's dangerous to use.
  // We filter them out before ranking.
  const filteredResults = results.filter(r => r.transmission === input.transmission);

  // Step 4: Ranking
  filteredResults.sort((a, b) => b.sawScore - a.sawScore);

  // Return Top 3
  return filteredResults.slice(0, 3);
}
