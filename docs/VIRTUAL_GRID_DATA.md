# Virtual Grid Data Guide

VoltPilot follows a "virtual first, official-data-ready later" data strategy. This keeps the project runnable without hardware while preserving a credible path toward live institutional data.

## Why Start Virtually?

Physical measurement introduces cost, safety, calibration, and site-access constraints. For a portfolio project, it is more useful to complete the software proof first:

- The simulation engine stays deterministic.
- Tests do not depend on the internet or API keys.
- The UI, API, and documentation are shaped around a real data contract.
- When hardware or live data arrives, only the adapter changes; the product story does not.

## Provider Model

`/api/grid-signal` accepts these provider IDs:

- `demo`: Keyless deterministic 24-hour grid signal for Turkey.
- `epias`: EPIAS Transparency Platform adapter target for official Turkish electricity data.
- `entsoe`: ENTSO-E Transparency Platform adapter target for European power-system data.
- `electricity-maps`: Adapter target for carbon intensity, electricity mix, load, and price signals.
- `ember`: Adapter target for monthly and yearly country-level demand, generation, emissions, and carbon intensity data.

If live credentials are missing, `epias`, `entsoe`, `electricity-maps`, and `ember` return virtual fallback data with the same schema. This is intentional: the demo always works and the integration path remains open.

## API Example

```text
GET /api/grid-signal?provider=epias&date=2026-05-06
```

Main response fields:

- `provider`: Selected provider.
- `status`: `demo`, `live`, or `fallback`.
- `points`: 24-hour load, price, renewable-share, carbon-intensity, and risk signal.
- `summary`: Peak load, peak hour, average price, average carbon intensity, and dispatch advice.
- `integrationNotes`: Notes for switching from fallback data to live data.

The cockpit also exposes provider metadata beside the chart:

- credential environment variable, when needed
- source documentation link
- expected refresh behavior
- source granularity
- adapter status: local deterministic or credential-ready

## Official and Institutional Sources

- EPIAS Transparency Platform technical documentation lists REST services for Turkish electricity data: https://seffaflik-prp.epias.com.tr/electricity-service/technical/tr/index.html
- ENTSO-E Transparency Platform is the central platform for European electricity market and system-transparency data: https://transparency.entsoe.eu/
- Electricity Maps API provides optional commercial/API access for carbon intensity, electricity mix, renewable share, load, and price signals: https://portal.electricitymaps.com/docs/api
- Ember API provides open electricity datasets for demand, generation, emissions, and carbon intensity: https://ember-energy.org/data/api/

## Refresh Frequency

The current application does not poll live external APIs. `demo` data is generated deterministically for the requested date and therefore has no external refresh cycle.

Live adapter refresh should be configured per provider and per dataset:

- `epias`: EPIAS is the primary Turkish official-data target. Its published datasets are tied to market and transparency processes, so the cadence is dataset-specific rather than one global interval.
- `entsoe`: ENTSO-E Transparency Platform publishes many data items through REST API, file extracts, subscriptions, web services, and ECP. Resolution and publication timing depend on the selected data item.
- `electricity-maps`: Electricity Maps API defaults to hourly temporal granularity and supports 5-minute, 15-minute, hourly, daily, monthly, quarterly, and yearly granularities where the endpoint supports them.
- `ember`: Ember Monthly Electricity Data is updated twice per month, once in the first week and once in the third week.

## Limitations

These data sources are not building-meter measurements. They provide national, regional, or market-level signals. VoltPilot connects those signals to a facility simulation to answer:

"Without hardware today, which hours are risky, which control strategy is safer, and which scenario is worth validating with future measurements?"

## Hardware Path

1. Complete UI, API, and tests with the virtual demo signal.
2. Fill one of the EPIAS, ENTSO-E, Electricity Maps, or Ember adapters with live data.
3. Connect smart-plug or ESP32 measurements to the `/api/telemetry` contract.
4. Import CSV telemetry directly in the cockpit when hardware is not available.
5. Track measured-vs-simulated difference through MAE, peak error, energy delta, and confidence score.
6. Calibrate model assumptions against real measurements.
