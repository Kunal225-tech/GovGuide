/**
 * Zero-dependency RFC-4180 compliant CSV parser for Node.js / TypeScript.
 * Handles quoted fields, escaped quotes (""), embedded commas, and multiline values.
 */

export interface ParsedCsvRow {
  [header: string]: string;
}

/**
 * Parses raw CSV text into an array of string-keyed row objects.
 */
export function parseCsvText(csvText: string): ParsedCsvRow[] {
  if (!csvText || typeof csvText !== "string" || !csvText.trim()) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  const length = csvText.length;
  let i = 0;

  while (i < length) {
    const char = csvText[i];
    const nextChar = i + 1 < length ? csvText[i + 1] : "";

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (!insideQuotes) {
      if (char === ",") {
        // End of field
        currentRow.push(currentField);
        currentField = "";
        i++;
        continue;
      } else if (char === "\r" && nextChar === "\n") {
        // Windows line ending
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
        i += 2;
        continue;
      } else if (char === "\n" || char === "\r") {
        // Unix or old Mac line ending
        currentRow.push(currentField);
        currentField = "";
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      }
    }

    currentField += char;
    i++;
  }

  // Push final field/row if any remaining
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out empty rows
  const cleanRows = rows.filter((r) => r.length > 0 && r.some((field) => field.trim().length > 0));

  if (cleanRows.length < 2) {
    return []; // No data rows
  }

  const headerRow = cleanRows[0].map((h) => h.trim());
  const dataRows = cleanRows.slice(1);

  const results: ParsedCsvRow[] = [];

  for (const row of dataRows) {
    const record: ParsedCsvRow = {};
    for (let h = 0; h < headerRow.length; h++) {
      const headerKey = headerRow[h];
      record[headerKey] = row[h] !== undefined ? row[h].trim() : "";
    }
    results.push(record);
  }

  return results;
}
