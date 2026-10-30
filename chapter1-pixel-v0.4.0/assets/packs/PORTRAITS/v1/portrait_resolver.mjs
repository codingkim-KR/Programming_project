/** Load portraits.json and expression_aliases.json relative to this module. */
export function resolvePortrait(portraits, aliases, characterId, expression='neutral') {
  const candidates=portraits.filter(p=>p.characterId===characterId);
  if (!candidates.length) return null;
  const exact=candidates.find(p=>p.expression===expression);
  if (exact) return exact;
  const mapped=aliases.characters?.[characterId]?.[expression];
  return candidates.find(p=>p.expression===mapped)
    ?? candidates.find(p=>p.expression===(aliases.defaultExpression??'neutral'))
    ?? null;
}
