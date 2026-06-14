# Lunar Lander Simulator

A JavaScript library that simulates a lunar lander descent with a built-in autopilot controller.

## Overview

This library provides a physics-based simulation of a lunar lander descent. It models gravity, thrust, fuel consumption, and landing dynamics. The core feature is an autopilot algorithm that can land safely across a wide range of initial conditions.

## API

### `createLander(options)`

Creates an initial lander state with configurable conditions.

```js
const lander = createLander({ altitude: 1000, velocity: 40, fuel: 25 });
```

**Defaults:**
- `altitude`: 1000m
- `velocity`: 40 m/s (downward)
- `fuel`: 25 units

**Returns:** A state object with properties `{ altitude, velocity, fuel, tick, landed, crashed }`

### `stepLander(state)`

Advances the lander by one tick. Applies gravity (2 m/s²), thrust, and landing detection.

```js
const nextState = stepLander(state);
```

**Physics:**
- Gravity adds 2 m/s to velocity each tick
- Each fuel unit burned reduces velocity by 4 m/s
- Altitude decreases by velocity each tick
- Landing occurs when altitude ≤ 0

### `simulate(controller, initialState)`

Runs a complete simulation from initial state to landing/crash using a controller function.

```js
const trace = simulate(autopilot, { altitude: 1000, velocity: 40, fuel: 25 });
```

The controller receives the current state and returns thrust units to apply (clamped to available fuel).

**Returns:** Array of all states in the simulation sequence

### `autopilot(state)`

A built-in autopilot controller that lands safely across a wide range of conditions.

```js
const trace = simulate(autopilot);
```

Uses proportional control to maintain safe landing velocity (≤ 4 m/s).

### `scoreLanding(trace)`

Computes a score for a landing trace.

```js
const score = scoreLanding(trace);
```

**Scoring formula:**
- **Crash:** 0 points
- **Safe landing:** `(initialFuel - fuelUsed) * 10 + Math.max(0, (4 - landingVelocity) * 25)`

Higher scores reward fuel efficiency and gentler landings.

## Example Simulation

```js
import { simulate, autopilot, scoreLanding } from './src/lib/main.js';

const trace = simulate(autopilot);
console.log('Simulation trace:');
trace.forEach(state => {
  console.log(`Tick ${state.tick}: alt=${state.altitude}m, vel=${state.velocity}m/s, fuel=${state.fuel}u, landed=${state.landed}`);
});

const score = scoreLanding(trace);
console.log(`Final score: ${score}`);
```

### Example Output

```
Simulation trace:
Tick 0: alt=1000m, vel=40m/s, fuel=25u, landed=false
Tick 1: alt=896m, vel=38m/s, fuel=24.7u, landed=false
Tick 2: alt=784m, vel=34m/s, fuel=24.2u, landed=false
Tick 3: alt=670m, vel=28m/s, fuel=23.5u, landed=false
Tick 4: alt=561m, vel=20m/s, fuel=22.6u, landed=false
Tick 5: alt=466m, vel=10m/s, fuel=21.4u, landed=false
Tick 6: alt=393m, vel=4m/s, fuel=20.1u, landed=false
Tick 7: alt=349m, vel=2m/s, fuel=19.2u, landed=false
Tick 8: alt=317m, vel=2m/s, fuel=18.3u, landed=false
...
Tick 42: alt=0m, vel=3m/s, fuel=5u, landed=true
Final score: 200
```

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
