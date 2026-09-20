import { cloudRepository } from './cloudRepository.js';
import { uid } from '../utils/id.js';

// A persisted outbox: local writes are never blocked on the network (spec
// §16 "USER TAPS 💩 → local event created → Today Stream updates
// immediately → sync queue → Supabase insert"). Every enqueued op survives
// a reload, and is retried whenever the app comes back online — offline
// admin capture (spec §18) just means the queue grows until reconnection.
const QUEUE_KEY = 'rongleo_life_log_sync_queue';

function loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // best-effort — a full quota here shouldn't crash capture
  }
}

let queue = loadQueue();
let flushing = false;
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(queue.length);
}

export const syncQueue = {
  subscribe(fn) {
    listeners.add(fn);
    fn(queue.length);
    return () => listeners.delete(fn);
  },
  getPendingCount() {
    return queue.length;
  },
  enqueue(op) {
    queue.push({ id: uid(), attempts: 0, ...op });
    saveQueue(queue);
    notify();
  },
  clear() {
    queue = [];
    saveQueue(queue);
    notify();
  },
  async flush(userId) {
    if (flushing || !userId || queue.length === 0) return;
    flushing = true;
    const remaining = [];
    for (const item of queue) {
      try {
        await applyOp(item, userId);
      } catch (err) {
        console.error('Sync thất bại, sẽ thử lại sau:', err);
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    }
    queue = remaining;
    saveQueue(queue);
    flushing = false;
    notify();
  },
};

async function applyOp(item, userId) {
  if (item.kind === 'definition') {
    if (item.op === 'upsert') await cloudRepository.upsertDefinition(item.payload, userId);
    else await cloudRepository.deleteDefinition(item.payload.id, userId);
  } else {
    if (item.op === 'upsert') await cloudRepository.upsertEvent(item.payload, userId);
    else await cloudRepository.deleteEvent(item.payload.id, userId);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // App.jsx's sync effect owns calling flush with the current userId;
    // this just makes sure a reconnect is noticed promptly by re-notifying
    // listeners so the "Đang chờ đồng bộ" badge can react immediately.
    notify();
  });
}
