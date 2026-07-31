import { NextResponse } from "next/server";
import {
  applyLiveGridSeries,
  buildDemoGridSignal,
  flexgridGridProviders,
  isFlexgridGridDate,
  isFlexgridGridProvider,
  normalizeGridSignalInput,
  type FlexgridGridSignal
} from "@/src/lib/energy/grid-signal";
import { fetchEntsoeDay } from "@/src/lib/energy/providers/entsoe";

/**
 * Upgrades the modeled signal with measured data when a provider adapter and its
 * credential are both available.
 *
 * A failure here is never fatal: the modeled signal is returned with
 * `status: "fallback"` and a note explaining why, so the endpoint contract holds
 * whether or not the upstream API is reachable.
 */
async function withLiveData(signal: FlexgridGridSignal): Promise<FlexgridGridSignal> {
  if (signal.provider !== "entsoe") {
    return signal;
  }

  const securityToken = process.env.ENTSOE_TOKEN;
  if (!securityToken) {
    return {
      ...signal,
      integrationNotes: [
        "ENTSO-E adapter is implemented but ENTSOE_TOKEN is not set, so modeled data is returned.",
        "Request a free token from the ENTSO-E Transparency Platform to receive measured load and day-ahead price.",
        ...signal.integrationNotes.slice(1)
      ]
    };
  }

  try {
    const live = await fetchEntsoeDay({ date: signal.date, securityToken });

    return applyLiveGridSeries(signal, {
      loadMw: live.loadMw,
      marketPriceTlMwh: live.priceTlMwh
    });
  } catch (error) {
    return {
      ...signal,
      integrationNotes: [
        `Live ENTSO-E fetch failed, modeled data is returned: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
        ...signal.integrationNotes.slice(1)
      ]
    };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerParam = url.searchParams.get("provider");
  const dateParam = url.searchParams.get("date");

  if (providerParam !== null && !isFlexgridGridProvider(providerParam)) {
    return NextResponse.json(
      {
        error: "INVALID_GRID_PROVIDER",
        message: "provider must be demo, epias, entsoe, electricity-maps, or ember.",
        allowedProviders: flexgridGridProviders.map((provider) => provider.id)
      },
      { status: 400 }
    );
  }

  if (dateParam !== null && !isFlexgridGridDate(dateParam)) {
    return NextResponse.json(
      {
        error: "INVALID_GRID_DATE",
        message: "date must use YYYY-MM-DD format."
      },
      { status: 400 }
    );
  }

  const input = normalizeGridSignalInput({
    provider: providerParam,
    date: dateParam
  });
  const signal = await withLiveData(buildDemoGridSignal(input));

  return NextResponse.json({
    ...signal,
    providers: flexgridGridProviders
  });
}
