"use client";

import {useId, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import {placementCopy, placementQuestions, placementResult, type PlacementContext, type PlacementQuestion} from "@/lib/field-checks";

export function PlacementChecklist({locale, context}: {locale: AppLocale; context: PlacementContext}) {
  const isSr = locale === "sr";
  const id = useId();
  const [answers, setAnswers] = useState<Partial<Record<PlacementQuestion, boolean>>>({});
  const [animal, setAnimal] = useState(context.animal);
  const [season, setSeason] = useState(context.season);
  const evaluation = useMemo(() => placementResult(answers, {animal, season}), [answers, animal, season]);
  const resultCopy = {
    NO_OBVIOUS_ISSUE: {sr: "Nije uočen očigledan problem", en: "No obvious issue detected"},
    NEEDS_ATTENTION: {sr: "Potrebna pažnja", en: "Needs attention"},
    CRITICAL_ISSUE: {sr: "Kritičan problem sa mestom", en: "Critical placement issue"}
  }[evaluation.result];

  return (
    <div className="field-checklist">
      <div className="field-context">
        <label>
          <span>{isSr ? "Životinja" : "Animal"}</span>
          <select value={animal} onChange={(event) => setAnimal(event.target.value as "cat" | "dog")}>
            <option value="cat">{isSr ? "Mačka" : "Cat"}</option>
            <option value="dog">{isSr ? "Pas" : "Dog"}</option>
          </select>
        </label>
        <label>
          <span>{isSr ? "Sezona" : "Season"}</span>
          <select value={season} onChange={(event) => setSeason(event.target.value as PlacementContext["season"])}>
            <option value="WINTER">{isSr ? "Zima" : "Winter"}</option>
            <option value="SUMMER">{isSr ? "Leto" : "Summer"}</option>
            <option value="ALL">{isSr ? "Cele godine" : "All year"}</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend>{isSr ? "Označite šta važi za izabrano mesto" : "Tick what applies to the chosen spot"}</legend>
        {placementQuestions.map((question) => (
          <label key={question} className="check-line" htmlFor={`${id}-${question}`}>
            <input
              id={`${id}-${question}`}
              type="checkbox"
              checked={Boolean(answers[question])}
              onChange={(event) => setAnswers((current) => ({...current, [question]: event.target.checked}))}
            />
            <span>{isSr ? placementCopy[question].questionSr : placementCopy[question].questionEn}</span>
          </label>
        ))}
      </fieldset>
      <div className={`field-result result-${evaluation.result.toLowerCase()}`} role="status" aria-live="polite">
        <strong>{isSr ? resultCopy.sr : resultCopy.en}</strong>
        {evaluation.issues.length > 0 ? (
          <ul>
            {evaluation.issues.map((issue) => (
              <li key={issue.question}>
                <span className={`severity severity-${issue.severity.toLowerCase()}`}>{issue.severity === "CRITICAL" ? (isSr ? "Kritično" : "Critical") : (isSr ? "Pažnja" : "Attention")}</span>
                {isSr ? placementCopy[issue.question].adviceSr : placementCopy[issue.question].adviceEn}
              </li>
            ))}
          </ul>
        ) : (
          <p>{isSr ? "Ovo nije sertifikat bezbednosti mesta: samo nijedno od navedenih pitanja nije označeno." : "This is not a safety certificate for the spot: it only means none of the listed questions is ticked."}</p>
        )}
      </div>
    </div>
  );
}
