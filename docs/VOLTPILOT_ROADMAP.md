# VoltPilot Roadmap

## Current release

The current release is complete as a software-first, hybrid-ready project:

- English interactive operator cockpit
- Reusable simulation engine
- 24-hour and 7-day analysis horizons
- Transformer kVA and current estimates
- Readiness Passport with max safe EV sessions and first-risk threshold
- Strategy-specific EV capacity envelope
- Storage bridge and transformer upgrade estimates
- Battery SoC and round-trip efficiency assumptions
- Browser-local saved scenarios
- Shareable scenario URLs
- Mock telemetry overlay
- Telemetry CSV import with template export
- `/api/grid-signal` virtual and official-data-ready grid signal
- Provider model for EPIAS, ENTSO-E, Electricity Maps, and Ember
- Source status metadata for refresh cadence, granularity, credential names, and source documentation
- `/api/telemetry` measured-vs-simulated comparison
- `/api/report` Markdown engineering report export
- JSON and CSV exports
- Lightweight constraint optimizer for peak shaving, tariff exposure, and battery dispatch
- Automated tests and CI

## v1.1 software proof

- Add a README screenshot or short GIF
- Add downloadable PDF version of the Readiness Passport
- Add chart-image capture inside the engineering report
- Fill `/api/grid-signal` provider adapters with live API credentials
- Connect the grid signal more deeply to cost and carbon optimization
- Add drag-and-drop CSV validation preview

## v2 live data and optional hardware

- Live EPIAS data adapter
- Electricity Maps carbon-intensity adapter
- ESP32 HTTP sample sender
- MQTT bridge example
- Multi-day measured-vs-simulated profile comparison
- Alerts for transformer stress and critical tariff periods

## v3 optimization depth

- EV session prioritization by departure time
- Multi-day battery SoC optimization with constraints across reporting periods
- Lightweight database for scenario and telemetry history
- Monthly engineering report export
- Basic anomaly detection

## CV line

Built VoltPilot, a pre-hardware grid-readiness cockpit that combines max-safe EV solving, transformer loading estimates, battery SoC modeling, 7-day optimization, virtual grid signals, telemetry CSV validation, engineering report exports, API contracts, and automated tests in one Next.js/TypeScript project.
