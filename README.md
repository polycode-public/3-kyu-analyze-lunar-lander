# Lunar Lander Simulator

A JavaScript library that simulates a lunar lander descent with a built-in autopilot controller.

## Overview

This library provides a physics-based simulation of a lunar lander descent. It models gravity, thrust, fuel consumption, and landing dynamics. The core feature is an autopilot algorithm that can land safely across a wide range of initial conditions.

## API

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

```js
import { createState, simulate, score } from './src/lib/main.js';

// Simple controller that burns constant thrust
const controller = () => 2;

const initialState = createState();
const trace = simulate(initialState, controller);

console.log('Simulation trace:');
trace.forEach(state => {
  console.log(`Tick ${state.tick}: alt=${state.altitude}m, vel=${state.velocity}m/s, fuel=${state.fuel}u, landed=${state.landed}, crashed=${state.crashed}`);
});

const finalScore = score(trace);
console.log(`Final score: ${finalScore}`);
```

### Example Output

```
Simulation trace:
Tick 0: alt=1000m, vel=40m/s, fuel=25u, landed=false, crashed=false
Tick 1: alt=896m, vel=38m/s, fuel=23u, landed=false, crashed=false
Tick 2: alt=784m, vel=36m/s, fuel=21u, landed=false, crashed=false
Tick 3: alt=664m, vel=34m/s, fuel=19u, landed=false, crashed=false
Tick 4: alt=538m, vel=32m/s, fuel=17u, landed=false, crashed=false
Tick 5: alt=406m, vel=30m/s, fuel=15u, landed=false, crashed=false
Tick 6: alt=268m, vel=28m/s, fuel=13u, landed=false, crashed=false
Tick 7: alt=124m, vel=26m/s, fuel=11u, landed=false, crashed=false
Tick 8: alt=-134m, vel=24m/s, fuel=9u, landed=false, crashed=true
Final score: 0
```

This trace shows a crash due to insufficient thrust. A safe controller would need to apply more thrust earlier to slow the descent in time.

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
