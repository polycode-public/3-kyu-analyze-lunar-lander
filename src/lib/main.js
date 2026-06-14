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

export function createState(opts = {}) {
  return {
    altitude: opts.altitude ?? 1000,
    velocity: opts.velocity ?? 40,
    fuel: opts.fuel ?? 25,
    tick: 0,
    landed: false,
    crashed: false,
  };
}

export function step(state, thrustUnits) {
  const burn = Math.min(thrustUnits, state.fuel);
  const newVelocity = state.velocity + 2 - 4 * burn;
  let newAltitude = state.altitude - newVelocity;
  const newFuel = state.fuel - burn;
  const newTick = state.tick + 1;

  let landed = false;
  let crashed = false;

  if (newAltitude <= 0) {
    newAltitude = 0;
    landed = newVelocity <= 4;
    crashed = newVelocity > 4;
  }

  return {
    altitude: newAltitude,
    velocity: newVelocity,
    fuel: newFuel,
    tick: newTick,
    landed,
    crashed,
  };
}

export function simulate(state, controller) {
  const trace = [state];
  let currentState = state;

  while (!currentState.landed && !currentState.crashed) {
    const thrust = controller(currentState);
    currentState = step(currentState, thrust);
    trace.push(currentState);
  }

  return trace;
}

export function score(traceOrState) {
  const finalState = Array.isArray(traceOrState)
    ? traceOrState[traceOrState.length - 1]
    : traceOrState;

  if (finalState.crashed) {
    return 0;
  }

  const initialState = Array.isArray(traceOrState) ? traceOrState[0] : null;
  const initialFuel = initialState ? initialState.fuel : null;

  if (initialFuel === null) {
    return 0;
  }

  const fuelUsed = initialFuel - finalState.fuel;
  const landingVelocity = finalState.velocity;

  return (initialFuel - fuelUsed) * 10 + Math.max(0, (4 - landingVelocity) * 25);
}

export function autopilot(state) {
  if (state.altitude <= 0 || state.fuel <= 0) return 0;
  const vSafe = Math.max(4, 2.2 * Math.sqrt(state.altitude));
  if (state.velocity <= vSafe) return 0;
  return Math.max(0, Math.min(Math.ceil((state.velocity - vSafe + 2) / 4), state.fuel));
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
