"use client";

import {useEffect, useMemo, useState} from "react";
import type {BuildStep} from "@/lib/compiler";
import type {AppLocale} from "@/i18n/routing";

export function BuildGuide({
  modelId,
  planFingerprint,
  steps,
  locale
}: {
  modelId: string;
  planFingerprint: string;
  steps: BuildStep[];
  locale: AppLocale;
}) {
  const isSr = locale === "sr";
  const storageKey = `sapice:build:${modelId}:${planFingerprint}`;
  const [completed, setCompleted] = useState<string[]>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCompleted(parsed.filter((value): value is string => typeof value === "string"));
        }
      } catch {
        // Invalid local progress is ignored.
      }
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, ready, storageKey]);

  useEffect(() => {
    if (focusIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocusIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusIndex]);

  const completeSet = useMemo(() => new Set(completed), [completed]);
  const doneCount = steps.filter((step) => completeSet.has(step.id)).length;
  const progress = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);

  const toggle = (id: string) => {
    setCompleted((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const focused = focusIndex === null ? null : steps[focusIndex];

  return (
    <>
      <div className="build-guide-head">
        <div>
          <strong>{doneCount} / {steps.length}</strong>
          <span>{isSr ? "koraka završeno" : "steps completed"}</span>
        </div>
        <div className="build-progress" aria-label={isSr ? "Napredak izrade" : "Build progress"}>
          <span style={{width: `${progress}%`}} />
        </div>
        <button type="button" onClick={() => setFocusIndex(0)} disabled={steps.length === 0}>
          {isSr ? "Režim izrade" : "Build mode"}
        </button>
      </div>

      <ol className="build-steps interactive">
        {steps.map((step, index) => {
          const done = completeSet.has(step.id);
          return (
            <li key={step.id} className={done ? "done" : ""}>
              <button
                type="button"
                className="step-check"
                aria-pressed={done}
                aria-label={
                  isSr
                    ? `${done ? "Označi kao nezavršeno" : "Označi kao završeno"}: ${step.titleSr}`
                    : `${done ? "Mark incomplete" : "Mark complete"}: ${step.titleEn}`
                }
                onClick={() => toggle(step.id)}
              >
                {done ? "✓" : String(index + 1).padStart(2, "0")}
              </button>
              <div>
                <h3>{isSr ? step.titleSr : step.titleEn}</h3>
                <p>{isSr ? step.detailSr : step.detailEn}</p>
                <button type="button" className="step-focus-link" onClick={() => setFocusIndex(index)}>
                  {isSr ? "Otvori korak" : "Open step"} →
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {focused && focusIndex !== null && (
        <div className="build-focus" role="dialog" aria-modal="true" aria-labelledby="build-focus-title">
          <div className="build-focus-card">
            <header>
              <div>
                <span className="kicker">
                  {isSr ? "Korak" : "Step"} {focusIndex + 1} / {steps.length}
                </span>
                <h2 id="build-focus-title">{isSr ? focused.titleSr : focused.titleEn}</h2>
              </div>
              <button
                type="button"
                className="focus-close"
                aria-label={isSr ? "Zatvori režim izrade" : "Close build mode"}
                onClick={() => setFocusIndex(null)}
              >
                ×
              </button>
            </header>

            <p>{isSr ? focused.detailSr : focused.detailEn}</p>

            <label className="focus-complete">
              <input
                type="checkbox"
                checked={completeSet.has(focused.id)}
                onChange={() => toggle(focused.id)}
              />
              <span>{isSr ? "Ovaj korak je završen" : "This step is complete"}</span>
            </label>

            <footer>
              <button
                type="button"
                disabled={focusIndex === 0}
                onClick={() => setFocusIndex((value) => value === null ? 0 : Math.max(0, value - 1))}
              >
                ← {isSr ? "Prethodni" : "Previous"}
              </button>
              <button
                type="button"
                disabled={focusIndex === steps.length - 1}
                onClick={() => setFocusIndex((value) => value === null ? 0 : Math.min(steps.length - 1, value + 1))}
              >
                {isSr ? "Sledeći" : "Next"} →
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
