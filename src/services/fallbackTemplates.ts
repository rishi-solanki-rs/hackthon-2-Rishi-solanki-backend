import { PlanChecklistItem, buildTemplateChecklist } from '@sidekit/shared';

/** Deterministic checklist used whenever Gemini is disabled, unavailable or returns unusable output. */
export function getDeterministicTemplateItems(taskDescription: string): {
  category: string;
  items: PlanChecklistItem[];
} {
  return buildTemplateChecklist(taskDescription);
}
