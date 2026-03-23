import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function extractJSON(text: string): any {
  if (!text || typeof text !== 'string') return null;

  // 1. Direct parse — if it IS valid JSON already
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
  } catch { /* fall through */ }

  // 2. Extract from markdown code block ```json ... ```
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    try { return JSON.parse(jsonBlockMatch[1].trim()); } catch { /* fall through */ }
  }

  // 3. Extract from any ``` ... ``` code block
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch { /* fall through */ }
  }

  // 4. Find the outermost { } object in the string
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch { /* fall through */ }
  }

  console.error("extractJSON: Could not parse JSON from text:", text.slice(0, 300) + '...');
  return null;
}

export const generateUUID = () => crypto.randomUUID();
