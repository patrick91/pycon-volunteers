import * as SQLite from 'expo-sqlite';
import type { PersistentStorage } from 'apollo3-cache-persist/lib/types';
// Helper for comparing objects - install if needed: npm install fast-json-stable-stringify
// Or use a different deep comparison method if preferred.
import { equal } from 'fast-json-stable-stringify';

// Define the structure we store in the DB row
interface CacheEntityRecord {
  cache_key: string;
  typename: string;
  value: string; // JSON string of the individual entity
}

export class SQLiteEntityWrapper implements PersistentStorage<string | null> {
  private db: SQLite.SQLiteDatabase;
  private tableName = 'apollo_cache_entities'; // New table name
  private initialized = false;
  private readonly mainCacheKey: string; // The key apollo3-cache-persist uses

  // Pass the key that apollo3-cache-persist will use (usually 'apollo-cache-persist')
  constructor(mainCacheKey = 'apollo-cache-persist') {
    console.log('[SQLiteEntityWrapper] Initializing SQLite database');
    this.db = SQLite.openDatabaseSync('apollo_cache_entities.db'); // Use a different DB file potentially
    this.mainCacheKey = mainCacheKey;
    console.log(
      `[SQLiteEntityWrapper] Configured to intercept key: ${this.mainCacheKey}`,
    );
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      console.log(
        '[SQLiteEntityWrapper] Database not initialized, initializing now',
      );
      await this.initializeDatabase();
      this.initialized = true;
      console.log('[SQLiteEntityWrapper] Database initialization complete');
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log(
        `[SQLiteEntityWrapper] Creating table '${this.tableName}' if not exists`,
      );
      // Modified table schema
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          cache_key TEXT PRIMARY KEY NOT NULL,
          typename TEXT,
          value TEXT NOT NULL
        )`);
      console.log('[SQLiteEntityWrapper] Table creation successful');

      // Optional index
      await this.db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_typename
        ON ${this.tableName} (typename)`);
      console.log('[SQLiteEntityWrapper] Index creation successful');

      // Log count instead of keys for brevity
      const countResult = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${this.tableName}`,
      );
      console.log(
        `[SQLiteEntityWrapper] Found ${countResult?.count ?? 0} existing entities in database.`,
      );
    } catch (error) {
      console.error(
        '[SQLiteEntityWrapper] Error initializing database:',
        error,
      );
      throw error;
    }
  }

  // Intercepts getItem(mainCacheKey) -> Reconstructs the full cache string
  async getItem(key: string): Promise<string | null> {
    // We only respond to the key apollo3-cache-persist uses
    if (key !== this.mainCacheKey) {
      console.warn(
        `[SQLiteEntityWrapper] getItem called with unexpected key: ${key}. Returning null.`,
      );
      return null;
    }
    console.log(`[SQLiteEntityWrapper] Starting data fetch for key: ${key}`);
    await this.ensureInitialized();
    try {
      console.log(
        `[SQLiteEntityWrapper] Executing SQL query: SELECT cache_key, value FROM ${this.tableName}`,
      );
      const allEntities = await this.db.getAllAsync<CacheEntityRecord>(
        `SELECT cache_key, value FROM ${this.tableName}`,
      );

      if (!allEntities || allEntities.length === 0) {
        console.log('[SQLiteEntityWrapper] No entities found in DB.');
        return null; // No cache persisted yet
      }

      console.log(
        `[SQLiteEntityWrapper] Found ${allEntities.length} entities in DB. First few keys: ${allEntities
          .slice(0, 3)
          .map((e) => e.cache_key)
          .join(', ')}`,
      );
      const reconstructedCache: Record<string, unknown> = {};
      for (const entity of allEntities) {
        try {
          const parsedValue = JSON.parse(entity.value);
          reconstructedCache[entity.cache_key] = parsedValue;
          console.log(
            `[SQLiteEntityWrapper] Successfully parsed entity: ${entity.cache_key} (type: ${parsedValue?.__typename || 'unknown'})`,
          );
        } catch (parseError) {
          console.error(
            `[SQLiteEntityWrapper] Error parsing entity ${entity.cache_key}, skipping:`,
            parseError,
          );
          // Optionally delete corrupted data here: await this.db.runAsync(...)
        }
      }

      if (Object.keys(reconstructedCache).length === 0) {
        console.log(
          '[SQLiteEntityWrapper] Reconstruction resulted in empty cache (all entries failed parsing?).',
        );
        return null;
      }

      const finalJsonString = JSON.stringify(reconstructedCache);
      console.log(
        `[SQLiteEntityWrapper] Successfully reconstructed cache. Total keys: ${Object.keys(reconstructedCache).length}, Cache size: ${finalJsonString.length} bytes`,
      );
      return finalJsonString;
    } catch (error) {
      console.error(
        `[SQLiteEntityWrapper] Error reconstructing cache for key ${key}:`,
        error,
      );
      return null; // Let apollo3-cache-persist handle the cache miss
    }
  }

  // Intercepts setItem(mainCacheKey, fullCacheJson) -> Stores individual entities
  async setItem(key: string, value: string | null): Promise<void> {
    // We only respond to the key apollo3-cache-persist uses
    if (key !== this.mainCacheKey) {
      console.warn(
        `[SQLiteEntityWrapper] setItem called with unexpected key: ${key}. Doing nothing.`,
      );
      return;
    }

    if (value === null) {
      // If apollo-cache-persist sets null, it means purge (handled by removeItem)
      // Or potentially an error condition? We'll treat it like purge here.
      console.log(
        `[SQLiteEntityWrapper] setItem called with null value for key ${key}. Purging entities.`,
      );
      await this.removeItem(key); // Delegate to removeItem's logic
      return;
    }

    console.log(
      `[SQLiteEntityWrapper] Intercepting setItem for key: ${key}. Processing full cache JSON (Length: ${value.length}).`,
    );
    await this.ensureInitialized();

    let incomingCache: Record<string, any>;
    try {
      incomingCache = JSON.parse(value);
      if (typeof incomingCache !== 'object' || incomingCache === null) {
        throw new Error('Parsed value is not an object');
      }
    } catch (parseError) {
      console.error(
        '[SQLiteEntityWrapper] Failed to parse incoming cache JSON string in setItem:',
        parseError,
      );
      // Decide strategy: maybe purge? Or just return? Purging might be safer.
      await this.removeItem(key);
      throw new Error('Failed to parse incoming cache JSON, purged storage.'); // Propagate error
    }

    try {
      console.log('[SQLiteEntityWrapper] Starting transaction for update...');
      // --- Perform Diff and Update within a Transaction ---
      // This part requires careful implementation for efficiency
      // Simplified approach: Get all current keys, then diff

      const existingEntities = await this.db.getAllAsync<CacheEntityRecord>(
        `SELECT cache_key, value FROM ${this.tableName}`,
      );
      const existingMap = new Map<string, string>(
        existingEntities.map((e) => [e.cache_key, e.value]),
      );
      const incomingKeys = new Set(Object.keys(incomingCache));
      const existingKeys = new Set(existingMap.keys());

      const toAddOrUpdate: CacheEntityRecord[] = [];
      const toDelete: string[] = [];

      console.log('🐦‍🔥');

      // Find keys to add or update
      for (const entityKey of incomingKeys) {
        const entityObject = incomingCache[entityKey];
        const entityJson = JSON.stringify(entityObject);
        const existingJson = existingMap.get(entityKey);

        // Add if new, or update if content differs (use deep comparison or rely on string compare)
        if (!existingJson || existingJson !== entityJson) {
          // Note: Simple string comparison is faster but less robust than deep object compare
          // If objects might be stringified differently but be semantically equal, use `equal()`
          // if (!existingJson || !equal(JSON.parse(existingJson), entityObject)) {
          const typename =
            entityObject?.__typename ||
            (entityKey === 'ROOT_QUERY' ? 'Query' : 'Unknown');
          toAddOrUpdate.push({
            cache_key: entityKey,
            typename: typename || 'Unknown', // Ensure typename is never undefined
            value: entityJson,
          });
        }
      }

      // Find keys to delete
      for (const entityKey of existingKeys) {
        if (!incomingKeys.has(entityKey)) {
          toDelete.push(entityKey);
        }
      }

      if (toAddOrUpdate.length === 0 && toDelete.length === 0) {
        console.log(
          '[SQLiteEntityWrapper] No changes detected, skipping DB writes.',
        );
        // No need to run transaction if nothing changed
        return;
      }

      console.log(
        `[SQLiteEntityWrapper] Changes: ${toAddOrUpdate.length} add/update, ${toDelete.length} delete.`,
      );
      console.log('🐦‍🔥🐦‍🔥');

      // Start transaction
      await this.db.runAsync('BEGIN TRANSACTION');

      try {
        console.log('[SQLiteEntityWrapper] Executing add/update operations...');
        for (const record of toAddOrUpdate) {
          const safeRecord = record;
          console.log(safeRecord);
          try {
            await this.db.runAsync(
              `INSERT OR REPLACE INTO ${this.tableName} (cache_key, typename, value) VALUES (?, ?, ?)`,
              [safeRecord.cache_key, safeRecord.typename, safeRecord.value],
            );
          } catch (error) {
            console.error(
              '[SQLiteEntityWrapper] Error adding/updating entity:',
              error,
            );
          }
        }

        console.log('[SQLiteEntityWrapper] Executing delete operations...');
        if (toDelete.length > 0) {
          const placeholders = toDelete.map(() => '?').join(',');
          try {
            await this.db.runAsync(
              `DELETE FROM ${this.tableName} WHERE cache_key IN (${placeholders})`,
              toDelete,
            );
          } catch (error) {
            console.error(
              '[SQLiteEntityWrapper] Error deleting entity:',
              error,
            );
          }
        }

        // Commit transaction
        await this.db.runAsync('COMMIT');
      } catch (error) {
        // Rollback transaction on error
        await this.db.runAsync('ROLLBACK');
        throw error;
      }

      console.log(
        '[SQLiteEntityWrapper] Entity update transaction successful.',
      );
    } catch (error) {
      console.error(
        '[SQLiteEntityWrapper] Error processing entities in setItem:',
        error,
      );
      // Don't re-throw generally, let the app continue, but cache might be inconsistent
    }
  }

  // Intercepts removeItem(mainCacheKey) -> Deletes all entities
  async removeItem(key: string): Promise<void> {
    // We only respond to the key apollo3-cache-persist uses
    if (key !== this.mainCacheKey) {
      console.warn(
        `[SQLiteEntityWrapper] removeItem called with unexpected key: ${key}. Doing nothing.`,
      );
      return;
    }
    console.log(
      `[SQLiteEntityWrapper] Intercepting removeItem for key: ${key}. Deleting all entities.`,
    );
    await this.ensureInitialized();
    try {
      await this.db.runAsync(`DELETE FROM ${this.tableName}`);
      console.log('[SQLiteEntityWrapper] All entities deleted successfully.');
    } catch (error) {
      console.error(
        '[SQLiteEntityWrapper] Error deleting all entities:',
        error,
      );
      // Don't re-throw, apollo3-cache-persist called this to clear anyway.
    }
  }

  // --- Helper for Direct Querying (Example) ---
  async getAllEntitiesByTypename(
    typename: string,
  ): Promise<Record<string, any>[]> {
    console.log(`[SQLiteEntityWrapper] Direct fetch for typename: ${typename}`);
    await this.ensureInitialized();
    try {
      const results = await this.db.getAllAsync<CacheEntityRecord>(
        `SELECT value FROM ${this.tableName} WHERE typename = ?`,
        [typename],
      );
      console.log(
        `[SQLiteEntityWrapper] Found ${results.length} entities for typename ${typename}.`,
      );
      return results.map((row) => JSON.parse(row.value));
    } catch (error) {
      console.error(
        `[SQLiteEntityWrapper] Error in direct fetch for typename ${typename}:`,
        error,
      );
      return [];
    }
  }
}
