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

export function autopilot(state) {
  if (state.landed || state.crashed) {
    return 0;
  }

  if (state.altitude <= 1) {
    return state.fuel;
  }

  // Calculate required deceleration to reach SAFE_VELOCITY at ground level
  // Using kinematic equation: v_f^2 = v_i^2 + 2*a*d
  // SAFE_VELOCITY^2 = velocity^2 + 2*a*altitude
  // a = (SAFE_VELOCITY^2 - velocity^2) / (2 * altitude)
  const requiredAccel = (SAFE_VELOCITY * SAFE_VELOCITY - state.velocity * state.velocity) / (2 * state.altitude);

  // Net acceleration equation: net_accel = GRAVITY - (thrust * THRUST_PER_FUEL)
  // Solving for thrust: thrust = (GRAVITY - requiredAccel) / THRUST_PER_FUEL
  const thrustNeeded = (GRAVITY - requiredAccel) / THRUST_PER_FUEL;

  return Math.max(0, Math.min(state.fuel, thrustNeeded));
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
