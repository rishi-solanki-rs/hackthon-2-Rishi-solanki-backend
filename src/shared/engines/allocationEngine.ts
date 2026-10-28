import { Request } from '../types/request';

/**
 * Checks if two half-open intervals [A1, B1) and [A2, B2) overlap.
 * In half-open intervals, an item returned at time T is immediately available at time T.
 */
export function intervalsOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean {
  const tStart1 = typeof start1 === 'string' ? new Date(start1).getTime() : start1.getTime();
  const tEnd1 = typeof end1 === 'string' ? new Date(end1).getTime() : end1.getTime();
  const tStart2 = typeof start2 === 'string' ? new Date(start2).getTime() : start2.getTime();
  const tEnd2 = typeof end2 === 'string' ? new Date(end2).getTime() : end2.getTime();

  // Overlap condition for [A1, B1) and [A2, B2):
  // max(A1, A2) < min(B1, B2)
  return Math.max(tStart1, tStart2) < Math.min(tEnd1, tEnd2);
}

/**
 * Calculates the peak allocated quantity for a listing over a target interval [T1, T2)
 * considering only active accepted/handed_over requests.
 */
export function getPeakAllocatedQuantity(
  activeRequests: Request[],
  targetStart: string | Date,
  targetEnd: string | Date
): number {
  const tStart = typeof targetStart === 'string' ? new Date(targetStart).getTime() : targetStart.getTime();
  const tEnd = typeof targetEnd === 'string' ? new Date(targetEnd).getTime() : targetEnd.getTime();

  if (tStart >= tEnd) {
    return 0;
  }

  // Filter to active requests that overlap with [targetStart, targetEnd)
  const overlapping = activeRequests.filter((r) => {
    if (r.status !== 'accepted' && r.status !== 'handed_over') {
      return false;
    }
    if (!r.neededFrom || !r.neededTo) {
      return false;
    }
    return intervalsOverlap(targetStart, targetEnd, r.neededFrom, r.neededTo);
  });

  if (overlapping.length === 0) {
    return 0;
  }

  // Collect all critical time boundaries within [tStart, tEnd]
  const timePoints = new Set<number>();
  timePoints.add(tStart);
  timePoints.add(tEnd);

  for (const r of overlapping) {
    const rStart = new Date(r.neededFrom!).getTime();
    const rEnd = new Date(r.neededTo!).getTime();
    if (rStart > tStart && rStart < tEnd) timePoints.add(rStart);
    if (rEnd > tStart && rEnd < tEnd) timePoints.add(rEnd);
  }

  const sortedPoints = Array.from(timePoints).sort((a, b) => a - b);
  let maxAllocated = 0;

  // Evaluate allocation in each sub-interval [sortedPoints[i], sortedPoints[i+1])
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const midPoint = (sortedPoints[i] + sortedPoints[i + 1]) / 2;
    let currentAllocated = 0;

    for (const r of overlapping) {
      const rStart = new Date(r.neededFrom!).getTime();
      const rEnd = new Date(r.neededTo!).getTime();
      if (midPoint >= rStart && midPoint < rEnd) {
        currentAllocated += r.requestedQuantity;
      }
    }

    if (currentAllocated > maxAllocated) {
      maxAllocated = currentAllocated;
    }
  }

  return maxAllocated;
}

/**
 * Calculates remaining available quantity for a listing during [targetStart, targetEnd).
 */
export function getAvailableQuantity(
  totalQuantity: number,
  activeRequests: Request[],
  targetStart: string | Date,
  targetEnd: string | Date
): number {
  const peakAllocated = getPeakAllocatedQuantity(activeRequests, targetStart, targetEnd);
  return Math.max(0, totalQuantity - peakAllocated);
}

/**
 * Checks if a target request can be accepted without exceeding total inventory.
 */
export function canAcceptRequest(
  totalQuantity: number,
  activeRequests: Request[],
  targetRequest: Request
): { canAccept: boolean; availableQuantity: number; reason?: string } {
  if (!targetRequest.neededFrom || !targetRequest.neededTo) {
    // For buy requests, assume perpetual consumption
    const currentlyAllocated = activeRequests
      .filter((r) => r.status === 'accepted' || r.status === 'handed_over')
      .reduce((sum, r) => sum + r.requestedQuantity, 0);
    const available = Math.max(0, totalQuantity - currentlyAllocated);
    return {
      canAccept: available >= targetRequest.requestedQuantity,
      availableQuantity: available,
      reason: available < targetRequest.requestedQuantity ? 'Insufficient total quantity' : undefined,
    };
  }

  const available = getAvailableQuantity(
    totalQuantity,
    activeRequests,
    targetRequest.neededFrom,
    targetRequest.neededTo
  );

  const canAccept = available >= targetRequest.requestedQuantity;
  return {
    canAccept,
    availableQuantity: available,
    reason: !canAccept
      ? `Only ${available} available for requested interval (requested ${targetRequest.requestedQuantity})`
      : undefined,
  };
}

/**
 * Determines which competing pending requests must be auto-declined when a target request is accepted.
 */
export function findCompetingRequestsToDecline(
  totalQuantity: number,
  currentActiveRequests: Request[],
  acceptedRequest: Request,
  allPendingRequests: Request[]
): Request[] {
  // New hypothetical active set including the accepted request
  const newActiveSet = [...currentActiveRequests, { ...acceptedRequest, status: 'accepted' as const }];

  const toDecline: Request[] = [];

  for (const pending of allPendingRequests) {
    if (pending.id === acceptedRequest.id) continue;

    if (!pending.neededFrom || !pending.neededTo) {
      // Perpetual
      const totalActive = newActiveSet.reduce((sum, r) => sum + r.requestedQuantity, 0);
      if (totalQuantity - totalActive < pending.requestedQuantity) {
        toDecline.push(pending);
      }
      continue;
    }

    const available = getAvailableQuantity(
      totalQuantity,
      newActiveSet,
      pending.neededFrom,
      pending.neededTo
    );

    if (available < pending.requestedQuantity) {
      toDecline.push(pending);
    }
  }

  return toDecline;
}

