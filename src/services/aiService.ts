import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { PlanChecklistItem } from '@sidekit/shared';
import { config } from '../config';
import { getDeterministicTemplateItems } from './fallbackTemplates';

// Daily request counter
let dailyRequestCount = 0;
let lastResetDay = new Date().getUTCDate();

function checkAndIncrementCap(): boolean {
  const currentDay = new Date().getUTCDate();
  if (currentDay !== lastResetDay) {
    dailyRequestCount = 0;
    lastResetDay = currentDay;
  }
  if (dailyRequestCount >= config.geminiDailyCap) {
    return false;
  }
  dailyRequestCount++;
  return true;
}

// Zod schema for structured output validation
const GeneratedChecklistSchema = z.object({
  category: z.string(),
  items: z.array(
    z.object({
      itemKey: z.string(),
      name: z.string(),
      neededQuantity: z.number().int().positive(),
      reason: z.string(),
      isConsumable: z.boolean(),
    })
  ),
});

export async function interpretTaskWithGemini(
  taskDescription: string,
  clarifications?: Record<string, string>
): Promise<{ category: string; items: PlanChecklistItem[]; source: 'gemini' | 'template' }> {
  // If Gemini disabled or no API key, or daily cap reached -> fallback immediately
  if (!config.geminiEnabled || !config.geminiApiKey || !checkAndIncrementCap()) {
    const fallback = getDeterministicTemplateItems(taskDescription);
    return { ...fallback, source: 'template' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    const prompt = `
You are Sidekit's task planning expert for an apartment society in Bangalore, India.
Given a user's task description and optional constraints, generate a complete and pragmatic checklist of required equipment, tools, and consumables.
Distinguish reusable tools (e.g. drill machine, ladder, pressure washer) from consumables (e.g. wall plugs, screws, tape, paint, cloth).

Task: "${taskDescription}"
Clarifications: ${JSON.stringify(clarifications || {})}
`;

    // 10-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        abortSignal: controller.signal,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemKey: { type: Type.STRING },
                  name: { type: Type.STRING },
                  neededQuantity: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                  isConsumable: { type: Type.BOOLEAN },
                },
                required: ['itemKey', 'name', 'neededQuantity', 'reason', 'isConsumable'],
              },
            },
          },
          required: ['category', 'items'],
        },
      },
    });

    clearTimeout(timeout);

    const parsedText = response.text?.trim();
    if (!parsedText) {
      throw new Error('Empty response from Gemini');
    }

    const rawJson = JSON.parse(parsedText);
    const validated = GeneratedChecklistSchema.parse(rawJson);

    const items: PlanChecklistItem[] = validated.items.map((item, idx) => ({
      id: `ai_${Date.now()}_${idx}`,
      itemKey: item.itemKey.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: item.name,
      neededQuantity: Math.max(1, item.neededQuantity),
      ownedQuantity: 0,
      missingQuantity: Math.max(1, item.neededQuantity),
      reason: item.reason,
      isConsumable: item.isConsumable,
      safetyClass: item.isConsumable ? 'consumable' : 'none',
      source: 'ai_suggested',
    }));

    return {
      category: validated.category.toLowerCase(),
      items,
      source: 'gemini',
    };
  } catch (err) {
    // Log without exposing secrets and return deterministic fallback
    console.warn('Gemini interpretation failed or timed out. Falling back to deterministic templates:', (err as any)?.message);
    const fallback = getDeterministicTemplateItems(taskDescription);
    return { ...fallback, source: 'template' };
  }
}

