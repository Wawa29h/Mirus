const TWINMAP_DATABASE_PREFIX = "twinmap-db";

function getCollectionKey(collection) {
  const profile = window.TwinmapAuth?.getProfile?.();
  return profile
    ? `${TWINMAP_DATABASE_PREFIX}:${profile.id}:${collection}`
    : `${TWINMAP_DATABASE_PREFIX}:guest:${collection}`;
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function readCollection(collection, fallback = []) {
  try {
    const stored = localStorage.getItem(getCollectionKey(collection));
    if (!stored) return cloneData(fallback);

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : cloneData(fallback);
  } catch {
    return cloneData(fallback);
  }
}

function writeCollection(collection, records) {
  const safeRecords = Array.isArray(records) ? records : [];
  localStorage.setItem(getCollectionKey(collection), JSON.stringify(safeRecords));

  window.dispatchEvent(
    new CustomEvent("twinmap-database-change", {
      detail: { collection, records: cloneData(safeRecords) },
    }),
  );

  return cloneData(safeRecords);
}

function seedCollection(collection, fallback = []) {
  const key = getCollectionKey(collection);

  if (!localStorage.getItem(key)) {
    writeCollection(collection, fallback);
  }

  return readCollection(collection, fallback);
}

function hasCollection(collection) {
  return Boolean(localStorage.getItem(getCollectionKey(collection)));
}

function upsertRecord(collection, record, fallback = []) {
  const records = readCollection(collection, fallback);
  const index = records.findIndex((item) => item.id === record.id);

  if (index >= 0) {
    records[index] = { ...records[index], ...record };
  } else {
    records.unshift(record);
  }

  writeCollection(collection, records);
  return cloneData(record);
}

function hasRecord(collection, predicate, fallback = []) {
  return readCollection(collection, fallback).some(predicate);
}

window.TwinmapDatabase = {
  getAll: readCollection,
  saveAll: writeCollection,
  seed: seedCollection,
  hasCollection,
  upsert: upsertRecord,
  has: hasRecord,
};
