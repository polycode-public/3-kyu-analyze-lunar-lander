// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Polycode Limited
import { describe, test, expect } from "vitest";
import { main, getIdentity, name, version, description, createState, step, simulate, score } from "../../src/lib/main.js";

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

describe("Lander State", () => {
  test("createState with defaults", () => {
    const state = createState();
    expect(state).toEqual({
      altitude: 1000,
      velocity: 40,
      fuel: 25,
      tick: 0,
      landed: false,
      crashed: false,
    });
  });

  test("createState with custom options", () => {
    const state = createState({ altitude: 500, velocity: 30, fuel: 20 });
    expect(state).toEqual({
      altitude: 500,
      velocity: 30,
      fuel: 20,
      tick: 0,
      landed: false,
      crashed: false,
    });
  });

  test("createState with partial options", () => {
    const state = createState({ fuel: 15 });
    expect(state.altitude).toBe(1000);
    expect(state.velocity).toBe(40);
    expect(state.fuel).toBe(15);
  });
});

describe("Physics: step", () => {
  test("step applies gravity without thrust", () => {
    const state = createState({ altitude: 1000, velocity: 0, fuel: 25 });
    const next = step(state, 0);
    expect(next.velocity).toBe(2);
    expect(next.altitude).toBe(998);
    expect(next.fuel).toBe(25);
    expect(next.tick).toBe(1);
  });

  test("step applies gravity and thrust", () => {
    const state = createState({ altitude: 1000, velocity: 0, fuel: 25 });
    const next = step(state, 1);
    expect(next.velocity).toBe(2 - 4);
    expect(next.velocity).toBe(-2);
    expect(next.altitude).toBe(1000 - (-2));
    expect(next.altitude).toBe(1002);
    expect(next.fuel).toBe(24);
  });

  test("step clamps thrust to available fuel", () => {
    const state = createState({ altitude: 1000, velocity: 0, fuel: 2 });
    const next = step(state, 10);
    expect(next.fuel).toBe(0);
    expect(next.velocity).toBe(2 - 4 * 2);
    expect(next.velocity).toBe(-6);
  });

  test("step clamps negative thrust to zero", () => {
    const state = createState({ altitude: 1000, velocity: 0, fuel: 25 });
    const next = step(state, -5);
    expect(next.fuel).toBe(25);
    expect(next.velocity).toBe(2);
  });

  test("step handles non-integer thrust input", () => {
    const state = createState({ altitude: 1000, velocity: 0, fuel: 25 });
    const next = step(state, 2.7);
    expect(next.fuel).toBe(23);
    expect(next.velocity).toBe(2 - 4 * 2);
  });

  test("landing: velocity exactly 4 lands safely", () => {
    const state = createState({ altitude: 2, velocity: 2, fuel: 25 });
    const next = step(state, 0);
    expect(next.altitude).toBe(0);
    expect(next.velocity).toBe(4);
    expect(next.landed).toBe(true);
    expect(next.crashed).toBe(false);
  });

  test("landing: velocity 5 crashes", () => {
    const state = createState({ altitude: 3, velocity: 3, fuel: 25 });
    const next = step(state, 0);
    expect(next.altitude).toBe(0);
    expect(next.velocity).toBe(5);
    expect(next.crashed).toBe(true);
    expect(next.landed).toBe(false);
  });

  test("step returns copy when already landed", () => {
    const landed = createState();
    landed.landed = true;
    const next = step(landed, 5);
    expect(next).toEqual(landed);
    expect(next).not.toBe(landed);
  });

  test("step returns copy when already crashed", () => {
    const crashed = createState();
    crashed.crashed = true;
    const next = step(crashed, 5);
    expect(next).toEqual(crashed);
    expect(next).not.toBe(crashed);
  });
});

describe("Simulation: simulate", () => {
  test("simulate with zero thrust controller crashes", () => {
    const state = createState({ altitude: 100, velocity: 0, fuel: 25 });
    const trace = simulate(state, () => 0);
    expect(Array.isArray(trace)).toBe(true);
    expect(trace.length).toBeGreaterThan(1);
    expect(trace[0]).toEqual(state);
    const final = trace[trace.length - 1];
    expect(final.altitude).toBe(0);
    expect(final.crashed).toBe(true);
  });

  test("simulate returns complete trace from start to landing", () => {
    const state = createState({ altitude: 50, velocity: 0, fuel: 25 });
    const trace = simulate(state, () => 0);
    expect(trace[0]).toEqual(state);
    expect(trace.length).toBeGreaterThanOrEqual(2);
    const final = trace[trace.length - 1];
    expect(final.landed || final.crashed).toBe(true);
  });

  test("simulate with constant thrust controller", () => {
    const state = createState({ altitude: 100, velocity: 0, fuel: 25 });
    const trace = simulate(state, () => 1);
    expect(trace[0]).toEqual(state);
    const final = trace[trace.length - 1];
    expect(final.altitude).toBe(0);
    expect(final.landed || final.crashed).toBe(true);
  });
});

describe("Scoring: score", () => {
  test("score returns 0 for crash", () => {
    const state = createState({ altitude: 100, velocity: 0, fuel: 25 });
    const trace = simulate(state, () => 0);
    expect(score(trace)).toBe(0);
  });

  test("score formula for safe landing", () => {
    const state = createState({ altitude: 2, velocity: 2, fuel: 25 });
    const trace = simulate(state, () => 0);
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
    const initialFuel = 25;
    const fuelUsed = initialFuel - final.fuel;
    const expected = (initialFuel - fuelUsed) * 10 + Math.max(0, (4 - final.velocity) * 25);
    expect(score(trace)).toBe(expected);
  });

  test("score accepts final state directly", () => {
    const state = createState({ altitude: 50, velocity: 0, fuel: 25 });
    const trace = simulate(state, () => 1);
    const final = trace[trace.length - 1];
    expect(score(final)).toBe(score(trace));
  });

  test("score rewards fuel conservation and soft landing", () => {
    const state = createState({ altitude: 2, velocity: 2, fuel: 25 });
    const trace = simulate(state, () => 0);
    const scoreVal = score(trace);
    expect(scoreVal).toBeGreaterThan(0);
  });
});
