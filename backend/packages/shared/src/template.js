const tokenRegex = /{{\s*([a-zA-Z0-9_.\[\]]+)\s*}}/g;
const getPath = (payload, path) => {
    const normalized = path.replace(/\[(\d+)\]/g, '.$1');
    return normalized.split('.').reduce((acc, part) => {
        if (acc && typeof acc === 'object' && part in acc) {
            return acc[part];
        }
        return undefined;
    }, payload);
};
export const renderTemplate = (template, payload, strict = true) => {
    const missing = [];
    const rendered = template.replace(tokenRegex, (_, token) => {
        const value = getPath(payload, token);
        if (value === undefined || value === null) {
            missing.push(token);
            return strict ? '' : `{{${token}}}`;
        }
        return String(value);
    });
    return { rendered, missing: Array.from(new Set(missing)) };
};
export const findPlaceholders = (template) => {
    const matches = [...template.matchAll(tokenRegex)].map((m) => m[1]);
    return Array.from(new Set(matches));
};
