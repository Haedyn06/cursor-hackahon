function repairTruncatedJson(input: string): string {
  let text = input.trim();

  text = text.replace(/,\s*"[^"]*":\s*"[^"]*$/, "");
  text = text.replace(/,\s*"[^"]*":\s*[^,\}\]]*$/, "");
  text = text.replace(/,\s*"[^"]*$/, "");
  text = text.replace(/,\s*$/, "");

  const stack: Array<"{" | "["> = [];
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") stack.push("{");
    if (char === "[") stack.push("[");
    if (char === "}" && stack.at(-1) === "{") stack.pop();
    if (char === "]" && stack.at(-1) === "[") stack.pop();
  }

  if (inString) {
    text += '"';
  }

  while (stack.length > 0) {
    const open = stack.pop();
    text += open === "{" ? "}" : "]";
  }

  return text;
}

function extractBalancedJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return text.slice(start);
}

export function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [
    trimmed,
    fenced?.[1]?.trim(),
    extractBalancedJsonObject(trimmed),
  ].filter((value): value is string => Boolean(value?.trim()));

  const seen = new Set<string>();
  const errors: string[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);

    try {
      return JSON.parse(candidate);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Invalid JSON");
    }

    try {
      return JSON.parse(repairTruncatedJson(candidate));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Invalid JSON");
    }
  }

  throw new Error(
    errors[0] ?? "AI response was not valid JSON. Try again or switch providers.",
  );
}
