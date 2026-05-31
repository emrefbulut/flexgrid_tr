# VoltPilot LinkedIn Launch Copy

## Short Version

I am excited to share VoltPilot, an electrical engineering and software portfolio project I built around pre-hardware grid-readiness analysis.

VoltPilot helps estimate whether a facility is ready for EV charging and flexible-load operation before buying chargers, meters, batteries, or transformer upgrades.

The project models transformer loading, maximum safe EV charging sessions, battery impact, flexible-load orchestration, virtual grid signals, telemetry comparison, and engineering report generation.

The main idea is simple: instead of only monitoring an installed energy system, VoltPilot asks an earlier question:

"How many EV charging sessions can this site safely support, where does risk begin, and what should the next engineering action be?"

Built with Next.js, TypeScript, Tailwind CSS, Recharts, Vitest, API routes, CSV/JSON exports, Markdown reports, and GitHub Actions CI.

GitHub: https://github.com/emrefbulut/VoltPilot

#ElectricalEngineering #SmartGrid #EVCharging #EnergyManagement #TypeScript #Nextjs #PortfolioProject

## Professional Version

I am sharing VoltPilot, a portfolio project I built at the intersection of electrical engineering, grid flexibility, and software development.

VoltPilot is a pre-hardware grid-readiness cockpit for EV charging and flexible energy management. The goal is to help test a facility's electrical limits in software before purchasing physical hardware or committing to infrastructure upgrades.

Its core output is a Readiness Passport:

- It estimates the maximum safe number of EV charging sessions.
- It identifies the first EV count where transformer risk starts.
- It analyzes transformer loading, kVA, power factor, estimated current, and overload hours.
- It estimates how much a battery bridge can reduce risk.
- It compares uncontrolled, tariff-aware, orchestrated, and optimizer strategies.
- It compares measured or mock telemetry against the simulated scenario.
- It exports JSON, CSV, and Markdown engineering reports.

What makes VoltPilot different is the timing of the decision. Many energy tools focus on monitoring or optimizing systems after installation. VoltPilot focuses on the earlier engineering question:

"Can this facility support the planned EV charging load safely, and is the next action a charging policy, a battery bridge, or a transformer upgrade?"

The technical stack includes Next.js, TypeScript, Tailwind CSS, Recharts, Vitest, stateless API routes, a scenario simulation engine, telemetry comparison, a virtual grid-signal model, and GitHub Actions CI.

The data model is adapter-ready for EPIAS, ENTSO-E, Electricity Maps, and Ember. It currently runs without physical hardware by using deterministic virtual data, and it can later be extended with ESP32, smart-plug telemetry, MQTT, or live public-data providers.

GitHub repository:
https://github.com/emrefbulut/VoltPilot

Feedback and suggestions are welcome.

#ElectricalEngineering #SmartGrid #EVCharging #EnergyManagement #DemandResponse #PowerSystems #TypeScript #Nextjs #PortfolioProject

## Visual

Recommended visual for LinkedIn:

- SVG: `docs/assets/voltpilot-linkedin.svg`
- PNG: `docs/assets/voltpilot-linkedin.png`

## Posting Tip

Upload the visual manually as the first media item and place the GitHub link near the end of the post. This usually looks cleaner than relying only on automatic link previews.
