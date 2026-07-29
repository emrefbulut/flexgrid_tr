/**
 * ENTSO-E Transparency Platform adapter.
 *
 * Fetches two live series for a single Turkish market day and maps them onto the
 * 24 hourly points VoltPilot already uses:
 *
 *   - A65 (System total load, actual)  -> loadMw
 *   - A44 (Day-ahead prices)           -> marketPriceTlMwh
 *
 * Renewable share and carbon intensity are NOT published as single series by
 * ENTSO-E, so those two fields stay modeled. The returned signal reports which
 * field came from where via `fieldSources`, so nothing in the UI or the API
 * claims to be measured when it is not.
 *
 * Docs: https://documenter.getpostman.com/view/7009892/2s93JtP3F6
 */

export const ENTSOE_API_BASE = "https://web-api.tp.entsoe.eu/api";

/** EIC code for the Turkish bidding zone (TEİAŞ). */
export const ENTSOE_TURKEY_DOMAIN = "10YTR-TEIAS----W";

/** Türkiye stays on UTC+03:00 all year, so there is no DST transition to model. */
const TURKEY_UTC_OFFSET_HOURS = 3;

export type EntsoeDocumentType = "A44" | "A65";

export type EntsoePoint = {
  /** Absolute UTC timestamp of the start of this measurement period. */
  at: Date;
  value: number;
};

export class EntsoeError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "EntsoeError";
    this.cause = cause;
  }
}

/** ENTSO-E expects period bounds as `yyyyMMddHHmm` in UTC. */
export function formatEntsoeInstant(value: Date) {
  const iso = value.toISOString();

  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(11, 13)}${iso.slice(14, 16)}`;
}

/**
 * UTC bounds of one Istanbul calendar day.
 *
 * `2026-07-30` locally starts at `2026-07-29T21:00Z` and ends 24 hours later.
 */
export function istanbulDayUtcRange(date: string) {
  const localMidnightAsUtc = new Date(`${date}T00:00:00.000Z`).getTime();
  if (Number.isNaN(localMidnightAsUtc)) {
    throw new EntsoeError(`Invalid date: ${date}`);
  }

  const start = new Date(localMidnightAsUtc - TURKEY_UTC_OFFSET_HOURS * 3_600_000);

  return {
    start,
    end: new Date(start.getTime() + 24 * 3_600_000)
  };
}

/** Istanbul hour-of-day (0-23) for an absolute instant. */
export function istanbulHourOf(instant: Date) {
  const shifted = new Date(instant.getTime() + TURKEY_UTC_OFFSET_HOURS * 3_600_000);

  return shifted.getUTCHours();
}

export function buildEntsoeRequestUrl(input: {
  documentType: EntsoeDocumentType;
  date: string;
  securityToken: string;
}) {
  const { start, end } = istanbulDayUtcRange(input.date);
  const url = new URL(ENTSOE_API_BASE);

  url.searchParams.set("securityToken", input.securityToken);
  url.searchParams.set("documentType", input.documentType);
  url.searchParams.set("periodStart", formatEntsoeInstant(start));
  url.searchParams.set("periodEnd", formatEntsoeInstant(end));

  if (input.documentType === "A44") {
    // Day-ahead prices are requested with the same zone on both sides.
    url.searchParams.set("in_Domain", ENTSOE_TURKEY_DOMAIN);
    url.searchParams.set("out_Domain", ENTSOE_TURKEY_DOMAIN);
  } else {
    url.searchParams.set("processType", "A16"); // realised
    url.searchParams.set("outBiddingZone_Domain", ENTSOE_TURKEY_DOMAIN);
  }

  return url;
}

function resolutionToMinutes(resolution: string) {
  const match = /^PT(\d+)M$/.exec(resolution.trim());
  if (match) {
    return Number(match[1]);
  }

  if (/^PT(\d+)H$/.test(resolution.trim())) {
    return Number(/^PT(\d+)H$/.exec(resolution.trim())![1]) * 60;
  }

  return null;
}

function matchAll(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)];
}

/**
 * Extracts the points of every `<Period>` in an ENTSO-E market document.
 *
 * The schema is small and stable (`Period` -> `timeInterval/start`, `resolution`,
 * repeated `Point` with `position` plus either `quantity` or `price.amount`), so
 * this reads it directly instead of pulling in an XML dependency. Anything that
 * does not match the expected shape is skipped rather than guessed at.
 */
export function parseEntsoeDocument(xml: string): EntsoePoint[] {
  if (/<(?:Acknowledgement_MarketDocument)/.test(xml)) {
    const reason = /<text>([^<]*)<\/text>/.exec(xml)?.[1]?.trim();
    throw new EntsoeError(reason ? `ENTSO-E rejected the request: ${reason}` : "ENTSO-E returned no data");
  }

  const points: EntsoePoint[] = [];

  for (const periodMatch of matchAll(xml, /<Period>([\s\S]*?)<\/Period>/g)) {
    const period = periodMatch[1] ?? "";
    const start = /<timeInterval>[\s\S]*?<start>([^<]+)<\/start>/.exec(period)?.[1]?.trim();
    const resolution = /<resolution>([^<]+)<\/resolution>/.exec(period)?.[1];

    if (!start || !resolution) {
      continue;
    }

    const stepMinutes = resolutionToMinutes(resolution);
    if (!stepMinutes) {
      continue;
    }

    // ENTSO-E writes interval bounds as `2026-07-29T21:00Z`, which `Date` parses.
    const startMs = new Date(start).getTime();
    if (Number.isNaN(startMs)) {
      continue;
    }

    for (const pointMatch of matchAll(period, /<Point>([\s\S]*?)<\/Point>/g)) {
      const point = pointMatch[1] ?? "";
      const position = Number(/<position>(\d+)<\/position>/.exec(point)?.[1]);
      const rawValue =
        /<quantity>([-\d.eE+]+)<\/quantity>/.exec(point)?.[1] ??
        /<price\.amount>([-\d.eE+]+)<\/price\.amount>/.exec(point)?.[1];

      if (!Number.isInteger(position) || position < 1 || rawValue === undefined) {
        continue;
      }

      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        continue;
      }

      points.push({
        at: new Date(startMs + (position - 1) * stepMinutes * 60_000),
        value
      });
    }
  }

  return points;
}

/**
 * Collapses points of any resolution into 24 hourly Istanbul buckets.
 *
 * Sub-hourly resolutions (PT15M, PT30M) are averaged into their hour. Hours with
 * no data stay `null` so callers can decide whether to fall back.
 */
export function toIstanbulHourlySeries(points: EntsoePoint[]): Array<number | null> {
  const totals = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));

  for (const point of points) {
    const bucket = totals[istanbulHourOf(point.at)];
    if (!bucket) {
      continue;
    }

    bucket.sum += point.value;
    bucket.count += 1;
  }

  return totals.map((bucket) => (bucket.count > 0 ? bucket.sum / bucket.count : null));
}

export type EntsoeFetchOptions = {
  date: string;
  securityToken: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

async function fetchSeries(documentType: EntsoeDocumentType, options: EntsoeFetchOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = buildEntsoeRequestUrl({
    documentType,
    date: options.date,
    securityToken: options.securityToken
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: "application/xml" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new EntsoeError(`ENTSO-E responded with HTTP ${response.status} for ${documentType}`);
    }

    return toIstanbulHourlySeries(parseEntsoeDocument(await response.text()));
  } catch (error) {
    if (error instanceof EntsoeError) {
      throw error;
    }

    throw new EntsoeError(`ENTSO-E request failed for ${documentType}`, error);
  } finally {
    clearTimeout(timeout);
  }
}

export type EntsoeLiveSeries = {
  /** Hourly system load in MW, Istanbul local hours. `null` where unpublished. */
  loadMw: Array<number | null>;
  /** Hourly day-ahead price. `null` where unpublished. */
  priceTlMwh: Array<number | null>;
};

/**
 * Fetches load and price for one Istanbul day.
 *
 * The two requests are independent; if only one succeeds the other comes back as
 * all-`null` and the caller keeps its modeled values for that field.
 */
export async function fetchEntsoeDay(options: EntsoeFetchOptions): Promise<EntsoeLiveSeries> {
  const [load, price] = await Promise.allSettled([
    fetchSeries("A65", options),
    fetchSeries("A44", options)
  ]);

  const empty = Array.from({ length: 24 }, () => null);

  if (load.status === "rejected" && price.status === "rejected") {
    throw load.reason instanceof EntsoeError
      ? load.reason
      : new EntsoeError("ENTSO-E returned no usable series", load.reason);
  }

  return {
    loadMw: load.status === "fulfilled" ? load.value : empty,
    priceTlMwh: price.status === "fulfilled" ? price.value : empty
  };
}
