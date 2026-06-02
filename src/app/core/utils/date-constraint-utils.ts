/**
 * Utilities for dynamic-form date field guard rails.
 *
 * Constraints can be stored in two ways depending on the form system:
 *
 * 1. In `validationRulesJson` (OnboardingFieldConfiguration):
 *    {"minDate":"today","maxDate":"2030-12-31","minDateFromField":"startDate"}
 *
 * 2. As direct properties on Form entity field JSON objects:
 *    {"name":"endDate","type":"date","minDate":"@startDate","maxDate":"today"}
 *
 * The `@fieldKey` shorthand in `minDate`/`maxDate` values means "read the
 * constraint from the named sibling field's current value at runtime".
 *
 * Supported static values:
 *   "today"       — resolved to the current date at midnight (dynamic)
 *   "YYYY-MM-DD"  — a fixed calendar date
 *   "@fieldKey"   — resolved from another form field's value at render time
 */

export interface DateConstraintRules {
    minDate?: string;           // static: "today" | "YYYY-MM-DD"
    maxDate?: string;           // static: "today" | "YYYY-MM-DD"
    minDateFromField?: string;  // cross-field: reads value from this field key
    maxDateFromField?: string;  // cross-field: reads value from this field key
}

/**
 * Extracts date constraint keys from a `validationRulesJson` string
 * (used by OnboardingFieldConfiguration).
 *
 * Supports both explicit `minDateFromField` keys and the `@fieldKey`
 * shorthand inside `minDate`/`maxDate` values.
 *
 * Returns an empty object if the JSON is absent or cannot be parsed.
 */
export function parseDateConstraints(validationRulesJson: string | undefined | null): DateConstraintRules {
    if (!validationRulesJson) return {};
    try {
        const rules = JSON.parse(validationRulesJson);
        return extractDateConstraintRules(rules);
    } catch {
        return {};
    }
}

/**
 * Extracts date constraints from a plain object (e.g. a Form entity field
 * already parsed from its JSON blob).
 */
export function extractDateConstraintRules(raw: any): DateConstraintRules {
    const result: DateConstraintRules = {};
    if (!raw || typeof raw !== 'object') return result;

    const resolveMinMax = (value: string, staticKey: keyof DateConstraintRules, fromFieldKey: keyof DateConstraintRules) => {
        if (!value) return;
        if (value.startsWith('@')) {
            result[fromFieldKey] = value.slice(1) as any;
        } else {
            result[staticKey] = value as any;
        }
    };

    if (raw.minDate) resolveMinMax(String(raw.minDate), 'minDate', 'minDateFromField');
    if (raw.maxDate) resolveMinMax(String(raw.maxDate), 'maxDate', 'maxDateFromField');
    // Also accept explicit keys (used by validationRulesJson)
    if (!result.minDateFromField && raw.minDateFromField) result.minDateFromField = String(raw.minDateFromField);
    if (!result.maxDateFromField && raw.maxDateFromField) result.maxDateFromField = String(raw.maxDateFromField);

    return result;
}

/**
 * Resolves a static constraint value to a `Date`.
 *
 * - `"today"` → current date at midnight (local time)
 * - `"YYYY-MM-DD"` or any Date-parseable string → parsed Date
 *
 * Returns `null` when the value cannot be resolved.
 */

// Stable cache for "today" — same Date object reference until the calendar day rolls over.
// This prevents PrimeNG Calendar from treating minDate/maxDate as "changed" on every
// Angular change-detection cycle, which would otherwise reset the displayed month.
let _cachedToday: { date: Date; dayKey: string } | null = null;

function getTodayStable(): Date {
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (!_cachedToday || _cachedToday.dayKey !== dayKey) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        _cachedToday = { date: d, dayKey };
    }
    return _cachedToday.date;
}

export function resolveStaticDate(value: string): Date | null {
    if (!value) return null;

    if (value === 'today') {
        return getTodayStable();
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

/**
 * Formats a `Date` as `YYYY-MM-DD` — the format required by the HTML
 * `<input type="date">` `min`/`max` attributes.
 */
export function toDateInputString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Resolves a constraint value to a `Date` at render time.
 *
 * - Static values (`"today"`, `"YYYY-MM-DD"`) are resolved directly.
 * - Cross-field values (`"@fieldKey"`) are read from the provided form values map.
 *
 * Returns `null` when the constraint cannot be resolved (absent, invalid, or
 * the referenced field has no value).
 */
export function resolveCalendarDate(
    constraintValue: string | undefined,
    formValues?: Record<string, any> | null
): Date | null {
    if (!constraintValue) return null;

    if (constraintValue.startsWith('@')) {
        const key = constraintValue.slice(1);
        const raw = formValues?.[key];
        if (!raw) return null;
        if (raw instanceof Date) {
            const d = new Date(raw);
            d.setHours(0, 0, 0, 0);
            return d;
        }
        const parsed = new Date(raw);
        if (isNaN(parsed.getTime())) return null;
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    }

    return resolveStaticDate(constraintValue);
}
