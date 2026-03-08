import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OnboardingMultiSubmitServiceProxy } from './service-proxies';

export interface MultiSubmitStepContextDto {
    step: any;
    records: Array<{
        id: string;
        tenantId: string;
        entityTypeId: string;
        displayName?: string | null;
        externalKey?: string | null;
        dataJson: string;
    }>;
}

export interface SaveMultiSubmitRecordDto {
    stepKey: string;
    id?: string | null;
    displayName?: string | null;
    dataJson: string;
}

@Injectable({ providedIn: 'root' })
export class OnboardingMultiSubmitService {
    constructor(private onboardingMultiSubmitProxy: OnboardingMultiSubmitServiceProxy) {}

    getStepContext(stepKey?: string): Observable<MultiSubmitStepContextDto> {
        return this.onboardingMultiSubmitProxy
            .onboardingMultiSubmit_GetStepContext(stepKey)
            .pipe(map((response) => response.result as MultiSubmitStepContextDto));
    }

    /**
     * Resolve values for a specific dynamic entity field for the current member.
     * Used by row-limit rules configured with a DynamicEntityType and field.
     */
    getDynamicFieldValues(entityTypeId: string, fieldKey: string): Observable<string[]> {
        return this.onboardingMultiSubmitProxy
            .onboardingMultiSubmit_GetDynamicFieldValues(entityTypeId, fieldKey)
            .pipe(map((response) => (response.result as string[]) || []));
    }

    saveRecord(dto: SaveMultiSubmitRecordDto): Observable<any> {
        return this.onboardingMultiSubmitProxy
            .onboardingMultiSubmit_SaveRecord(dto as any)
            .pipe(map((response) => response.result));
    }

    deleteRecord(stepKey: string | undefined, recordId: string): Observable<void> {
        return this.onboardingMultiSubmitProxy
            .onboardingMultiSubmit_DeleteRecord(stepKey, recordId)
            .pipe(map(() => undefined));
    }
}
