import { Activity, ArrowUpRight, Cpu, Database, GitBranch, Layers3, PlugZap, RadioTower } from "lucide-react";
import { flexgridCopy } from "@/src/content/flexgrid-copy";
import { FlexgridSimulator } from "@/components/energy/flexgrid-simulator";
import { flexgridGridProviders } from "@/src/lib/energy/grid-signal";

const architectureSteps = [
  {
    title: "Scenario inputs",
    description: "Facility type, tariff, EV intensity, storage, and control strategy feed the model.",
    icon: PlugZap
  },
  {
    title: "Optimization engine",
    description: "Hourly kW, kVA, current, battery SoC, cost, carbon, and confidence are calculated together.",
    icon: Cpu
  },
  {
    title: "Telemetry validation",
    description: "Demo or measured samples are compared with the simulated dispatch profile.",
    icon: Layers3
  },
  {
    title: "Reporting layer",
    description: "JSON, CSV, grid signal, and report outputs use the same tested model.",
    icon: Database
  }
];

export function FlexgridPage() {
  return (
    <main className="bg-[#f5f7f3]">
      <FlexgridSimulator />

      <section id="architecture" className="border-y border-slate-900 bg-[#081113] px-4 py-16 text-white md:px-6">
        <div className="mx-auto grid max-w-[96rem] gap-10 xl:grid-cols-[0.9fr_1.4fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-teal-100">
              <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
              Scope
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
              One decision engine powers the cockpit, API outputs, telemetry comparison, and report.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/65">
              VoltPilot keeps the facility scenario in one model, so the interface, exports, tests, and reporting use the
              same calculated output.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2">
            {architectureSteps.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="bg-[#0d191c] p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-400 text-slate-950">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/62">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-16 md:px-6">
        <div className="mx-auto max-w-[96rem]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-teal-800">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Data sources
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-5xl">
              Grid signals are selectable, traceable, and connected to the decision screen.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              EPIAS, ENTSO-E, Electricity Maps, Ember, and local virtual data use the same format; source, credential,
              refresh cadence, and granularity are shown openly.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            {flexgridGridProviders.map((provider) => {
              const isExternal = provider.sourceUrl.startsWith("https://");

              return (
                <article key={provider.id} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{provider.label}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{provider.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-500">
                      {provider.adapterStatus === "local" ? "local" : "source"}
                    </span>
                  </div>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">Credential</dt>
                      <dd className="mt-1 text-slate-700">{provider.credentialEnvName ?? "None"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">Refresh</dt>
                      <dd className="mt-1 leading-5 text-slate-700">{provider.refreshCadence}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">Granularity</dt>
                      <dd className="mt-1 leading-5 text-slate-700">{provider.granularity}</dd>
                    </div>
                  </dl>
                  {isExternal ? (
                    <a
                      href={provider.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 underline-offset-4 hover:underline"
                    >
                      Source documentation
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="mt-4 text-xs font-semibold text-slate-500">Local deterministic source</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="reports" className="px-4 py-16 md:px-6">
        <div className="mx-auto grid max-w-[96rem] gap-10 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm">
              <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
              Reporting
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-5xl">
              The same result language stays intact from cockpit to report.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              VoltPilot tracks the scenario, compares it against measurements, exports it, and turns it into an engineering report.
            </p>
          </div>

          <div className="relative grid gap-4">
            <div className="absolute bottom-0 left-5 top-0 hidden w-px bg-slate-200 md:block" />
            {flexgridCopy.phases.map((phase) => (
              <article key={phase.week} className="relative grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:grid-cols-[8rem_minmax(0,1fr)]">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                    {phase.week.replace("Module ", "M")}
                  </span>
                  <p className="text-sm font-semibold text-teal-700 md:hidden">{phase.week}</p>
                </div>
                <div>
                  <p className="hidden text-sm font-semibold text-teal-700 md:block">{phase.week}</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">{phase.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{phase.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 px-4 py-16 md:px-6">
        <div className="mx-auto grid max-w-[96rem] gap-8 xl:grid-cols-[minmax(0,1fr)_34rem]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <Activity className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              Product value
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-5xl">
              VoltPilot leaves an audit trail while it makes decisions.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Every scenario is produced from the same calculation frame as a shareable URL, CSV, JSON, grid signal, and
              engineering report.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Shareable", "URL parameters carry the scenario state."],
              ["Validatable", "Telemetry comparison runs on the same profile."],
              ["Exportable", "CSV, JSON, and Markdown reports use the same calculations."]
            ].map(([title, description]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold text-teal-700">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
