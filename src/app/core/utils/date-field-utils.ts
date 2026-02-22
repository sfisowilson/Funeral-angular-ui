export type DatePart = 'day' | 'month' | 'year';

export interface DatePartKeys {
    day?: string;
    month?: string;
    year?: string;
}

export interface DateSplitFieldLike {
    name: string;
    type?: string;
    splitDateParts?: boolean;
    datePartKeys?: DatePartKeys;
}

export function toDateOnlyString(value: any): string | null {
    const normalized = normalizeDateValue(value);
    if (!normalized) {
        return null;
    }

    return [
        normalized.getUTCFullYear(),
        String(normalized.getUTCMonth() + 1).padStart(2, '0'),
        String(normalized.getUTCDate()).padStart(2, '0')
    ].join('-');
}

export function normalizeDateValue(value: any): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        if (isNaN(value.getTime())) {
            return null;
        }

        return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }

        const directMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (directMatch) {
            const year = Number(directMatch[1]);
            const month = Number(directMatch[2]);
            const day = Number(directMatch[3]);
            const parsed = new Date(Date.UTC(year, month - 1, day));
            if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) {
                return parsed;
            }
            return null;
        }

        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
        }
    }

    return null;
}

export function getDatePartKey(field: DateSplitFieldLike, part: DatePart): string {
    const configuredKey = field.datePartKeys?.[part];
    if (configuredKey && configuredKey.trim()) {
        return configuredKey.trim();
    }

    return `${field.name}_${part}`;
}

export function applyDateSplitParts(target: Record<string, any>, fields: DateSplitFieldLike[]): void {
    for (const field of fields || []) {
        if (!field || field.type !== 'date' || !field.splitDateParts || !field.name) {
            continue;
        }

        const normalizedDate = normalizeDateValue(target[field.name]);
        const dayKey = getDatePartKey(field, 'day');
        const monthKey = getDatePartKey(field, 'month');
        const yearKey = getDatePartKey(field, 'year');

        if (!normalizedDate) {
            target[field.name] = null;
            target[dayKey] = null;
            target[monthKey] = null;
            target[yearKey] = null;
            continue;
        }

        target[field.name] = toDateOnlyString(normalizedDate);
        target[dayKey] = normalizedDate.getUTCDate();
        target[monthKey] = normalizedDate.getUTCMonth() + 1;
        target[yearKey] = normalizedDate.getUTCFullYear();
    }
}