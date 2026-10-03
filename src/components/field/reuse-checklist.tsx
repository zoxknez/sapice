"use client";

import {useId, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {reuseAcceptCriteria, reuseCopy, reuseRejectCriteria, reuseState, type ReuseAnswers} from "@/lib/field-checks";

export function ReuseChecklist({locale, materialLabel}: {locale: AppLocale; materialLabel?: string}) {
  const isSr = locale === "sr";
  const id = useId();
  const [answers, setAnswers] = useState<ReuseAnswers>({reject: {}, accept: {}});
  const state = useMemo(() => reuseState(answers), [answers]);
  const copy = {
    REJECTED: {sr: "Odbaciti za ovu namenu", en: "Reject for this use"},
    CHECKLIST_PASSED: {sr: "Kontrolna lista prođena", en: "Reuse checklist passed"},
    INCOMPLETE: {sr: "Provera nije završena", en: "Check not complete"}
  }[state];

  return (
    <div className="field-checklist reuse-checklist">
      {materialLabel && <p className="field-material">{materialLabel}</p>}
      <div className="reuse-columns">
        <fieldset>
          <legend>{isSr ? "Razlozi za odbacivanje" : "Reject if any applies"}</legend>
          {reuseRejectCriteria.map((criterion) => (
            <label key={criterion} className="check-line" htmlFor={`${id}-r-${criterion}`}>
              <input
                id={`${id}-r-${criterion}`}
                type="checkbox"
                checked={Boolean(answers.reject[criterion])}
                onChange={(event) => setAnswers((current) => ({...current, reject: {...current.reject, [criterion]: event.target.checked}}))}
              />
              <span>{isSr ? reuseCopy[criterion].sr : reuseCopy[criterion].en}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{isSr ? "Potvrdite sve" : "Confirm all"}</legend>
          {reuseAcceptCriteria.map((criterion) => (
            <label key={criterion} className="check-line" htmlFor={`${id}-a-${criterion}`}>
              <input
                id={`${id}-a-${criterion}`}
                type="checkbox"
                checked={Boolean(answers.accept[criterion])}
                onChange={(event) => setAnswers((current) => ({...current, accept: {...current.accept, [criterion]: event.target.checked}}))}
              />
              <span>{isSr ? reuseCopy[criterion].sr : reuseCopy[criterion].en}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className={`field-result result-${state.toLowerCase()}`} role="status" aria-live="polite">
        <strong>{isSr ? copy.sr : copy.en}</strong>
        <p>
          {state === "CHECKLIST_PASSED"
            ? (isSr ? "Ovo je samo vaša kontrolna lista, ne sertifikat o bezbednosti materijala." : "This is only your checklist status, not a certificate of material safety.")
            : state === "REJECTED"
              ? (isSr ? "Ne koristite ovaj materijal tamo gde ga životinja dodiruje, gricka ili liže." : "Do not use this material where the animal touches, chews or licks it.")
              : (isSr ? "Odgovorite na sva pitanja pre upotrebe materijala." : "Answer every question before using the material.")}
        </p>
      </div>
    </div>
  );
}
