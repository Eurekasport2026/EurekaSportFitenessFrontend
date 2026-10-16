import contract from "./portal-contracts.json";

type Schema = {
  $ref?: string; type?: string; const?: unknown; enum?: unknown[];
  anyOf?: Schema[]; allOf?: Schema[]; properties?: Record<string, Schema>; required?: string[];
  items?: Schema; additionalProperties?: boolean | Schema;
  minimum?: number; maximum?: number; exclusiveMinimum?: number; exclusiveMaximum?: number;
  minLength?: number; maxLength?: number; minItems?: number; maxItems?: number;
  pattern?: string; format?: string;
};
const definitions = contract.definitions as Record<string, Schema>;

function textLength(value: string) {
  let count = 0;
  for (const character of value) { void character; count++; }
  return count;
}

function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Validate the JSON Schema subset emitted by our backend response models. */
function matches(value: unknown, schema: Schema, depth = 0): boolean {
  if (depth > 40) return false;
  if (schema.$ref) {
    const resolved = definitions[schema.$ref.split("/").at(-1) ?? ""];
    return Boolean(resolved && matches(value, resolved, depth + 1));
  }
  if (schema.anyOf && !schema.anyOf.some(item => matches(value, item, depth + 1))) return false;
  if (schema.allOf && !schema.allOf.every(item => matches(value, item, depth + 1))) return false;
  if ("const" in schema && value !== schema.const) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  switch (schema.type) {
    case "null": return value === null;
    case "boolean": return typeof value === "boolean";
    case "integer":
    case "number":
      return typeof value === "number" && Number.isFinite(value) && (schema.type !== "integer" || Number.isSafeInteger(value)) &&
        (schema.minimum === undefined || value >= schema.minimum) && (schema.maximum === undefined || value <= schema.maximum) &&
        (schema.exclusiveMinimum === undefined || value > schema.exclusiveMinimum) && (schema.exclusiveMaximum === undefined || value < schema.exclusiveMaximum);
    case "string":
      return typeof value === "string" && (schema.minLength === undefined || textLength(value) >= schema.minLength) &&
        (schema.maxLength === undefined || textLength(value) <= schema.maxLength) && (!schema.pattern || new RegExp(schema.pattern).test(value)) &&
        (schema.format !== "uuid" || /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) &&
        (schema.format !== "date-time" || Number.isFinite(Date.parse(value))) &&
        (schema.format !== "date" || calendarDate(value)) &&
        (schema.format !== "email" || /^[^\s@]+@[^\s@]+$/.test(value));
    case "array":
      return Array.isArray(value) && (schema.minItems === undefined || value.length >= schema.minItems) &&
        (schema.maxItems === undefined || value.length <= schema.maxItems) && value.every(item => !schema.items || matches(item, schema.items, depth + 1));
    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const record = value as Record<string, unknown>;
      if (schema.required?.some(key => !Object.hasOwn(record, key))) return false;
      return Object.entries(record).every(([key, item]) => {
        const field = Object.hasOwn(schema.properties ?? {}, key) ? schema.properties?.[key] : undefined;
        return field ? matches(item, field, depth + 1) : schema.additionalProperties !== false &&
          (typeof schema.additionalProperties !== "object" || matches(item, schema.additionalProperties, depth + 1));
      });
    }
    default: return true;
  }
}

export function validPortalResponse(path: string, method: string, payload: unknown): payload is { success: true; data: unknown } {
  const segments = path.split("?")[0].split("/");
  const route = contract.routes.find(route => {
    const template = route.path.split("/");
    return route.method === method && segments.length === template.length && template.every((part, i) =>
      part.startsWith("{") ? Boolean(segments[i]) : part === segments[i]);
  });
  return Boolean(route && matches(payload, route.schema));
}
