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
  if (state.landed || state.crashed) return { ...state };
  const burn = Math.min(Math.max(0, Math.floor(thrustUnits) || 0), state.fuel);
  let velocity = state.velocity + 2 - 4 * burn;
  let altitude = state.altitude - velocity;
  const fuel = state.fuel - burn;
  const tick = state.tick + 1;
  if (altitude <= 0) {
    altitude = 0;
    const landed = velocity <= 4;
    return { altitude, velocity, fuel, tick, landed, crashed: !landed };
  }
  return { altitude, velocity, fuel, tick, landed: false, crashed: false };
}

export function simulate(state, controller) {
  const trace = [state];
  let current = state;
  while (!current.landed && !current.crashed) {
    const thrustUnits = controller(current);
    current = step(current, thrustUnits);
    trace.push(current);
  }
  return trace;
}

export function score(traceOrFinalState) {
  const finalState = Array.isArray(traceOrFinalState) ? traceOrFinalState[traceOrFinalState.length - 1] : traceOrFinalState;
  if (finalState.crashed) return 0;
  const trace = Array.isArray(traceOrFinalState) ? traceOrFinalState : [traceOrFinalState];
  const initialFuel = trace[0].fuel;
  const fuelUsed = initialFuel - finalState.fuel;
  return (initialFuel - fuelUsed) * 10 + Math.max(0, (4 - finalState.velocity) * 25);
}

export function demo() {
  const state = createState();
  const controller = () => 0;
  const trace = simulate(state, controller);
  return {
    initialState: state,
    finalState: trace[trace.length - 1],
    score: score(trace),
    traceLength: trace.length,
  };
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
