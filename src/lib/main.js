#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Polycode Limited
// src/lib/main.js

const isNode = typeof process !== "undefined" && !!process.versions?.node;

let pkg;
if (isNode) {
  const { createRequire } = await import("module");
  const requireFn = createRequire(import.meta.url);
  pkg = requireFn("../../package.json");
} else {
  try {
    const resp = await fetch(new URL("../../package.json", import.meta.url));
    pkg = await resp.json();
  } catch {
    pkg = { name: document.title, version: "0.0.0", description: "" };
  }
}

export const name = pkg.name;
export const version = pkg.version;
export const description = pkg.description;

export function getIdentity() {
  return { name, version, description };
}

// Lunar lander simulation

const GRAVITY = 2;
const THRUST_PER_FUEL = 4;
const SAFE_VELOCITY = 4;

export function createLander(options = {}) {
  return {
    altitude: options.altitude ?? 1000,
    velocity: options.velocity ?? 40,
    fuel: options.fuel ?? 25,
    tick: 0,
    landed: false,
    crashed: false,
  };
}

export function stepLander(state) {
  if (state.landed || state.crashed) {
    return state;
  }

  const thrustUsed = Math.min(state.fuel, state.thrust ?? 0);
  const fuelRemaining = state.fuel - thrustUsed;

  let velocity = state.velocity + GRAVITY - thrustUsed * THRUST_PER_FUEL;
  let altitude = state.altitude - velocity;

  const newState = {
    altitude,
    velocity,
    fuel: fuelRemaining,
    tick: state.tick + 1,
    landed: false,
    crashed: false,
  };

  if (newState.altitude <= 0) {
    newState.altitude = 0;
    newState.landed = true;
    if (newState.velocity > SAFE_VELOCITY) {
      newState.crashed = true;
      newState.landed = false;
    }
  }

  return newState;
}

export function simulate(controller, initialState = {}) {
  const start = createLander(initialState);
  const trace = [start];
  let state = start;

  while (!state.landed && !state.crashed) {
    const thrust = controller(state);
    state = { ...state, thrust };
    state = stepLander(state);
    trace.push(state);
  }

  return trace;
}

function simulateToLand(initialState, thrustFn) {
  let state = initialState;
  const trace = [state];

  for (let i = 0; i < 1000; i++) {
    if (state.landed || state.crashed) break;

    const thrust = thrustFn(state);
    state = { ...state, thrust };
    state = stepLander(state);
    trace.push(state);
  }

  return trace;
}

export function autopilot(state) {
  if (state.landed || state.crashed) {
    return 0;
  }

  const h = state.altitude;
  const v = state.velocity;
  const f = state.fuel;

  // If already at or below safe velocity, coast
  if (v <= SAFE_VELOCITY) {
    return 0;
  }

  // If very close, full thrust
  if (h <= 2) {
    return f;
  }

  // Binary search for the minimum thrust that lands safely
  let lo = 0;
  let hi = f;
  let bestThrust = f;

  for (let iter = 0; iter < 30; iter++) {
    const mid = (lo + hi) / 2;

    // Test: simulate with constant thrust = mid
    const testTrace = simulateToLand(state, () => mid);
    const finalState = testTrace[testTrace.length - 1];

    if (finalState.landed && !finalState.crashed) {
      // Safe landing! Try lower thrust
      bestThrust = mid;
      hi = mid;
    } else if (finalState.crashed || (!finalState.landed && !finalState.crashed)) {
      // Either crashed or infinite loop, need more thrust
      lo = mid;
    }
  }

  return Math.max(0, Math.min(f, bestThrust));
}

export function scoreLanding(trace) {
  const final = trace[trace.length - 1];

  if (final.crashed) {
    return 0;
  }

  const initial = trace[0];
  const fuelRemaining = final.fuel;
  const landingVelocity = final.velocity;

  return fuelRemaining * 10 + Math.max(0, (SAFE_VELOCITY - landingVelocity) * 25);
}

export function main(args) {
  if (args?.includes("--version")) {
    console.log(version);
    return;
  }
  if (args?.includes("--identity")) {
    console.log(JSON.stringify(getIdentity(), null, 2));
    return;
  }
  console.log(`${name}@${version}`);
}

if (isNode) {
  const { fileURLToPath } = await import("url");
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    main(args);
  }
}
