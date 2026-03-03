const tokenRegex = /{{\s*([a-zA-Z0-9_.\[\]]+)\s*}}/g;

const getPath = (payload: Record<string, unknown>, path: string): unknown => {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, payload);
};

export interface RenderResult {
  rendered: string;
  missing: string[];
}

export const renderTemplate = (template: string, payload: Record<string, unknown>, strict = true): RenderResult => {
  const missing: string[] = [];

  const rendered = template.replace(tokenRegex, (_, token: string) => {
    const value = getPath(payload, token);
    if (value === undefined || value === null) {
      missing.push(token);
      return strict ? '' : `{{${token}}}`;
    }
    return String(value);
  });

  return { rendered, missing: Array.from(new Set(missing)) };
};

export const findPlaceholders = (template: string): string[] => {
  const matches = [...template.matchAll(tokenRegex)].map((m) => m[1]);
  return Array.from(new Set(matches));
};
