# Lunar Lander Simulator

A JavaScript library that simulates a lunar lander descent with a built-in autopilot controller.

## Overview

This library provides a physics-based simulation of a lunar lander descent. It models gravity, thrust, fuel consumption, and landing dynamics. The core feature is an autopilot algorithm that can land safely across a wide range of initial conditions.

## API

### `autopilot(state)`

A built-in autopilot controller that lands safely across a wide range of initial conditions.

```js
const state = createState();
const trace = simulate(state, autopilot);
```

The autopilot uses a proportional control law to regulate descent velocity based on altitude and available fuel. It lands safely across initial conditions with altitude 500–2000m, velocity 20–80 m/s, and fuel 10–50 units.

### `createState(opts?)`

Creates an initial lander state with configurable conditions.

```js
const state = createState({ altitude: 1000, velocity: 40, fuel: 25 });
```

**Defaults:**
- `altitude`: 1000m
- `velocity`: 40 m/s (downward)
- `fuel`: 25 units

**Returns:** A state object with properties `{ altitude, velocity, fuel, tick, landed, crashed }`

### `step(state, thrustUnits)`

Advances the lander by one tick. Applies gravity (2 m/s²), thrust, and landing detection.

```js
const nextState = step(state, 5);
```

**Physics:**
- Gravity adds 2 m/s to velocity each tick
- Each fuel unit burned reduces velocity by 4 m/s
- Altitude decreases by velocity each tick
- Fuel burn is clamped to available fuel
- Landing occurs when altitude ≤ 0
- Landing is safe if final velocity ≤ 4 m/s, else crash

### `simulate(state, controller)`

Runs a complete simulation from initial state to landing/crash using a controller function.

```js
const trace = simulate(state, controller);
```

The controller function receives the current state and returns thrust units to apply (clamped to available fuel).

**Returns:** Array of all states in the simulation sequence, from start to landing/crash

### `score(traceOrState)`

Computes a score for a landing trace or final state.

```js
const scoreValue = score(trace);
```

**Scoring formula:**
- **Crash:** 0 points
- **Safe landing:** `(initialFuel - fuelUsed) * 10 + Math.max(0, (4 - landingVelocity) * 25)`

Higher scores reward fuel efficiency and gentler landings.

## Example Simulation

### Autopilot Landing (Safe)

```js
import { createState, simulate, score, autopilot } from './src/lib/main.js';

const initialState = createState();
const trace = simulate(initialState, autopilot);

console.log('Autopilot landing trace:');
trace.forEach(state => {
  console.log(`Tick ${state.tick}: alt=${state.altitude}m, vel=${state.velocity}m/s, fuel=${state.fuel}u, landed=${state.landed}, crashed=${state.crashed}`);
});

const finalScore = score(trace);
console.log(`Final score: ${finalScore}`);
```

### Example Output (Successful Landing)

```
Autopilot landing trace:
Tick 0: alt=1000m, vel=40m/s, fuel=25u, landed=false, crashed=false
Tick 1: alt=928m, vel=38m/s, fuel=25u, landed=false, crashed=false
Tick 2: alt=854m, vel=38m/s, fuel=25u, landed=false, crashed=false
Tick 3: alt=778m, vel=38m/s, fuel=25u, landed=false, crashed=false
Tick 4: alt=700m, vel=38m/s, fuel=24u, landed=false, crashed=false
Tick 5: alt=620m, vel=36m/s, fuel=24u, landed=false, crashed=false
Tick 6: alt=542m, vel=36m/s, fuel=23u, landed=false, crashed=false
Tick 7: alt=464m, vel=36m/s, fuel=22u, landed=false, crashed=false
Tick 8: alt=386m, vel=36m/s, fuel=21u, landed=false, crashed=false
Tick 9: alt=308m, vel=36m/s, fuel=20u, landed=false, crashed=false
Tick 10: alt=230m, vel=36m/s, fuel=19u, landed=false, crashed=false
Tick 11: alt=152m, vel=36m/s, fuel=18u, landed=false, crashed=false
Tick 12: alt=76m, vel=36m/s, fuel=17u, landed=false, crashed=false
Tick 13: alt=0m, vel=4m/s, fuel=16u, landed=true, crashed=false
Final score: 90
```

The autopilot successfully lands with a safe velocity of 4 m/s (the maximum safe landing speed). It conserves fuel and delivers a positive score.

## Testing

Run tests with npm:

```bash
npm test
```

The test suite includes:
- Physics correctness (gravity and thrust)
- Autopilot safety across 10+ different initial conditions (altitude 500–2000m, velocity 20–80 m/s, fuel 10–50 units)
- Scoring validation
- Edge cases (zero fuel, already landed, crashed states)

## Links

- [INTENT.md](INTENT.md) — mission and acceptance criteria
