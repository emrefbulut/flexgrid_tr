export const flexgridCopy = {
  brand: {
    name: "VoltPilot",
    label: "Energy decision cockpit",
    title: "Energy decision cockpit for EV charging, transformer loading, grid signals, and telemetry validation.",
    description:
      "VoltPilot is a scenario, optimization, and reporting cockpit for buildings and small facilities."
  },
  phases: [
    {
      week: "Module 1",
      title: "Scenario engine",
      description:
        "Facility profile, EV demand, tariff, battery SoC, kVA loading, current estimate, and exportable scenario data."
    },
    {
      week: "Module 2",
      title: "Decision cockpit",
      description:
        "Peak reduction, monthly savings, carbon impact, transformer stress, engineering confidence, and strategy recommendations."
    },
    {
      week: "Module 3",
      title: "Telemetry validation",
      description:
        "Demo or measured data is compared with the model profile through a stateless POST API."
    },
    {
      week: "Module 4",
      title: "Grid signal and report",
      description:
        "EPIAS, ENTSO-E, Electricity Maps, and Ember source metadata, grid signal, CSV, JSON, and Markdown report output."
    }
  ]
} as const;
