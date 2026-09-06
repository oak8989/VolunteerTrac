/**
 * In-browser TTL + LRU cache.
 *
 * Mirrors the Redis tier declared in docker-compose.yml (allkeys-lru, 64mb):
 * hot derived aggregates — org-wide hours, monthly series — are memoized here
 * so views can re-render at tick speed without recomputing the ledger.
 * Live stats (hits / misses / evictions / hit-rate) are surfaced on the
 * Admin → Deploy page.
 */

type Entry = { v: unknown; exp: number };

export class TTLCache {
  private map = new Map<string, Entry>();
  hits = 0;
  misses = 0;
  evictions = 0;

  constructor(private ttlMs = 30_000, private maxEntries = 128) {}

  get<T>(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > e.exp) {
      this.map.delete(key);
      this.misses++;
      this.evictions++;
      return undefined;
    }
    this.hits++;
    // refresh recency for LRU eviction order
    this.map.delete(key);
    this.map.set(key, e);
    return e.v as T;
  }

  set(key: string, value: unknown): void {
    if (!this.map.has(key) && this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) {
        this.map.delete(oldest);
        this.evictions++;
      }
    }
    this.map.set(key, { v: value, exp: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.map.clear();
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      entries: this.map.size,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
      ttlS: Math.round(this.ttlMs / 1000),
    };
  }
}

/** Singleton shared by every view — 30s TTL, 128-entry LRU. */
export const cache = new TTLCache(30_000, 128);

/** Get-or-compute helper. */
export function cached<T>(key: string, compute: () => T): T {
  const hit = cache.get<T>(key);
  if (hit !== undefined) return hit;
  const v = compute();
  cache.set(key, v);
  return v;
}
