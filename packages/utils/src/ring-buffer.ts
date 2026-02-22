export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private _size = 0;

  constructor(private readonly _capacity: number) {
    this.buffer = new Array(_capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this._capacity;
    this._size = Math.min(this._size + 1, this._capacity);
  }

  drain(): T[] {
    const result: T[] = [];
    const start = this._size < this._capacity ? 0 : this.head;
    for (let i = 0; i < this._size; i++) {
      const item = this.buffer[(start + i) % this._capacity];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  peek(): T | undefined {
    if (this._size === 0) return undefined;
    const idx = (this.head - 1 + this._capacity) % this._capacity;
    return this.buffer[idx];
  }

  clear(): void {
    this.buffer = new Array(this._capacity);
    this.head = 0;
    this._size = 0;
  }

  get size(): number {
    return this._size;
  }

  get capacity(): number {
    return this._capacity;
  }
}
