// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Polycode Limited
import { describe, test, expect } from "vitest";
import { main, getIdentity, name, version, description, fizzBuzz, fizzBuzzSingle } from "../../src/lib/main.js";

describe("Main Output", () => {
  test("should terminate without error", () => {
    process.argv = ["node", "src/lib/main.js"];
    main();
  });
});

describe("Library Identity", () => {
  test("exports name, version, and description", () => {
    expect(typeof name).toBe("string");
    expect(typeof version).toBe("string");
    expect(typeof description).toBe("string");
    expect(name.length).toBeGreaterThan(0);
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("getIdentity returns correct structure", () => {
    const identity = getIdentity();
    expect(identity).toEqual({ name, version, description });
  });
});

describe("fizzBuzzSingle", () => {
  test("returns Fizz for multiples of 3", () => {
    expect(fizzBuzzSingle(3)).toBe("Fizz");
    expect(fizzBuzzSingle(6)).toBe("Fizz");
    expect(fizzBuzzSingle(9)).toBe("Fizz");
    expect(fizzBuzzSingle(12)).toBe("Fizz");
    expect(fizzBuzzSingle(18)).toBe("Fizz");
  });

  test("returns Buzz for multiples of 5", () => {
    expect(fizzBuzzSingle(5)).toBe("Buzz");
    expect(fizzBuzzSingle(10)).toBe("Buzz");
    expect(fizzBuzzSingle(20)).toBe("Buzz");
    expect(fizzBuzzSingle(25)).toBe("Buzz");
  });

  test("returns FizzBuzz for multiples of both 3 and 5", () => {
    expect(fizzBuzzSingle(15)).toBe("FizzBuzz");
    expect(fizzBuzzSingle(30)).toBe("FizzBuzz");
    expect(fizzBuzzSingle(45)).toBe("FizzBuzz");
    expect(fizzBuzzSingle(60)).toBe("FizzBuzz");
  });

  test("returns the number as a string for non-multiples", () => {
    expect(fizzBuzzSingle(1)).toBe("1");
    expect(fizzBuzzSingle(2)).toBe("2");
    expect(fizzBuzzSingle(4)).toBe("4");
    expect(fizzBuzzSingle(7)).toBe("7");
    expect(fizzBuzzSingle(11)).toBe("11");
  });

  test("throws TypeError for non-number input", () => {
    expect(() => fizzBuzzSingle("3")).toThrow(TypeError);
    expect(() => fizzBuzzSingle(null)).toThrow(TypeError);
    expect(() => fizzBuzzSingle(undefined)).toThrow(TypeError);
    expect(() => fizzBuzzSingle(true)).toThrow(TypeError);
  });

  test("throws TypeError for non-integer input", () => {
    expect(() => fizzBuzzSingle(3.5)).toThrow(TypeError);
    expect(() => fizzBuzzSingle(1.1)).toThrow(TypeError);
    expect(() => fizzBuzzSingle(NaN)).toThrow(TypeError);
  });

  test("throws RangeError for non-positive integers", () => {
    expect(() => fizzBuzzSingle(0)).toThrow(RangeError);
    expect(() => fizzBuzzSingle(-1)).toThrow(RangeError);
    expect(() => fizzBuzzSingle(-10)).toThrow(RangeError);
  });
});

describe("fizzBuzz", () => {
  test("returns correct array for n=15", () => {
    const result = fizzBuzz(15);
    expect(result).toHaveLength(15);
    expect(result[14]).toBe("FizzBuzz");
    expect(result).toEqual([
      "1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz",
      "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"
    ]);
  });

  test("returns empty array for n=0", () => {
    expect(fizzBuzz(0)).toEqual([]);
  });

  test("returns single element array for n=1", () => {
    expect(fizzBuzz(1)).toEqual(["1"]);
  });

  test("returns correct array for n=5", () => {
    expect(fizzBuzz(5)).toEqual(["1", "2", "Fizz", "4", "Buzz"]);
  });

  test("returns correct array for n=3", () => {
    expect(fizzBuzz(3)).toEqual(["1", "2", "Fizz"]);
  });

  test("returns array of correct length", () => {
    expect(fizzBuzz(10)).toHaveLength(10);
    expect(fizzBuzz(20)).toHaveLength(20);
    expect(fizzBuzz(30)).toHaveLength(30);
  });

  test("throws TypeError for non-number input", () => {
    expect(() => fizzBuzz("15")).toThrow(TypeError);
    expect(() => fizzBuzz(null)).toThrow(TypeError);
    expect(() => fizzBuzz(undefined)).toThrow(TypeError);
  });

  test("throws TypeError for non-integer input", () => {
    expect(() => fizzBuzz(3.5)).toThrow(TypeError);
    expect(() => fizzBuzz(15.7)).toThrow(TypeError);
    expect(() => fizzBuzz(NaN)).toThrow(TypeError);
  });

  test("throws RangeError for negative integers", () => {
    expect(() => fizzBuzz(-1)).toThrow(RangeError);
    expect(() => fizzBuzz(-10)).toThrow(RangeError);
    expect(() => fizzBuzz(-100)).toThrow(RangeError);
  });

  test("all elements match fizzBuzzSingle output", () => {
    const result = fizzBuzz(15);
    for (let i = 0; i < 15; i++) {
      expect(result[i]).toBe(fizzBuzzSingle(i + 1));
    }
  });
});
