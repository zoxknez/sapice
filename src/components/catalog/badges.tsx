import type {AppLocale} from "@/i18n/routing";
import type {ValidationState} from "@/lib/domain";
import {taxonomyLabel, type DesignClass} from "@/lib/catalog/taxonomy-core";
import {validationStageLabel} from "@/lib/validation-labels";

/**
 * Design class is a rectangular tag ("what it is"). Validation is a rounded outlined seal
 * ("how far it is verified"). They never share a shape, so an EMERGENCY tag cannot be read as a
 * verification level.
 */
export function DesignClassTag({designClass, locale}: {designClass: DesignClass; locale: AppLocale}) {
  return (
    <span className={`class-tag class-${designClass.toLowerCase()}`} title={taxonomyLabel("designClassHint", designClass, locale)}>
      <span className="sr-only">{locale === "sr" ? "Klasa konstrukcije: " : "Design class: "}</span>
      {taxonomyLabel("designClass", designClass, locale)}
    </span>
  );
}

export function ValidationSeal({state, locale}: {state: ValidationState; locale: AppLocale}) {
  return (
    <span className="validation-seal" title={locale === "sr" ? "Status provere, nezavisan od klase konstrukcije" : "Verification status, independent of design class"}>
      <svg viewBox="0 0 12 14" aria-hidden="true" width="11" height="13">
        <path d="M6 1 L11 3 V7 C11 10 8.6 12.3 6 13 C3.4 12.3 1 10 1 7 V3 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="sr-only">{locale === "sr" ? "Status validacije: " : "Validation status: "}</span>
      {validationStageLabel(state, locale)}
    </span>
  );
}
