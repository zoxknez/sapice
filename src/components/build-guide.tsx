"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
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
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, ready, storageKey]);

  const closeFocusMode = useCallback(() => {
    setFocusIndex(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openFocusMode = (index: number) => {
    if (focusIndex === null) {
      triggerRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    }
    setFocusIndex(index);
  };

  const focusModeOpen = focusIndex !== null;

  useEffect(() => {
    if (!focusModeOpen) return;
    closeButtonRef.current?.focus();
  }, [focusModeOpen]);

  useEffect(() => {
    if (focusIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFocusMode();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeFocusMode, focusIndex]);

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
        <div
          className="build-progress"
          role="progressbar"
          aria-label={isSr ? "Napredak izrade" : "Build progress"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{width: `${progress}%`}} />
        </div>
        <button type="button" onClick={() => openFocusMode(0)} disabled={steps.length === 0}>
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
                <button type="button" className="step-focus-link" onClick={() => openFocusMode(index)}>
                  {isSr ? "Otvori korak" : "Open step"} →
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {focused && focusIndex !== null && (
        <div ref={dialogRef} className="build-focus" role="dialog" aria-modal="true" aria-labelledby="build-focus-title">
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
                ref={closeButtonRef}
                aria-label={isSr ? "Zatvori režim izrade" : "Close build mode"}
                onClick={closeFocusMode}
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
