// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Polycode Limited
import { describe, test, expect } from "vitest";
import { main, getIdentity, name, version, description, createLander, stepLander, simulate, autopilot, scoreLanding } from "../../src/lib/main.js";

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

describe("Lunar Lander - createLander", () => {
  test("creates lander with default values", () => {
    const lander = createLander();
    expect(lander).toEqual({
      altitude: 1000,
      velocity: 40,
      fuel: 25,
      tick: 0,
      landed: false,
      crashed: false,
    });
  });

  test("creates lander with custom values", () => {
    const lander = createLander({ altitude: 500, velocity: 20, fuel: 15 });
    expect(lander.altitude).toBe(500);
    expect(lander.velocity).toBe(20);
    expect(lander.fuel).toBe(15);
    expect(lander.tick).toBe(0);
  });
});

describe("Lunar Lander - stepLander", () => {
  test("applies gravity correctly (no thrust)", () => {
    const state = createLander();
    const next = stepLander(state);
    // velocity increases by gravity (2), altitude decreases by velocity
    expect(next.velocity).toBe(state.velocity + 2);
    expect(next.altitude).toBe(state.altitude - (state.velocity + 2));
    expect(next.fuel).toBe(25);
    expect(next.tick).toBe(1);
  });

  test("applies thrust correctly", () => {
    const state = { ...createLander(), thrust: 10 };
    const next = stepLander(state);
    // thrust reduces velocity by (10 * 4) = 40
    const expectedVelocity = 40 + 2 - 40;
    expect(next.velocity).toBe(expectedVelocity);
    expect(next.fuel).toBe(25 - 10);
  });

  test("clamps thrust to available fuel", () => {
    const state = { ...createLander(), fuel: 5, thrust: 10 };
    const next = stepLander(state);
    // Only 5 fuel available, so thrust effect is 5 * 4 = 20
    expect(next.fuel).toBe(0);
    const expectedVelocity = 40 + 2 - 20;
    expect(next.velocity).toBe(expectedVelocity);
  });

  test("detects safe landing (velocity <= 4)", () => {
    // To land safely with velocity 3 at altitude 0:
    // We need: final_velocity = current_velocity + GRAVITY - (thrust * THRUST_PER_FUEL) = 3
    // And: altitude - final_velocity = 0
    // So: altitude = final_velocity
    // If final_velocity = 3, then altitude must be 3 initially
    // And: 3 = velocity + 2 - (thrust * 4)
    // So: velocity + thrust*4 = 2, e.g., velocity = 0, thrust = 0.5
    // Better: velocity = 2, thrust = 0 gives velocity = 4 (boundary case)
    // Then we need altitude = 4 to drop by 4

    // Actually, let's use thrust to land safely
    const state = { altitude: 4, velocity: 2, fuel: 1, tick: 0, landed: false, crashed: false, thrust: 1 };
    // velocity = 2 + 2 - 1*4 = -1, but we clamp negative velocity
    // altitude = 4 - (-1) = 5, still no landing

    // Let's be more direct: arrange altitude=1, velocity=0, apply thrust
    const state2 = { altitude: 1, velocity: 0, fuel: 1, tick: 0, landed: false, crashed: false, thrust: 0 };
    const next = stepLander(state2);
    // velocity = 0 + 2 - 0 = 2, altitude = 1 - 2 = -1 (clamped to 0)
    // velocity 2 <= 4, so landed = true, crashed = false
    expect(next.altitude).toBe(0);
    expect(next.velocity).toBe(2);
    expect(next.landed).toBe(true);
    expect(next.crashed).toBe(false);
  });

  test("detects crash (velocity > 4 at altitude 0)", () => {
    const state = { altitude: 2, velocity: 5, fuel: 10, tick: 0, landed: false, crashed: false };
    const next = stepLander(state);
    expect(next.altitude).toBe(0);
    expect(next.crashed).toBe(true);
    expect(next.landed).toBe(false);
  });

  test("does not advance landed state", () => {
    const state = { altitude: 0, velocity: 2, fuel: 10, tick: 5, landed: true, crashed: false };
    const next = stepLander(state);
    expect(next).toEqual(state);
  });

  test("does not advance crashed state", () => {
    const state = { altitude: 0, velocity: 10, fuel: 10, tick: 5, landed: false, crashed: true };
    const next = stepLander(state);
    expect(next).toEqual(state);
  });
});

describe("Lunar Lander - autopilot", () => {
  test("returns 0 when already at safe velocity", () => {
    const state = { altitude: 100, velocity: 4, fuel: 20, tick: 0, landed: false, crashed: false };
    expect(autopilot(state)).toBe(0);
  });

  test("returns 0 when landed", () => {
    const state = { altitude: 0, velocity: 2, fuel: 10, tick: 10, landed: true, crashed: false };
    expect(autopilot(state)).toBe(0);
  });

  test("returns 0 when crashed", () => {
    const state = { altitude: 0, velocity: 5, fuel: 10, tick: 10, landed: false, crashed: true };
    expect(autopilot(state)).toBe(0);
  });

  test("applies thrust when excessive velocity", () => {
    const state = { altitude: 500, velocity: 50, fuel: 20, tick: 0, landed: false, crashed: false };
    const thrust = autopilot(state);
    expect(thrust).toBeGreaterThan(0);
    expect(thrust).toBeLessThanOrEqual(20);
  });

  test("lands safely with default conditions", () => {
    const trace = simulate(autopilot);
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
    expect(final.crashed).toBe(false);
    expect(final.velocity).toBeLessThanOrEqual(4);
  });
});

describe("Lunar Lander - simulate", () => {
  test("returns trace array starting with initial state", () => {
    const controller = () => 0;
    const trace = simulate(controller);
    expect(Array.isArray(trace)).toBe(true);
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0]).toEqual(createLander());
  });

  test("stops simulation on landing", () => {
    const controller = () => 10;
    const trace = simulate(controller, { altitude: 100, velocity: 20, fuel: 30 });
    const final = trace[trace.length - 1];
    expect(final.landed || final.crashed).toBe(true);
  });

  test("returns all states in sequence", () => {
    const controller = () => 5;
    const trace = simulate(controller, { altitude: 100, velocity: 10, fuel: 20 });
    for (let i = 1; i < trace.length; i++) {
      expect(trace[i].tick).toBe(trace[i - 1].tick + 1);
    }
  });
});

describe("Lunar Lander - scoreLanding", () => {
  test("returns 0 for crash", () => {
    const trace = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 50, fuel: 25, tick: 1, landed: false, crashed: true },
    ];
    expect(scoreLanding(trace)).toBe(0);
  });

  test("scores safe landing correctly", () => {
    const trace = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 2, fuel: 15, tick: 10, landed: true, crashed: false },
    ];
    // fuelRemaining = 15, so score = 15 * 10 + (4 - 2) * 25 = 150 + 50 = 200
    expect(scoreLanding(trace)).toBe(200);
  });

  test("applies bonus for lower landing velocity", () => {
    const trace1 = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 4, fuel: 15, tick: 10, landed: true, crashed: false },
    ];
    const trace2 = [
      { altitude: 1000, velocity: 40, fuel: 25, tick: 0, landed: false, crashed: false },
      { altitude: 0, velocity: 2, fuel: 15, tick: 10, landed: true, crashed: false },
    ];
    const score1 = scoreLanding(trace1);
    const score2 = scoreLanding(trace2);
    expect(score2).toBeGreaterThan(score1);
  });
});

describe("Lunar Lander - autopilot across ranges", () => {
  test("lands safely at altitude 500, velocity 20, fuel 15", () => {
    const trace = simulate(autopilot, { altitude: 500, velocity: 20, fuel: 15 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 2000, velocity 80, fuel 50", () => {
    const trace = simulate(autopilot, { altitude: 2000, velocity: 80, fuel: 50 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 1000, velocity 60, fuel 30", () => {
    const trace = simulate(autopilot, { altitude: 1000, velocity: 60, fuel: 30 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 750, velocity 40, fuel 20", () => {
    const trace = simulate(autopilot, { altitude: 750, velocity: 40, fuel: 20 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 600, velocity 50, fuel 25", () => {
    const trace = simulate(autopilot, { altitude: 600, velocity: 50, fuel: 25 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("handles physically impossible condition gracefully", () => {
    const trace = simulate(autopilot, { altitude: 500, velocity: 80, fuel: 5 });
    // Should produce a trace without throwing
    expect(Array.isArray(trace)).toBe(true);
    expect(trace.length).toBeGreaterThan(0);
    // May crash or land, but should complete
    const final = trace[trace.length - 1];
    expect(final.landed || final.crashed).toBe(true);
  });

  test("lands safely at altitude 800, velocity 35, fuel 18", () => {
    const trace = simulate(autopilot, { altitude: 800, velocity: 35, fuel: 18 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 1200, velocity 55, fuel 28", () => {
    const trace = simulate(autopilot, { altitude: 1200, velocity: 55, fuel: 28 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 900, velocity 45, fuel 22", () => {
    const trace = simulate(autopilot, { altitude: 900, velocity: 45, fuel: 22 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });

  test("lands safely at altitude 1500, velocity 70, fuel 40", () => {
    const trace = simulate(autopilot, { altitude: 1500, velocity: 70, fuel: 40 });
    const final = trace[trace.length - 1];
    expect(final.landed).toBe(true);
  });
});

describe("Lunar Lander - edge cases", () => {
  test("handles zero fuel", () => {
    const state = { altitude: 100, velocity: 10, fuel: 0, tick: 0, landed: false, crashed: false };
    const next = stepLander(state);
    expect(next.fuel).toBe(0);
  });

  test("already landed state is immutable", () => {
    const state = { altitude: 0, velocity: 2, fuel: 10, tick: 5, landed: true, crashed: false };
    const next = stepLander(state);
    expect(next).toEqual(state);
  });
});
