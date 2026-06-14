// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Polycode Limited
import { describe, test, expect } from "vitest";
import {
  main,
  getIdentity,
  name,
  version,
  description,
  createState,
  step,
  simulate,
  score,
  autopilot,
} from "../../src/lib/main.js";

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

describe("createState", () => {
  test("returns state with default values", () => {
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

  test("accepts custom options", () => {
    const state = createState({ altitude: 500, velocity: 20, fuel: 50 });
    expect(state.altitude).toBe(500);
    expect(state.velocity).toBe(20);
    expect(state.fuel).toBe(50);
    expect(state.tick).toBe(0);
    expect(state.landed).toBe(false);
    expect(state.crashed).toBe(false);
  });

  test("allows partial overrides", () => {
    const state = createState({ altitude: 750 });
    expect(state.altitude).toBe(750);
    expect(state.velocity).toBe(40);
    expect(state.fuel).toBe(25);
  });
});

describe("step", () => {
  test("applies gravity when no thrust", () => {
    const state = createState();
    const next = step(state, 0);
    expect(next.velocity).toBe(42);
    expect(next.altitude).toBe(958);
    expect(next.fuel).toBe(25);
    expect(next.tick).toBe(1);
  });

  test("applies thrust reduction to velocity", () => {
    const state = createState();
    const next = step(state, 10);
    const expectedVelocity = 40 + 2 - 4 * 10;
    expect(next.velocity).toBe(expectedVelocity);
    expect(next.fuel).toBe(15);
  });

  test("clamps burn to available fuel", () => {
    const state = createState({ fuel: 5 });
    const next = step(state, 100);
    expect(next.fuel).toBe(0);
    const expectedVelocity = 40 + 2 - 4 * 5;
    expect(next.velocity).toBe(expectedVelocity);
  });

  test("returns immutable state", () => {
    const state = createState();
    const next = step(state, 5);
    expect(state).not.toBe(next);
    expect(state.velocity).toBe(40);
    expect(state.fuel).toBe(25);
  });

  test("detects safe landing when altitude <= 0 and velocity <= 4", () => {
    const state = {
      altitude: 2,
      velocity: 1,
      fuel: 10,
      tick: 0,
      landed: false,
      crashed: false,
    };
    const next = step(state, 0);
    expect(next.altitude).toBe(0);
    expect(next.landed).toBe(true);
    expect(next.crashed).toBe(false);
  });

  test("detects crash when altitude <= 0 and velocity > 4", () => {
    const state = {
      altitude: 3,
      velocity: 5,
      fuel: 10,
      tick: 0,
      landed: false,
      crashed: false,
    };
    const next = step(state, 0);
    expect(next.altitude).toBe(0);
    expect(next.landed).toBe(false);
    expect(next.crashed).toBe(true);
  });

  test("increments tick counter", () => {
    const state = createState();
    const next1 = step(state, 0);
    expect(next1.tick).toBe(1);
    const next2 = step(next1, 0);
    expect(next2.tick).toBe(2);
  });
});

describe("simulate", () => {
  test("returns trace with initial state", () => {
    const state = createState();
    const controller = () => 0;
    const trace = simulate(state, controller);
    expect(trace[0]).toBe(state);
  });

  test("returns complete trace to landing", () => {
    const state = createState({ altitude: 10, velocity: 2, fuel: 10 });
    const controller = () => 0;
    const trace = simulate(state, controller);
    expect(trace.length).toBeGreaterThan(1);
    const finalState = trace[trace.length - 1];
    expect(finalState.landed || finalState.crashed).toBe(true);
  });

  test("calls controller for each step", () => {
    const state = createState({ altitude: 10, velocity: 2, fuel: 10 });
    let callCount = 0;
    const controller = () => {
      callCount++;
      return 0;
    };
    simulate(state, controller);
    expect(callCount).toBeGreaterThan(0);
  });

  test("stops on landing", () => {
    const state = createState({ altitude: 50, velocity: 8, fuel: 20 });
    const controller = () => 2;
    const trace = simulate(state, controller);
    const finalState = trace[trace.length - 1];
    expect(finalState.landed || finalState.crashed).toBe(true);
  });

  test("stops on crash", () => {
    const state = createState({ altitude: 50, velocity: 80, fuel: 1 });
    const controller = () => 0;
    const trace = simulate(state, controller);
    const finalState = trace[trace.length - 1];
    expect(finalState.crashed).toBe(true);
  });

  test("returns complete immutable trace", () => {
    const state = createState({ altitude: 15, velocity: 3, fuel: 10 });
    const controller = () => 2;
    const trace = simulate(state, controller);
    for (let i = 0; i < trace.length - 1; i++) {
      expect(trace[i].tick).toBeLessThan(trace[i + 1].tick);
    }
  });
});

describe("score", () => {
  test("returns 0 for crash", () => {
    const state = {
      altitude: 0,
      velocity: 10,
      fuel: 5,
      tick: 5,
      landed: false,
      crashed: true,
    };
    expect(score(state)).toBe(0);
  });

  test("calculates score for trace", () => {
    const trace = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 958, velocity: 42, fuel: 25, tick: 1, landed: false, crashed: false },
      { altitude: 0, velocity: 2, fuel: 24, tick: 2, landed: true, crashed: false },
    ];
    const scoreValue = score(trace);
    const expectedScore = (25 - 1) * 10 + Math.max(0, (4 - 2) * 25);
    expect(scoreValue).toBe(expectedScore);
  });

  test("rewards fuel efficiency", () => {
    const trace1 = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 2, fuel: 20, tick: 1, landed: true, crashed: false },
    ];
    const trace2 = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 2, fuel: 10, tick: 1, landed: true, crashed: false },
    ];
    expect(score(trace1)).toBeGreaterThan(score(trace2));
  });

  test("rewards low landing velocity", () => {
    const trace1 = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 1, fuel: 20, tick: 1, landed: true, crashed: false },
    ];
    const trace2 = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 4, fuel: 20, tick: 1, landed: true, crashed: false },
    ];
    expect(score(trace1)).toBeGreaterThan(score(trace2));
  });

  test("scores final state directly", () => {
    const state = {
      altitude: 0,
      velocity: 2,
      fuel: 20,
      tick: 1,
      landed: true,
      crashed: false,
    };
    expect(score(state)).toBe(0);
  });

  test("formula: (initialFuel - fuelUsed) * 10 + (4 - velocity) * 25", () => {
    const trace = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 3, fuel: 15, tick: 1, landed: true, crashed: false },
    ];
    const expectedScore = (25 - 10) * 10 + (4 - 3) * 25;
    expect(score(trace)).toBe(expectedScore);
  });
});

describe("autopilot", () => {
  test("returns 0 when velocity is safe", () => {
    const state = createState({ altitude: 100, velocity: 2, fuel: 10 });
    expect(autopilot(state)).toBe(0);
  });

  test("returns positive thrust when velocity is high", () => {
    const state = createState({ altitude: 1000, velocity: 40, fuel: 25 });
    const thrust = autopilot(state);
    expect(thrust).toBeGreaterThan(0);
    expect(thrust).toBeLessThanOrEqual(25);
  });

  test("never requests more fuel than available", () => {
    const state = createState({ altitude: 1000, velocity: 40, fuel: 5 });
    const thrust = autopilot(state);
    expect(thrust).toBeLessThanOrEqual(5);
  });

  test("returns 0 when landed", () => {
    const state = { altitude: 0, velocity: 2, fuel: 20, tick: 5, landed: true, crashed: false };
    expect(autopilot(state)).toBe(0);
  });

  test("lands safely from default conditions", () => {
    const state = createState();
    const trace = simulate(state, autopilot);
    const finalState = trace[trace.length - 1];

    expect(finalState.landed).toBe(true);
    expect(finalState.crashed).toBe(false);
    expect(finalState.velocity).toBeLessThanOrEqual(4);
    expect(finalState.altitude).toBe(0);
  });

  test("produces positive score from default conditions", () => {
    const state = createState();
    const trace = simulate(state, autopilot);
    const landingScore = score(trace);

    expect(landingScore).toBeGreaterThan(0);
  });
});
