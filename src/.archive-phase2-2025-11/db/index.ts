interface DBRecord extends Record<string, any> {
  id: string;
  name: string;
  ownerId?: string;
  profileId?: string;
  archivedAt?: string;
  createdAt?: Date;
  updatedAt?: Date;
  displayName?: string;
  color?: string;
  avatar?: string;
  description?: string;
  settings?: Record<string, any>;
}

// Simple in-memory storage for development
class Collection<T extends DBRecord> {
  private items = new Map<string, T>();

  async put(item: T): Promise<void> {
    this.items.set(item.id, item);
  }

  async add(item: T): Promise<void> {
    await this.put(item);
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Item ${id} not found`);
    await this.put({ ...existing, ...updates } as T);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  where(field: keyof T) {
    const collection = this;
    return {
      equals(value: any) {
        const results = Array.from(collection.items.values()).filter(
          (item) => item[field] === value,
        );
        return {
          filter(fn: (item: T) => boolean) {
            const filtered = results.filter(fn);
            return {
              async toArray() {
                return filtered;
              },
              async count() {
                return filtered.length;
              },
              async delete() {
                filtered.forEach((item) => collection.items.delete(item.id));
              },
            };
          },
          async toArray() {
            return results;
          },
          async count() {
            return results.length;
          },
          async delete() {
            results.forEach((item) => collection.items.delete(item.id));
          },
        };
      },
      async toArray() {
        return Array.from(collection.items.values());
      },
      async count() {
        return collection.items.size;
      },
      async delete() {
        collection.items.clear();
      },
    };
  }

  async get(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }
}

export const db = {
  profiles: new Collection<DBRecord>(),
  projects: new Collection<DBRecord>(),
  chapters: new Collection<DBRecord>(),
  timelineItems: new Collection<DBRecord>(),
  snapshots: new Collection<DBRecord>(),
  analytics: new Collection<DBRecord>(),
};
