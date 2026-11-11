import Scheme, { IScheme } from "../models/Scheme";
import { NormalizedSchemeRecord } from "./types";

export type MatchClassification =
  | "NEW"
  | "EXACT_SOURCE_ID"
  | "EXACT_NAME"
  | "CONFLICT";

export interface DeduplicationResult {
  matchType: MatchClassification;
  existingScheme?: IScheme;
  conflictReason?: string;
}

/**
 * Calculates normalized string similarity using Levenshtein distance.
 * Returns a value between 0.0 (completely distinct) and 1.0 (identical).
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const longer = a.length > b.length ? a : b;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const costs: number[] = [];
  for (let i = 0; i <= a.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (a.charAt(i - 1) !== b.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[b.length] = lastValue;
  }

  return (longerLength - costs[b.length]) / longerLength;
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Safely evaluates incoming scheme record against existing schemes in MongoDB.
 * Adheres to conservative matching rules to protect existing data and references.
 */
export async function identifyDuplicate(
  incoming: NormalizedSchemeRecord
): Promise<DeduplicationResult> {
  // 1. Match by external source identifier (Highest reliability)
  if (incoming.sourceId && incoming.sourcePlatform) {
    const bySource = await Scheme.findOne({
      sourcePlatform: incoming.sourcePlatform,
      sourceId: incoming.sourceId,
    });
    if (bySource) {
      return {
        matchType: "EXACT_SOURCE_ID",
        existingScheme: bySource,
      };
    }
  }

  // 2. Match by exact scheme name (case-insensitive)
  const byExactName = await Scheme.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(incoming.name)}$`, "i") },
  });

  if (byExactName) {
    // Check for fundamental classification conflict
    const existingState = byExactName.state?.toLowerCase().trim();
    const incomingState = incoming.state?.toLowerCase().trim();

    if (
      byExactName.level === "state" &&
      incoming.level === "state" &&
      existingState &&
      incomingState &&
      existingState !== incomingState
    ) {
      return {
        matchType: "CONFLICT",
        existingScheme: byExactName,
        conflictReason: `Scheme with identical name '${incoming.name}' exists for state '${byExactName.state}', but incoming record specifies a different state '${incoming.state}'. Requires manual disambiguation.`,
      };
    }

    return {
      matchType: "EXACT_NAME",
      existingScheme: byExactName,
    };
  }

  // 3. Fuzzy matching for conflict detection (Ambiguous names)
  // Fetch existing schemes in the same sector category to compare similarity
  const candidates = await Scheme.find({ category: incoming.category }).select(
    "name level state category"
  );

  for (const candidate of candidates) {
    const similarity = calculateStringSimilarity(candidate.name, incoming.name);
    // If high similarity (> 0.85) but names are not identical
    if (similarity >= 0.85 && similarity < 1.0) {
      // Disambiguate legitimate sibling schemes with distinct sub-target keywords
      const distinctKeywords = [
        "upsc", "bpsc", "ebc", "sc", "st", "mahila", "yuva",
        "10th", "12th", "graduation", "matric", "inter", "boy", "girl"
      ];
      const aWords = incoming.name.toLowerCase().split(/\W+/);
      const bWords = candidate.name.toLowerCase().split(/\W+/);
      const hasDistinctDisambiguator = distinctKeywords.some(
        (kw) =>
          (aWords.includes(kw) && !bWords.includes(kw)) ||
          (!aWords.includes(kw) && bWords.includes(kw))
      );

      if (hasDistinctDisambiguator) {
        continue; // Legitimate distinct sibling scheme, not an ambiguous conflict
      }

      return {
        matchType: "CONFLICT",
        existingScheme: candidate,
        conflictReason: `Ambiguous match: Incoming scheme '${incoming.name}' is ${(
          similarity * 100
        ).toFixed(1)}% similar to existing scheme '${
          candidate.name
        }'. Held for review to prevent unintended overwrite.`,
      };
    }
  }

  // 4. Truly new scheme
  return {
    matchType: "NEW",
  };
}
