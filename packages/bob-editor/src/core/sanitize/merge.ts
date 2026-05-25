import type { Options as Schema } from 'rehype-sanitize';

/** Attributes that are always removed regardless of extensions. */
const LOCKED_BLOCKED_ATTRIBUTE_PATTERNS = [/^on/i];

/** Protocols that are always blocked. */
const LOCKED_BLOCKED_PROTOCOLS = ['javascript', 'vbscript', 'data'];

function unionArrays<T>(a: T[] | undefined, b: T[] | undefined): T[] {
  const result: T[] = [...(a ?? [])];
  for (const item of b ?? []) {
    if (!result.includes(item)) result.push(item);
  }
  return result;
}

function isLockedBlockedAttr(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  return LOCKED_BLOCKED_ATTRIBUTE_PATTERNS.some((re) => re.test(name));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AttributeMap = Record<string, any[]>;
type ProtocolMap = Record<string, string[]>;

function mergeAttributeMaps(
  base: AttributeMap | undefined,
  ext: AttributeMap | undefined,
): AttributeMap {
  if (!ext) return base ?? {};
  const result: AttributeMap = { ...(base ?? {}) };
  for (const [tag, attrs] of Object.entries(ext)) {
    result[tag] = unionArrays(result[tag], attrs);
  }
  return result;
}

function mergeProtocolMaps(
  base: ProtocolMap | undefined,
  ext: ProtocolMap | undefined,
): ProtocolMap {
  if (!ext) return base ?? {};
  const result: ProtocolMap = { ...(base ?? {}) };
  for (const [attr, protos] of Object.entries(ext)) {
    result[attr] = unionArrays(result[attr], protos);
  }
  return result;
}

function enforceLockedClauses(schema: Schema): Schema {
  if (schema.attributes) {
    const raw = schema.attributes as AttributeMap;
    const cleaned: AttributeMap = {};
    for (const [tag, attrs] of Object.entries(raw)) {
      cleaned[tag] = (attrs as unknown[]).filter((a) => !isLockedBlockedAttr(a));
    }
    schema.attributes = cleaned as Schema['attributes'];
  }

  if (schema.protocols) {
    const raw = schema.protocols as ProtocolMap;
    const cleanedProtos: ProtocolMap = {};
    for (const [attr, protos] of Object.entries(raw)) {
      cleanedProtos[attr] = protos.filter((p) => {
        const lower = p.toLowerCase();
        return !LOCKED_BLOCKED_PROTOCOLS.includes(lower);
      });
    }
    schema.protocols = cleanedProtos as Schema['protocols'];
  }

  return schema;
}

/**
 * Merges `ext` into `base` with property-level union semantics.
 * Locked clauses (on* attributes, javascript:/vbscript:/data: protocols)
 * are preserved after every merge.
 */
export function mergeSanitizeSchema(base: Schema, ext: Schema): Schema {
  const merged: Schema = {
    ...base,
    tagNames: unionArrays(base.tagNames ?? [], ext.tagNames ?? []).filter(
      (t) => t !== 'script' && t !== 'style',
    ),
    attributes: mergeAttributeMaps(
      base.attributes as AttributeMap,
      ext.attributes as AttributeMap,
    ) as Schema['attributes'],
    protocols: mergeProtocolMaps(
      base.protocols as ProtocolMap,
      ext.protocols as ProtocolMap,
    ) as Schema['protocols'],
    allowComments: base.allowComments === true ? true : (ext.allowComments ?? base.allowComments),
    allowDoctypes: base.allowDoctypes === true ? true : (ext.allowDoctypes ?? base.allowDoctypes),
  };

  return enforceLockedClauses(merged);
}
