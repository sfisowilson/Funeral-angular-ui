import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Aggregates onboarding calculator data across multiple steps/entities
 * so EmbeddedCalculatorComponent can operate on a unified formData object.
 *
 * Keys are typically the normalized dynamicEntityTypeKey values
 * (see OnboardingMultiSubmitStepComponent.getCollectionKey).
 */
@Injectable({ providedIn: 'root' })
export class OnboardingCalculatorAggregatorService {
    private collections: Record<string, any[]> = {};
    private globals: Record<string, any> = {};

    private formDataSubject = new BehaviorSubject<Record<string, any>>({});

    /** Reset all aggregated data (typically at the start of a flow). */
    reset(): void {
        this.collections = {};
        this.globals = {};
        this.emitSnapshot();
    }

    /**
     * Replace the collection for a given key with a new array of items.
     * A shallow copy is stored to avoid accidental external mutation.
     */
    updateCollection(key: string, items: any[]): void {
        if (!key) {
            return;
        }
        this.collections[key] = Array.isArray(items) ? [...items] : [];
        this.emitSnapshot();
    }

    /**
     * Merge additional global scalar values (e.g. selected transport mode)
     * into the aggregated formData.
     */
    updateGlobals(values: Record<string, any>): void {
        if (!values || typeof values !== 'object') {
            return;
        }
        this.globals = { ...this.globals, ...values };
        this.emitSnapshot();
    }

    /**
     * Get a snapshot of the current aggregated formData, combining globals
     * and all collections. Callers should treat the result as read-only.
     */
    getFormDataSnapshot(): Record<string, any> {
        return { ...this.globals, ...this.collections };
    }

    /** Observable stream of aggregated formData, for global calculator widgets. */
    get formData$(): Observable<Record<string, any>> {
        return this.formDataSubject.asObservable();
    }

    private emitSnapshot(): void {
        this.formDataSubject.next(this.getFormDataSnapshot());
    }
}
