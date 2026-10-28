import { RepairEvaluationInput, RepairEvaluationResult } from '../types/plan';

export function calculateResidualValue(originalPrice: number, ageYears: number): number {
  if (originalPrice <= 0) return 0;
  // Standard 25% annual diminishing value depreciation
  const depreciationFactor = Math.pow(0.75, Math.max(0, ageYears));
  const estimated = Math.round(originalPrice * depreciationFactor);
  return Math.max(3000, estimated); // Minimum salvage value of ₹3,000 for parts
}

export function evaluateLaptopRepair(input: RepairEvaluationInput): RepairEvaluationResult {
  const { brand, model, originalPrice, ageYears, issue, batteryHealthPercent } = input;
  const residualValue = calculateResidualValue(originalPrice, ageYears);

  const issueLower = issue.toLowerCase();
  let costMin = 2500;
  let costMax = 5000;
  const reasons: string[] = [];
  let batteryAction: string | undefined;

  // Diagnostic heuristics
  if (issueLower.includes('screen') || issueLower.includes('display') || issueLower.includes('crack')) {
    costMin = 4000;
    costMax = 7500;
    reasons.push('Screen panel replacement requires OEM-compatible IPS display panel and 1-2 hours labour.');
  } else if (issueLower.includes('liquid') || issueLower.includes('water') || issueLower.includes('motherboard')) {
    costMin = 9000;
    costMax = 18000;
    reasons.push('Liquid damage or motherboard component failure carries high risk of repeated short circuits.');
  } else if (issueLower.includes('slow') || issueLower.includes('boot') || issueLower.includes('hdd') || issueLower.includes('lag')) {
    costMin = 2200;
    costMax = 3800;
    reasons.push('Converting from mechanical HDD to SATA/NVMe SSD will provide 5x-10x responsiveness boost at modest cost.');
  } else if (issueLower.includes('keyboard') || issueLower.includes('trackpad')) {
    costMin = 1800;
    costMax = 3200;
    reasons.push('Standard top-case or keyboard module replacement.');
  }

  // Battery health check
  if (batteryHealthPercent !== undefined && batteryHealthPercent < 60) {
    costMin += 2500;
    costMax += 4500;
    batteryAction = `Battery health is critically degraded at ${batteryHealthPercent}%. Replacing cells (approx. ₹2,500 - ₹4,500) will restore 4-6 hours battery life.`;
    reasons.push(batteryAction);
  }

  const avgRepairCost = Math.round((costMin + costMax) / 2);
  const repairRatio = Math.round((avgRepairCost / residualValue) * 100);

  // 50% Rule
  const shouldReplace = avgRepairCost > 0.5 * residualValue || ageYears >= 6;

  if (shouldReplace) {
    return {
      estimatedRepairCostMin: costMin,
      estimatedRepairCostMax: costMax,
      currentResidualValue: residualValue,
      repairRatioPercent: repairRatio,
      recommendation: 'replace',
      headline: `Replacement Recommended: Repair Cost (${repairRatio}% of value) Exceeds the 50% Rule`,
      reasons: [
        ...reasons,
        `Your ${brand} ${model} is approx. ${ageYears} years old with an estimated residual market value of ₹${residualValue.toLocaleString('en-IN')}.`,
        `Spending ₹${avgRepairCost.toLocaleString('en-IN')} is not economically sound because repair costs exceed 50% of its current machine value.`,
        `We recommend backing up your data and considering a reliable refurbished business laptop like the ThinkPad T480 available in our society.`,
      ],
      batteryAction,
      suggestedAlternativeListingId: 'lst_laptop_used',
    };
  }

  return {
    estimatedRepairCostMin: costMin,
    estimatedRepairCostMax: costMax,
    currentResidualValue: residualValue,
    repairRatioPercent: repairRatio,
    recommendation: 'repair',
    headline: `Repair Economically Sound: Estimated at ${repairRatio}% of Current Residual Value`,
    reasons: [
      ...reasons,
      `Your ${brand} ${model} retains approximately ₹${residualValue.toLocaleString('en-IN')} in value.`,
      `Estimated repair cost of ₹${avgRepairCost.toLocaleString('en-IN')} is comfortably below the 50% replacement threshold.`,
      `Repairing this laptop avoids e-waste and extends the machine lifespan by 2-3 years at fraction of replacement cost.`,
    ],
    batteryAction,
  };
}

