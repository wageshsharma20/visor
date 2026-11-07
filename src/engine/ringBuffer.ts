/**
 * Fixed-capacity circular ring buffer for capping memory growth.
 * No React dependencies.
 */
export class RingBuffer<T> {
  readonly capacity: number;
  private buffer: Array<T | undefined>;
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be greater than zero.');
    }
    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  /**
   * Push an item to the end of the buffer. Drops the oldest item if capacity is exceeded.
   */
  push(item: T): void {
    const index = (this.head + this.count) % this.capacity;
    if (this.count === this.capacity) {
      this.buffer[this.head] = item;
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.buffer[index] = item;
      this.count++;
    }
  }

  /**
   * Returns elements in chronological order (oldest to newest).
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.capacity;
      const item = this.buffer[idx];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get the item at index (0 = oldest, size - 1 = newest).
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) return undefined;
    const idx = (this.head + index) % this.capacity;
    return this.buffer[idx];
  }

  /**
   * Most recently added item.
   */
  newest(): T | undefined {
    if (this.count === 0) return undefined;
    const idx = (this.head + this.count - 1) % this.capacity;
    return this.buffer[idx];
  }

  /**
   * Oldest remaining item.
   */
  oldest(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buffer[this.head];
  }

  get size(): number {
    return this.count;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }

  clear(): void {
    this.buffer = new Array<T | undefined>(this.capacity);
    this.head = 0;
    this.count = 0;
  }
}
