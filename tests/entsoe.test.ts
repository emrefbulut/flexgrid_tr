import { describe, expect, it } from "vitest";
import {
  buildEntsoeRequestUrl,
  EntsoeError,
  fetchEntsoeDay,
  formatEntsoeInstant,
  istanbulDayUtcRange,
  istanbulHourOf,
  parseEntsoeDocument,
  toIstanbulHourlySeries
} from "@/src/lib/energy/providers/entsoe";
import { applyLiveGridSeries, buildDemoGridSignal } from "@/src/lib/energy/grid-signal";

const LOAD_DOCUMENT = `<?xml version="1.0" encoding="UTF-8"?>
<GL_MarketDocument xmlns="urn:iec62325.351:tc57wg16:451-6:generationloaddocument:3:0">
  <TimeSeries>
    <Period>
      <timeInterval>
        <start>2026-07-29T21:00Z</start>
        <end>2026-07-30T21:00Z</end>
      </timeInterval>
      <resolution>PT60M</resolution>
      <Point><position>1</position><quantity>31000</quantity></Point>
      <Point><position>2</position><quantity>30250</quantity></Point>
      <Point><position>21</position><quantity>48800</quantity></Point>
    </Period>
  </TimeSeries>
</GL_MarketDocument>`;

const PRICE_DOCUMENT = `<?xml version="1.0" encoding="UTF-8"?>
<Publication_MarketDocument xmlns="urn:iec62325.351:tc57wg16:451-3:publicationdocument:7:0">
  <TimeSeries>
    <Period>
      <timeInterval>
        <start>2026-07-29T21:00Z</start>
        <end>2026-07-30T21:00Z</end>
      </timeInterval>
      <resolution>PT60M</resolution>
      <Point><position>1</position><price.amount>1420.55</price.amount></Point>
      <Point><position>21</position><price.amount>3180.10</price.amount></Point>
    </Period>
  </TimeSeries>
</Publication_MarketDocument>`;

const QUARTER_HOURLY_DOCUMENT = `<?xml version="1.0" encoding="UTF-8"?>
<GL_MarketDocument>
  <TimeSeries>
    <Period>
      <timeInterval><start>2026-07-29T21:00Z</start><end>2026-07-29T22:00Z</end></timeInterval>
      <resolution>PT15M</resolution>
      <Point><position>1</position><quantity>100</quantity></Point>
      <Point><position>2</position><quantity>200</quantity></Point>
      <Point><position>3</position><quantity>300</quantity></Point>
      <Point><position>4</position><quantity>400</quantity></Point>
    </Period>
  </TimeSeries>
</GL_MarketDocument>`;

const REJECTION_DOCUMENT = `<?xml version="1.0" encoding="UTF-8"?>
<Acknowledgement_MarketDocument>
  <Reason>
    <code>999</code>
    <text>No matching data found</text>
  </Reason>
</Acknowledgement_MarketDocument>`;

describe("entsoe time helpers", () => {
  it("formats instants as yyyyMMddHHmm in UTC", () => {
    expect(formatEntsoeInstant(new Date("2026-07-29T21:00:00.000Z"))).toBe("202607292100");
  });

  it("maps an Istanbul day onto its UTC bounds", () => {
    const range = istanbulDayUtcRange("2026-07-30");

    // Local midnight in Türkiye (UTC+3) is 21:00Z on the previous day.
    expect(range.start.toISOString()).toBe("2026-07-29T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-30T21:00:00.000Z");
  });

  it("resolves the Istanbul hour of an instant", () => {
    expect(istanbulHourOf(new Date("2026-07-29T21:00:00.000Z"))).toBe(0);
    expect(istanbulHourOf(new Date("2026-07-30T17:00:00.000Z"))).toBe(20);
  });

  it("rejects a malformed date", () => {
    expect(() => istanbulDayUtcRange("not-a-date")).toThrow(EntsoeError);
  });
});

describe("buildEntsoeRequestUrl", () => {
  it("requests realised load with the bidding-zone domain", () => {
    const url = buildEntsoeRequestUrl({
      documentType: "A65",
      date: "2026-07-30",
      securityToken: "token-abc"
    });

    expect(url.origin + url.pathname).toBe("https://web-api.tp.entsoe.eu/api");
    expect(url.searchParams.get("documentType")).toBe("A65");
    expect(url.searchParams.get("processType")).toBe("A16");
    expect(url.searchParams.get("outBiddingZone_Domain")).toBe("10YTR-TEIAS----W");
    expect(url.searchParams.get("periodStart")).toBe("202607292100");
    expect(url.searchParams.get("periodEnd")).toBe("202607302100");
  });

  it("requests day-ahead prices with in and out domains", () => {
    const url = buildEntsoeRequestUrl({
      documentType: "A44",
      date: "2026-07-30",
      securityToken: "token-abc"
    });

    expect(url.searchParams.get("in_Domain")).toBe("10YTR-TEIAS----W");
    expect(url.searchParams.get("out_Domain")).toBe("10YTR-TEIAS----W");
    expect(url.searchParams.has("processType")).toBe(false);
  });
});

describe("parseEntsoeDocument", () => {
  it("reads quantity points and offsets them by position", () => {
    const points = parseEntsoeDocument(LOAD_DOCUMENT);

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ at: new Date("2026-07-29T21:00:00.000Z"), value: 31000 });
    expect(points[1]!.at.toISOString()).toBe("2026-07-29T22:00:00.000Z");
    expect(points[2]!.at.toISOString()).toBe("2026-07-30T17:00:00.000Z");
  });

  it("reads price points", () => {
    const points = parseEntsoeDocument(PRICE_DOCUMENT);

    expect(points[0]!.value).toBeCloseTo(1420.55);
    expect(points[1]!.value).toBeCloseTo(3180.1);
  });

  it("throws with the upstream reason when ENTSO-E rejects the request", () => {
    expect(() => parseEntsoeDocument(REJECTION_DOCUMENT)).toThrow(/No matching data found/);
  });

  it("returns nothing for a document with no periods", () => {
    expect(parseEntsoeDocument("<GL_MarketDocument></GL_MarketDocument>")).toEqual([]);
  });
});

describe("toIstanbulHourlySeries", () => {
  it("places points in their Istanbul hour and leaves gaps null", () => {
    const series = toIstanbulHourlySeries(parseEntsoeDocument(LOAD_DOCUMENT));

    expect(series).toHaveLength(24);
    expect(series[0]).toBe(31000);
    expect(series[1]).toBe(30250);
    expect(series[20]).toBe(48800);
    expect(series[5]).toBeNull();
  });

  it("averages sub-hourly resolutions into their hour", () => {
    const series = toIstanbulHourlySeries(parseEntsoeDocument(QUARTER_HOURLY_DOCUMENT));

    expect(series[0]).toBe(250); // (100 + 200 + 300 + 400) / 4
  });
});

describe("fetchEntsoeDay", () => {
  function respond(body: string) {
    return new Response(body, { status: 200, headers: { "Content-Type": "application/xml" } });
  }

  it("returns both series when the platform answers", async () => {
    const result = await fetchEntsoeDay({
      date: "2026-07-30",
      securityToken: "token-abc",
      fetchImpl: (async (input: string | URL | Request) => {
        const url = new URL(input.toString());

        return respond(url.searchParams.get("documentType") === "A65" ? LOAD_DOCUMENT : PRICE_DOCUMENT);
      }) as typeof fetch
    });

    expect(result.loadMw[0]).toBe(31000);
    expect(result.priceTlMwh[20]).toBeCloseTo(3180.1);
  });

  it("keeps the series that succeeded when the other one fails", async () => {
    const result = await fetchEntsoeDay({
      date: "2026-07-30",
      securityToken: "token-abc",
      fetchImpl: (async (input: string | URL | Request) => {
        const url = new URL(input.toString());
        if (url.searchParams.get("documentType") === "A65") {
          return respond(LOAD_DOCUMENT);
        }

        return new Response("nope", { status: 500 });
      }) as typeof fetch
    });

    expect(result.loadMw[0]).toBe(31000);
    expect(result.priceTlMwh.every((value) => value === null)).toBe(true);
  });

  it("throws when both requests fail", async () => {
    await expect(
      fetchEntsoeDay({
        date: "2026-07-30",
        securityToken: "token-abc",
        fetchImpl: (async () => new Response("nope", { status: 503 })) as typeof fetch
      })
    ).rejects.toBeInstanceOf(EntsoeError);
  });
});

describe("applyLiveGridSeries", () => {
  it("keeps modeled values where the provider published nothing", () => {
    const baseline = buildDemoGridSignal({ provider: "entsoe", date: "2026-07-30" });
    const loadMw = Array.from({ length: 24 }, (_, hour) => (hour === 3 ? 41234 : null));

    const merged = applyLiveGridSeries(baseline, { loadMw });

    expect(merged.status).toBe("live");
    expect(merged.points[3]!.loadMw).toBe(41234);
    expect(merged.points[4]!.loadMw).toBe(baseline.points[4]!.loadMw);
    expect(merged.points).toHaveLength(24);
  });

  it("marks only the measured fields as live", () => {
    const baseline = buildDemoGridSignal({ provider: "entsoe", date: "2026-07-30" });
    const merged = applyLiveGridSeries(baseline, {
      loadMw: Array.from({ length: 24 }, () => 40000)
    });

    expect(merged.fieldSources.loadMw).toBe("live");
    expect(merged.fieldSources.marketPriceTlMwh).toBe("modeled");
    expect(merged.fieldSources.carbonIntensityGco2Kwh).toBe("modeled");
  });

  it("returns the baseline untouched when nothing was measured", () => {
    const baseline = buildDemoGridSignal({ provider: "entsoe", date: "2026-07-30" });
    const merged = applyLiveGridSeries(baseline, {
      loadMw: Array.from({ length: 24 }, () => null)
    });

    expect(merged).toBe(baseline);
    expect(merged.status).toBe("fallback");
  });

  it("recomputes the summary from the merged points", () => {
    const baseline = buildDemoGridSignal({ provider: "entsoe", date: "2026-07-30" });
    const loadMw = Array.from({ length: 24 }, (_, hour) => (hour === 12 ? 99000 : 30000));

    const merged = applyLiveGridSeries(baseline, { loadMw });

    expect(merged.summary.peakLoadMw).toBe(99000);
    expect(merged.summary.peakHour).toBe("12:00");
  });
});
