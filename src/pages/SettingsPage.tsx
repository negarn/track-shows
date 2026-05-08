import { CloudSyncSection } from "../components/CloudSyncSection";

export function SettingsPage(): JSX.Element {
  return (
    <div className="grid gap-8">
      <CloudSyncSection />

      <section className="grid gap-4">
        <div className="grid gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.45em] text-ember-200/75">
            API details
          </h2>
          <p className="text-sm leading-6 text-slate-300">
            TV show search, schedules, and episode metadata are provided by{" "}
            <a
              className="cursor-pointer font-semibold text-ember-100 underline decoration-ember-200/35 underline-offset-4 transition hover:text-ember-50 hover:decoration-ember-100"
              href="https://www.tvmaze.com/"
              rel="noreferrer"
              target="_blank"
            >
              TVmaze
            </a>{" "}
            under CC BY-SA.
          </p>
        </div>
      </section>
    </div>
  );
}
