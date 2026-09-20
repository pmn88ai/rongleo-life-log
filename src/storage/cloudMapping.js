// Local domain objects are camelCase; Supabase columns are snake_case.
// Keeping the mapping in one place is what lets domain code (eventService,
// selectors, statistics — spec §15) stay completely unaware of Supabase.

export function eventToCloudRow(event, userId) {
  return {
    id: event.id,
    user_id: userId,
    event_definition_id: event.eventDefinitionId,
    timestamp: event.timestamp,
    value: event.value ?? null,
    unit: event.unit ?? null,
    duration_seconds: event.durationSeconds ?? null,
    rating: event.rating ?? null,
    note: event.note || '',
    name_snapshot: event.nameSnapshot,
    emoji_snapshot: event.emojiSnapshot,
    category_snapshot: event.categorySnapshot ?? null,
    created_at: event.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function eventFromCloudRow(row) {
  return {
    id: row.id,
    eventDefinitionId: row.event_definition_id,
    timestamp: row.timestamp,
    value: row.value,
    unit: row.unit,
    durationSeconds: row.duration_seconds,
    rating: row.rating,
    note: row.note || '',
    nameSnapshot: row.name_snapshot,
    emojiSnapshot: row.emoji_snapshot,
    categorySnapshot: row.category_snapshot,
    createdAt: row.created_at,
  };
}

export function definitionToCloudRow(def, userId) {
  return {
    id: def.id,
    user_id: userId,
    name: def.name,
    emoji: def.emoji,
    category: def.category,
    type: def.type,
    unit: def.unit ?? null,
    default_value: def.defaultValue ?? null,
    aliases: def.aliases || [],
    favorite: !!def.favorite,
    active: def.active !== false,
    created_at: def.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function definitionFromCloudRow(row) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    category: row.category,
    type: row.type,
    unit: row.unit,
    defaultValue: row.default_value,
    aliases: row.aliases || [],
    favorite: row.favorite,
    active: row.active,
    createdAt: row.created_at,
  };
}
