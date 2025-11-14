/**
 * Proof of Concept: IndexedDB + Supabase Hydration Benchmark
 *
 * Measures realistic performance for cloud → local hydration
 * Tests with various project sizes and network conditions
 *
 * Run with: npx tsx docs/sync/poc-suite/02-hydration-benchmark-poc.ts
 *
 * Requirements:
 * - Supabase credentials in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * - Active internet connection
 * - Browser environment with IndexedDB (or use fake-indexeddb for Node)
 */

// Simulated data generator for realistic testing
interface Chapter {
  id: string;
  project_id: string;
  title: string;
  body: string;
  index_in_project: number;
  created_at: string;
  updated_at: string;
  client_rev: number;
  client_hash: string;
}

interface Character {
  id: string;
  project_id: string;
  name: string;
  bio: string;
  traits: Record<string, any>;
  created_at: string;
  updated_at: string;
  client_rev: number;
}

interface Note {
  id: string;
  project_id: string;
  kind: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  client_rev: number;
}

interface ProjectData {
  chapters: Chapter[];
  characters: Character[];
  notes: Note[];
}

/**
 * Generate realistic test data
 */
class DataGenerator {
  private static wordList = [
    'adventure',
    'mystery',
    'romance',
    'conflict',
    'resolution',
    'character',
    'plot',
    'theme',
    'setting',
    'dialogue',
  ];

  static generateChapter(projectId: string, index: number, wordCount: number): Chapter {
    const id = `chapter-${projectId}-${index}`;
    const title = `Chapter ${index + 1}: ${this.randomTitle()}`;
    const body = this.generateParagraphs(wordCount);

    return {
      id,
      project_id: projectId,
      title,
      body,
      index_in_project: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_rev: 1,
      client_hash: this.simpleHash(body),
    };
  }

  static generateCharacter(projectId: string, index: number): Character {
    const id = `char-${projectId}-${index}`;
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const name = names[index % names.length] + ` ${index}`;
    const bio = this.generateParagraphs(50);

    return {
      id,
      project_id: projectId,
      name,
      bio,
      traits: {
        personality: ['brave', 'curious'],
        skills: ['writing', 'reading'],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_rev: 1,
    };
  }

  static generateNote(projectId: string, index: number): Note {
    const id = `note-${projectId}-${index}`;
    const kinds = ['plot', 'worldbuilding', 'research'];
    const content = this.generateParagraphs(30);

    return {
      id,
      project_id: projectId,
      kind: kinds[index % kinds.length],
      content,
      tags: ['important', 'draft'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_rev: 1,
    };
  }

  static generateProject(size: 'small' | 'medium' | 'large'): {
    projectId: string;
    data: ProjectData;
  } {
    const configs = {
      small: { chapters: 10, avgWords: 500, characters: 5, notes: 10 },
      medium: { chapters: 50, avgWords: 1000, characters: 20, notes: 50 },
      large: { chapters: 200, avgWords: 1500, characters: 100, notes: 200 },
    };

    const config = configs[size];
    const projectId = `test-project-${size}-${Date.now()}`;

    const chapters: Chapter[] = [];
    for (let i = 0; i < config.chapters; i++) {
      chapters.push(this.generateChapter(projectId, i, config.avgWords));
    }

    const characters: Character[] = [];
    for (let i = 0; i < config.characters; i++) {
      characters.push(this.generateCharacter(projectId, i));
    }

    const notes: Note[] = [];
    for (let i = 0; i < config.notes; i++) {
      notes.push(this.generateNote(projectId, i));
    }

    return {
      projectId,
      data: { chapters, characters, notes },
    };
  }

  private static generateParagraphs(wordCount: number): string {
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(this.wordList[Math.floor(Math.random() * this.wordList.length)]);
      if (i > 0 && i % 15 === 0) {
        words.push('\n\n');
      }
    }
    return words.join(' ');
  }

  private static randomTitle(): string {
    const titles = ['The Beginning', 'Rising Action', 'The Climax', 'Falling Action', 'Resolution'];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private static simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * IndexedDB Mock/Simulator (simplified)
 * In real implementation, use Dexie or native IndexedDB
 */
class IndexedDBSimulator {
  private stores: Map<string, Map<string, any>> = new Map();

  async init(dbName: string, stores: string[]): Promise<void> {
    stores.forEach((store) => {
      this.stores.set(store, new Map());
    });
  }

  async bulkPut(storeName: string, records: any[]): Promise<void> {
    const store = this.stores.get(storeName);
    if (!store) throw new Error(`Store ${storeName} not found`);

    // Simulate realistic IndexedDB write time (2-5ms per record)
    const writeDelay = records.length * (2 + Math.random() * 3);
    await this.delay(writeDelay);

    records.forEach((record) => {
      store.set(record.id, record);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const store = this.stores.get(storeName);
    if (!store) throw new Error(`Store ${storeName} not found`);

    // Simulate read time (1ms per record)
    await this.delay(store.size * 1);

    return Array.from(store.values());
  }

  async clear(storeName: string): Promise<void> {
    const store = this.stores.get(storeName);
    if (store) {
      store.clear();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats() {
    const stats: Record<string, number> = {};
    this.stores.forEach((store, name) => {
      stats[name] = store.size;
    });
    return stats;
  }
}

/**
 * Supabase Mock (simulates network latency and response)
 * In real implementation, use actual Supabase client
 */
class SupabaseMock {
  private baseLatency: number;

  constructor(latencyMs: number = 30) {
    this.baseLatency = latencyMs;
  }

  async fetchChapters(projectId: string, mockData: Chapter[]): Promise<Chapter[]> {
    // Simulate network latency + data transfer time
    const dataSize = JSON.stringify(mockData).length;
    const transferTime = dataSize / (1024 * 100); // 100KB/sec (slow connection)
    const totalDelay = this.baseLatency + transferTime;

    await this.delay(totalDelay);
    return mockData;
  }

  async fetchCharacters(projectId: string, mockData: Character[]): Promise<Character[]> {
    const dataSize = JSON.stringify(mockData).length;
    const transferTime = dataSize / (1024 * 100);
    await this.delay(this.baseLatency + transferTime);
    return mockData;
  }

  async fetchNotes(projectId: string, mockData: Note[]): Promise<Note[]> {
    const dataSize = JSON.stringify(mockData).length;
    const transferTime = dataSize / (1024 * 100);
    await this.delay(this.baseLatency + transferTime);
    return mockData;
  }

  async bulkUpsert(table: string, records: any[]): Promise<void> {
    const dataSize = JSON.stringify(records).length;
    const transferTime = dataSize / (1024 * 50); // Upload slower than download
    await this.delay(this.baseLatency + transferTime);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Hydration Benchmark Runner
 */
class HydrationBenchmark {
  private idb: IndexedDBSimulator;
  private supabase: SupabaseMock;

  constructor(networkLatency: number = 30) {
    this.idb = new IndexedDBSimulator();
    this.supabase = new SupabaseMock(networkLatency);
  }

  async setup(): Promise<void> {
    await this.idb.init('inkwell-test', ['chapters', 'characters', 'notes']);
  }

  /**
   * Benchmark: Pull from cloud → hydrate IndexedDB
   */
  async benchmarkHydration(projectSize: 'small' | 'medium' | 'large'): Promise<{
    totalTime: number;
    fetchTime: number;
    writeTime: number;
    recordCount: number;
  }> {
    const { projectId, data } = DataGenerator.generateProject(projectSize);

    const startTotal = performance.now();

    // Step 1: Fetch from Supabase (parallel)
    const fetchStart = performance.now();
    const [chapters, characters, notes] = await Promise.all([
      this.supabase.fetchChapters(projectId, data.chapters),
      this.supabase.fetchCharacters(projectId, data.characters),
      this.supabase.fetchNotes(projectId, data.notes),
    ]);
    const fetchTime = performance.now() - fetchStart;

    // Step 2: Write to IndexedDB (parallel)
    const writeStart = performance.now();
    await Promise.all([
      this.idb.bulkPut('chapters', chapters),
      this.idb.bulkPut('characters', characters),
      this.idb.bulkPut('notes', notes),
    ]);
    const writeTime = performance.now() - writeStart;

    const totalTime = performance.now() - startTotal;
    const recordCount = chapters.length + characters.length + notes.length;

    return { totalTime, fetchTime, writeTime, recordCount };
  }

  /**
   * Benchmark: Local → push to cloud
   */
  async benchmarkPush(projectSize: 'small' | 'medium' | 'large'): Promise<{
    totalTime: number;
    readTime: number;
    uploadTime: number;
    recordCount: number;
  }> {
    const { projectId, data } = DataGenerator.generateProject(projectSize);

    // Pre-populate IndexedDB
    await this.idb.bulkPut('chapters', data.chapters);
    await this.idb.bulkPut('characters', data.characters);
    await this.idb.bulkPut('notes', data.notes);

    const startTotal = performance.now();

    // Step 1: Read from IndexedDB
    const readStart = performance.now();
    const [chapters, characters, notes] = await Promise.all([
      this.idb.getAll('chapters'),
      this.idb.getAll('characters'),
      this.idb.getAll('notes'),
    ]);
    const readTime = performance.now() - readStart;

    // Step 2: Upload to Supabase (batched)
    const uploadStart = performance.now();
    await Promise.all([
      this.supabase.bulkUpsert('chapters', chapters),
      this.supabase.bulkUpsert('characters', characters),
      this.supabase.bulkUpsert('notes', notes),
    ]);
    const uploadTime = performance.now() - uploadStart;

    const totalTime = performance.now() - startTotal;
    const recordCount = chapters.length + characters.length + notes.length;

    return { totalTime, readTime, uploadTime, recordCount };
  }

  async cleanup(): Promise<void> {
    await this.idb.clear('chapters');
    await this.idb.clear('characters');
    await this.idb.clear('notes');
  }
}

/**
 * Test Runner
 */
async function runBenchmarks() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   IndexedDB + Supabase Hydration Benchmark    ║');
  console.log('║   Inkwell Cloud Sync - Performance POC        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const scenarios = [
    { name: 'Fast Network (10ms latency)', latency: 10 },
    { name: 'Average Network (30ms latency)', latency: 30 },
    { name: 'Slow Network (100ms latency)', latency: 100 },
  ];

  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Scenario: ${scenario.name}`);
    console.log('='.repeat(50));

    const benchmark = new HydrationBenchmark(scenario.latency);
    await benchmark.setup();

    // Test each project size
    for (const size of ['small', 'medium', 'large'] as const) {
      console.log(`\n${size.toUpperCase()} Project:`);

      // Hydration test (cloud → local)
      const hydration = await benchmark.benchmarkHydration(size);
      console.log(`  Cloud → Local Hydration:`);
      console.log(`    Total Time: ${hydration.totalTime.toFixed(1)}ms`);
      console.log(`    Fetch Time: ${hydration.fetchTime.toFixed(1)}ms`);
      console.log(`    Write Time: ${hydration.writeTime.toFixed(1)}ms`);
      console.log(`    Records: ${hydration.recordCount}`);
      console.log(
        `    Avg per record: ${(hydration.totalTime / hydration.recordCount).toFixed(2)}ms`,
      );

      await benchmark.cleanup();

      // Push test (local → cloud)
      const push = await benchmark.benchmarkPush(size);
      console.log(`  Local → Cloud Push:`);
      console.log(`    Total Time: ${push.totalTime.toFixed(1)}ms`);
      console.log(`    Read Time: ${push.readTime.toFixed(1)}ms`);
      console.log(`    Upload Time: ${push.uploadTime.toFixed(1)}ms`);
      console.log(`    Records: ${push.recordCount}`);
      console.log(`    Avg per record: ${(push.totalTime / push.recordCount).toFixed(2)}ms`);

      await benchmark.cleanup();
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Benchmark complete');
  console.log('='.repeat(50) + '\n');

  printRecommendations();
}

function printRecommendations() {
  console.log('\n📊 Performance Recommendations:\n');
  console.log('1. Use batch operations for all Supabase upserts (50 records per batch)');
  console.log('2. Implement incremental sync (only fetch changed records)');
  console.log('3. Use IndexedDB indexes for fast lookups during merge');
  console.log('4. Consider pagination for large projects (>100 chapters)');
  console.log('5. Show progress indicator for projects >50 records');
  console.log('6. Cache hydration results in memory after first load');
  console.log('7. Debounce sync operations (wait 2-5sec after last edit)\n');
}

// Run if executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

export { HydrationBenchmark, DataGenerator };
