import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../ring-buffer';

describe('RingBuffer', () => {
  it('starts empty', () => {
    const buf = new RingBuffer<number>(5);
    expect(buf.size).toBe(0);
    expect(buf.capacity).toBe(5);
    expect(buf.drain()).toEqual([]);
    expect(buf.peek()).toBeUndefined();
  });

  it('tracks size correctly on push', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    expect(buf.size).toBe(1);
    buf.push(2);
    expect(buf.size).toBe(2);
    buf.push(3);
    expect(buf.size).toBe(3);
  });

  it('drains items in insertion order', () => {
    const buf = new RingBuffer<string>(5);
    buf.push('a');
    buf.push('b');
    buf.push('c');
    expect(buf.drain()).toEqual(['a', 'b', 'c']);
  });

  it('wraps around when capacity exceeded', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4); // overwrites 1
    buf.push(5); // overwrites 2
    expect(buf.size).toBe(3);
    expect(buf.drain()).toEqual([3, 4, 5]);
  });

  it('peek returns most recently pushed item', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(10);
    expect(buf.peek()).toBe(10);
    buf.push(20);
    expect(buf.peek()).toBe(20);
  });

  it('peek returns correct item after wrap', () => {
    const buf = new RingBuffer<number>(2);
    buf.push(1);
    buf.push(2);
    buf.push(3); // wraps
    expect(buf.peek()).toBe(3);
  });

  it('clear resets the buffer', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.size).toBe(0);
    expect(buf.drain()).toEqual([]);
    expect(buf.peek()).toBeUndefined();
  });

  it('works correctly after clear and re-push', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.clear();
    buf.push(10);
    expect(buf.size).toBe(1);
    expect(buf.drain()).toEqual([10]);
  });

  it('handles capacity of 1', () => {
    const buf = new RingBuffer<string>(1);
    buf.push('a');
    expect(buf.drain()).toEqual(['a']);
    buf.push('b');
    expect(buf.drain()).toEqual(['b']);
    expect(buf.size).toBe(1);
  });
});
