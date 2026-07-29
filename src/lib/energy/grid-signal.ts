export type FlexgridGridProvider = "demo" | "epias" | "entsoe" | "electricity-maps" | "ember";
export type FlexgridDemandRisk = "low" | "medium" | "high";
export type FlexgridGridSignalStatus = "demo" | "live" | "fallback";

export type FlexgridGridSignalInput = {
  provider?: string | null;
  date?: string | null;
};

export type FlexgridGridSignalPoint = {
  hour: string;
  hourIndex: number;
  marketPriceTlMwh: number;
  loadMw: number;
  renewableSharePct: number;
  carbonIntensityGco2Kwh: number;
  demandRisk: FlexgridDemandRisk;
};

export type FlexgridGridSignalSummary = {
  averagePriceTlMwh: number;
  peakLoadMw: number;
  peakHour: string;
  renewableSharePct: number;
  carbonIntensityGco2Kwh: number;
  highRiskHours: number;
  dispatchAdvice: string;
};

/**
 * Where each field actually came from.
 *
 * A provider can serve some fields live and leave others modeled - ENTSO-E, for
 * example, publishes load and day-ahead price but not a single carbon-intensity
 * series. Exposing this per field keeps the API from implying that everything in
 * a "live" response was measured.
 */
export type FlexgridFieldSource = "live" | "modeled";

export type FlexgridGridSignalFieldSources = {
  loadMw: FlexgridFieldSource;
  marketPriceTlMwh: FlexgridFieldSource;
  renewableSharePct: FlexgridFieldSource;
  carbonIntensityGco2Kwh: FlexgridFieldSource;
};

export type FlexgridGridSignal = {
  provider: FlexgridGridProvider;
  sourceLabel: string;
  date: string;
  status: FlexgridGridSignalStatus;
  updatedAt: string;
  points: FlexgridGridSignalPoint[];
  summary: FlexgridGridSignalSummary;
  fieldSources: FlexgridGridSignalFieldSources;
  integrationNotes: string[];
};

export const flexgridGridProviders: Array<{
  id: FlexgridGridProvider;
  label: string;
  description: string;
  sourceUrl: string;
  requiresCredential: boolean;
  credentialEnvName: string | null;
  refreshCadence: string;
  granularity: string;
  // "local"  -> generated in-process, no network call
  // "live"   -> a real adapter exists and runs when the credential is present
  // "source" -> documented target, no adapter written yet
  adapterStatus: "local" | "live" | "source";
}> = [
  {
    id: "demo",
    label: "Virtual Demo",
    description: "Keyless deterministic 24-hour grid signal for Turkey.",
    sourceUrl: "local://voltpilot/demo-grid-signal",
    requiresCredential: false,
    credentialEnvName: null,
    refreshCadence: "Generated on every request for the selected date",
    granularity: "Hourly deterministic 24-point profile",
    adapterStatus: "local"
  },
  {
    id: "epias",
    label: "EPIAS Transparency",
    description: "Official adapter target for Turkish market, generation, consumption, and transmission data.",
    sourceUrl: "https://seffaflik-prp.epias.com.tr/electricity-service/technical/tr/index.html",
    requiresCredential: true,
    credentialEnvName: "EPIAS_TGT",
    refreshCadence: "Dataset-specific according to EPIAS market and transparency publication processes",
    granularity: "Usually hourly or market-period based, depending on endpoint",
    adapterStatus: "source"
  },
  {
    id: "entsoe",
    label: "ENTSO-E",
    description: "European transparency platform adapter for load, generation, and price data.",
    sourceUrl: "https://transparency.entsoe.eu/",
    requiresCredential: true,
    credentialEnvName: "ENTSOE_TOKEN",
    refreshCadence: "Dataset-specific publication timing by transparency data item",
    granularity: "MTU-dependent, commonly 15, 30, or 60 minute electricity-market periods",
    adapterStatus: "live"
  },
  {
    id: "electricity-maps",
    label: "Electricity Maps",
    description: "Adapter target for carbon intensity, electricity mix, load, and price signals.",
    sourceUrl: "https://portal.electricitymaps.com/docs/api",
    requiresCredential: true,
    credentialEnvName: "ELECTRICITY_MAPS_TOKEN",
    refreshCadence: "API endpoint specific; the dashboard can poll latest signals on a configurable interval",
    granularity: "Hourly by default, with 5-minute and 15-minute granularities where available",
    adapterStatus: "source"
  },
  {
    id: "ember",
    label: "Ember",
    description: "Adapter target for monthly and yearly country-level demand, generation, emissions, and carbon intensity data.",
    sourceUrl: "https://ember-energy.org/data/api/",
    requiresCredential: true,
    credentialEnvName: "EMBER_API_KEY",
    refreshCadence: "Monthly Electricity Data is updated twice per month",
    granularity: "Monthly and yearly country-level electricity datasets",
    adapterStatus: "source"
  }
];

function round(value: number, precision = 1) {
  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1);
}

function isIsoDate(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const isFlexgridGridDate = isIsoDate;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function daySeed(date: string) {
  return [...date].reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function isFlexgridGridProvider(value: string | null | undefined): value is FlexgridGridProvider {
  return value === "demo" || value === "epias" || value === "entsoe" || value === "electricity-maps" || value === "ember";
}

export function normalizeGridSignalInput(input: FlexgridGridSignalInput = {}) {
  return {
    provider: isFlexgridGridProvider(input.provider) ? input.provider : "demo",
    date: isIsoDate(input.date) ? input.date : todayIsoDate()
  };
}

function sourceLabelForProvider(provider: FlexgridGridProvider) {
  return flexgridGridProviders.find((item) => item.id === provider)?.label ?? "Virtual Demo";
}

function statusForProvider(provider: FlexgridGridProvider): FlexgridGridSignalStatus {
  return provider === "demo" ? "demo" : "fallback";
}

function demandRisk(loadMw: number, priceTlMwh: number, carbonIntensity: number): FlexgridDemandRisk {
  if (loadMw >= 47_500 || priceTlMwh >= 2_600 || carbonIntensity >= 540) {
    return "high";
  }

  if (loadMw >= 42_500 || priceTlMwh >= 2_150 || carbonIntensity >= 470) {
    return "medium";
  }

  return "low";
}

function providerOffset(provider: FlexgridGridProvider) {
  const offsets: Record<FlexgridGridProvider, number> = {
    demo: 0,
    epias: 18,
    entsoe: -12,
    "electricity-maps": -28,
    ember: 8
  };

  return offsets[provider];
}

export function buildDemoGridSignal(input: FlexgridGridSignalInput = {}): FlexgridGridSignal {
  const { provider, date } = normalizeGridSignalInput(input);
  const seed = daySeed(date) + providerOffset(provider);
  const weekdayFactor = [0.94, 1, 1.02, 1.03, 1.04, 1.01, 0.96][new Date(`${date}T00:00:00.000Z`).getUTCDay()] ?? 1;
  const seasonalFactor = 1 + (Math.sin(((new Date(`${date}T00:00:00.000Z`).getUTCMonth() + 1) / 12) * Math.PI * 2) * 0.08);
  const points = Array.from({ length: 24 }, (_, hour): FlexgridGridSignalPoint => {
    const morningRamp = Math.exp(-((hour - 9) ** 2) / 18) * 3_800;
    const eveningPeak = Math.exp(-((hour - 20) ** 2) / 10) * 7_100;
    const nightDip = hour <= 5 ? -3_100 : 0;
    const solarRelief = hour >= 11 && hour <= 15 ? -1_400 : 0;
    const deterministicNoise = Math.sin((hour + seed) * 1.7) * 420;
    const loadMw = Math.max(29_500, (38_400 + morningRamp + eveningPeak + nightDip + solarRelief + deterministicNoise) * weekdayFactor * seasonalFactor);
    const solarShare = hour >= 8 && hour <= 17 ? Math.sin(((hour - 8) / 9) * Math.PI) * 14 : 0;
    const windSwing = 8 + Math.sin((hour + seed) / 3) * 4;
    const hydroBase = 17 + Math.cos((hour + seed) / 8) * 2;
    const renewableSharePct = Math.max(22, Math.min(58, hydroBase + windSwing + solarShare));
    const carbonIntensityGco2Kwh = Math.max(310, 590 - renewableSharePct * 3.9 + (hour >= 18 && hour <= 22 ? 55 : 0));
    const marketPriceTlMwh = Math.max(
      1_250,
      1_520 + (loadMw - 34_000) * 0.058 + (carbonIntensityGco2Kwh - 380) * 1.7 + (hour >= 18 && hour <= 22 ? 240 : 0)
    );

    return {
      hour: `${hour.toString().padStart(2, "0")}:00`,
      hourIndex: hour,
      marketPriceTlMwh: round(marketPriceTlMwh, 0),
      loadMw: round(loadMw, 0),
      renewableSharePct: round(renewableSharePct, 0),
      carbonIntensityGco2Kwh: round(carbonIntensityGco2Kwh, 0),
      demandRisk: demandRisk(loadMw, marketPriceTlMwh, carbonIntensityGco2Kwh)
    };
  });
  const peakPoint = points.reduce((peak, point) => (point.loadMw > peak.loadMw ? point : peak), points[0]!);
  const highRiskHours = points.filter((point) => point.demandRisk === "high").length;

  return {
    provider,
    sourceLabel: sourceLabelForProvider(provider),
    date,
    status: statusForProvider(provider),
    updatedAt: new Date(`${date}T12:00:00.000Z`).toISOString(),
    points,
    summary: {
      averagePriceTlMwh: round(average(points.map((point) => point.marketPriceTlMwh)), 0),
      peakLoadMw: peakPoint.loadMw,
      peakHour: peakPoint.hour,
      renewableSharePct: round(average(points.map((point) => point.renewableSharePct)), 0),
      carbonIntensityGco2Kwh: round(average(points.map((point) => point.carbonIntensityGco2Kwh)), 0),
      highRiskHours,
      dispatchAdvice:
        highRiskHours > 0
          ? "Reschedule EV charging and battery discharge around the high-risk grid hours."
          : "Grid risk is low; move flexible loads toward low-price and low-carbon hours."
    },
    fieldSources: {
      loadMw: "modeled",
      marketPriceTlMwh: "modeled",
      renewableSharePct: "modeled",
      carbonIntensityGco2Kwh: "modeled"
    },
    integrationNotes:
      provider === "demo"
        ? ["This is deterministic virtual data; it does not require physical hardware or an API key."]
        : [
            `${sourceLabelForProvider(provider)} is selected; virtual fallback data is used with the same schema until credentials are configured.`,
            "The endpoint contract stays stable when a live adapter is added."
          ]
  };
}

function summarize(points: FlexgridGridSignalPoint[]): FlexgridGridSignalSummary {
  const peakPoint = points.reduce((peak, point) => (point.loadMw > peak.loadMw ? point : peak), points[0]!);
  const highRiskHours = points.filter((point) => point.demandRisk === "high").length;

  return {
    averagePriceTlMwh: round(average(points.map((point) => point.marketPriceTlMwh)), 0),
    peakLoadMw: peakPoint.loadMw,
    peakHour: peakPoint.hour,
    renewableSharePct: round(average(points.map((point) => point.renewableSharePct)), 0),
    carbonIntensityGco2Kwh: round(average(points.map((point) => point.carbonIntensityGco2Kwh)), 0),
    highRiskHours,
    dispatchAdvice:
      highRiskHours > 0
        ? "Reschedule EV charging and battery discharge around the high-risk grid hours."
        : "Grid risk is low; move flexible loads toward low-price and low-carbon hours."
  };
}

/**
 * Overlays measured hourly series onto the modeled baseline.
 *
 * Any hour a provider did not publish keeps its modeled value, so the 24-point
 * contract never develops holes. A field is only reported as `live` when at
 * least one real hour came back for it.
 */
export function applyLiveGridSeries(
  baseline: FlexgridGridSignal,
  live: {
    loadMw?: Array<number | null>;
    marketPriceTlMwh?: Array<number | null>;
  }
): FlexgridGridSignal {
  const loadIsLive = (live.loadMw ?? []).some((value) => typeof value === "number");
  const priceIsLive = (live.marketPriceTlMwh ?? []).some((value) => typeof value === "number");

  if (!loadIsLive && !priceIsLive) {
    return baseline;
  }

  const points = baseline.points.map((point, hour): FlexgridGridSignalPoint => {
    const measuredLoad = live.loadMw?.[hour];
    const measuredPrice = live.marketPriceTlMwh?.[hour];
    const loadMw = typeof measuredLoad === "number" ? round(measuredLoad, 0) : point.loadMw;
    const marketPriceTlMwh =
      typeof measuredPrice === "number" ? round(measuredPrice, 0) : point.marketPriceTlMwh;

    return {
      ...point,
      loadMw,
      marketPriceTlMwh,
      demandRisk: demandRisk(loadMw, marketPriceTlMwh, point.carbonIntensityGco2Kwh)
    };
  });

  const measuredFields = [
    loadIsLive ? "system load" : null,
    priceIsLive ? "day-ahead price" : null
  ].filter(Boolean);

  return {
    ...baseline,
    status: "live",
    updatedAt: new Date().toISOString(),
    points,
    summary: summarize(points),
    fieldSources: {
      loadMw: loadIsLive ? "live" : "modeled",
      marketPriceTlMwh: priceIsLive ? "live" : "modeled",
      renewableSharePct: "modeled",
      carbonIntensityGco2Kwh: "modeled"
    },
    integrationNotes: [
      `Measured from ${baseline.sourceLabel}: ${measuredFields.join(" and ")}.`,
      "Renewable share and carbon intensity are not published as single series by this provider, so they remain modeled. See fieldSources.",
      "Hours the provider had not published yet keep their modeled value."
    ]
  };
}
