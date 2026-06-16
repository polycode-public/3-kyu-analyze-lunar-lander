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

const GRAVITY = 2;
const THRUST_PER_FUEL = 4;
const DEFAULT_ALTITUDE = 1000;
const DEFAULT_VELOCITY = 40;
const DEFAULT_FUEL = 25;
const SAFE_VELOCITY_THRESHOLD = 4;

export function createLander(
  altitude = DEFAULT_ALTITUDE,
  velocity = DEFAULT_VELOCITY,
  fuel = DEFAULT_FUEL
) {
  return {
    altitude,
    velocity,
    fuel,
    tick: 0,
    landed: false,
    crashed: false,
  };
}

export function step(state, thrustUnits = 0) {
  if (state.landed || state.crashed) {
    return state;
  }

  const clampedThrust = Math.min(thrustUnits, state.fuel);
  const thrustReduction = clampedThrust * THRUST_PER_FUEL;
  const newVelocity = state.velocity + GRAVITY - thrustReduction;
  const newAltitude = state.altitude - newVelocity;
  const newFuel = state.fuel - clampedThrust;

  if (newAltitude <= 0) {
    return {
      altitude: 0,
      velocity: newVelocity,
      fuel: newFuel,
      tick: state.tick + 1,
      landed: newVelocity <= SAFE_VELOCITY_THRESHOLD,
      crashed: newVelocity > SAFE_VELOCITY_THRESHOLD,
    };
  }

  return {
    altitude: newAltitude,
    velocity: newVelocity,
    fuel: newFuel,
    tick: state.tick + 1,
    landed: false,
    crashed: false,
  };
}

export function simulate(controller) {
  let state = createLander();
  const trace = [state];

  while (!state.landed && !state.crashed) {
    const thrustUnits = controller(state);
    state = step(state, thrustUnits);
    trace.push(state);
  }

  return trace;
}

export function autopilot(state) {
  if (state.fuel === 0) {
    return 0;
  }

  // Calculate needed deceleration: v² = 2 * a * d
  // To reach target velocity targetV at altitude 0:
  // targetV² = velocity² + 2 * (accel - gravity) * altitude
  // We want targetV = 4 (or less for safety margin)
  const targetVelocity = 2;
  const accelNeeded = (targetVelocity * targetVelocity - state.velocity * state.velocity) / (2 * Math.max(1, state.altitude)) + GRAVITY;
  const thrustNeeded = accelNeeded / THRUST_PER_FUEL;

  return Math.min(Math.max(0, Math.ceil(thrustNeeded)), state.fuel);
}

export function score(initialFuel, fuelUsed, landingVelocity, crashed) {
  if (crashed) {
    return 0;
  }
  return (initialFuel - fuelUsed) * 10 + Math.max(0, (SAFE_VELOCITY_THRESHOLD - landingVelocity) * 25);
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
