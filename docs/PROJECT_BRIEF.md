# VoltPilot Project Brief

## Short Description

VoltPilot is a pre-hardware grid-readiness cockpit that analyzes EV charging, flexible building loads, battery support, virtual grid signals, and transformer loading in one workflow.

The project runs without physical hardware. It still includes an EPIAS/ENTSO-E/Electricity Maps/Ember-ready virtual data layer, telemetry CSV import, a `POST /api/telemetry` endpoint for measured-vs-simulated comparison, and downloadable engineering report output. Future ESP32, MQTT bridge, or smart-plug data can be connected to the same contract.

## Problem

Small businesses, labs, and apartment blocks often cannot quickly answer:

- When is the transformer under stress?
- How much does EV charging increase peak load?
- How much can storage or load shifting reduce monthly cost?
- How many concurrent EV charging sessions can the existing transformer support before buying hardware?
- Should the next step be managed charging, a battery bridge, or a transformer upgrade?
- Which official or institutional grid-data signal increases risk by hour?
- How closely does the simulation match measured data?

## Solution

VoltPilot answers those questions in one cockpit:

- Builds 24-hour or 7-day load profiles.
- Compares uncontrolled, tariff-aware, orchestrated, and constraint-optimized strategies.
- Solves the maximum safe EV concurrency and first-risk EV threshold.
- Produces a Readiness Passport with deployment status, storage bridge estimate, and transformer upgrade target.
- Reports `kW`, `kVA`, estimated current, power factor, battery SoC, and overload hours.
- Produces virtual or official-data-ready grid signals through `/api/grid-signal`.
- Compares mock, CSV-imported, or measured telemetry data against the simulation.
- Exports JSON, CSV, and Markdown engineering report outputs.

## CV Line

Built VoltPilot, a pre-hardware grid-readiness cockpit that combines max-safe EV solving, transformer loading, battery SoC modeling, 7-day optimization, virtual grid signals, telemetry CSV validation, engineering report exports, API contracts, and automated tests in one Next.js/TypeScript project.

## Presentation Highlights

- Uses electrical and electronics engineering metrics directly: `kW`, `kVA`, current, power factor, and transformer loading.
- It is not only a visual dashboard; it has a tested simulation core and API layer.
- Its differentiator is the Readiness Passport: a pre-hardware decision artifact that says how many EV sessions are safe, where risk begins, and what upgrade path is needed.
- Demonstrates an EPIAS/ENTSO-E/Electricity Maps/Ember-compatible data architecture without physical hardware.
- Includes a lightweight optimizer for peak shaving, tariff exposure, transformer headroom, and battery dispatch.
- Can be shown without buying hardware, while the future hardware boundary is already designed.
- Works as a readable, runnable, and extendable GitHub portfolio project.
