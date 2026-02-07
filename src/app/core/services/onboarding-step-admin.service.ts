import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OnboardingStepType } from './service-proxies';

export interface OnboardingStepConfigurationDto {
    id: string;
    tenantId: string;
    stepType: OnboardingStepType;
    stepKey: string;
    stepLabel: string;
    tenantTypeFilter?: string | null;
    displayOrder: number;
    isRequired: boolean;
    isEnabled: boolean;
    description?: string | null;
    icon?: string | null;
    isSkippable: boolean;
    formId?: string | null;
    dynamicEntityTypeKey?: string | null;
    formDisplayMode?: string | null;
    listDisplayConfig?: string | null;
    pdfTemplateFileId?: string | null;
    autoGeneratePdf: boolean;
    includeStepDataKeys?: string | null;
    requireTypedSignature: boolean;
    termsContentMode?: string | null;
    termsPdfFileId?: string | null;
    termsTextContent?: string | null;
    termsTitle?: string | null;
    termsAcceptanceLabel?: string | null;
    requireFullReview: boolean;
}

export interface ListDisplayColumnConfig {
    fieldKey: string;
    header: string;
    width?: string;
    format?: string;
}

export interface ListDisplayActionsConfig {
    add: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
}

export interface ListDisplayConstraintsConfig {
    minItems?: number | null;
    maxItems?: number | null;
    enforceOnNavigation?: boolean;
    showWarningsOnly?: boolean;
    labels?: {
        singular?: string;
        plural?: string;
    };
}

export interface ListDisplayConfig {
    columns?: ListDisplayColumnConfig[];
    actions?: ListDisplayActionsConfig;
    constraints?: ListDisplayConstraintsConfig;
    defaultSort?: {
        field?: string;
        direction?: 'asc' | 'desc';
    };
}

@Injectable({ providedIn: 'root' })
export class OnboardingStepAdminService {
    private readonly baseUrl = environment.apiUrl + '/api/OnboardingStepConfiguration';

    constructor(private http: HttpClient) {}

    getAllSteps(): Observable<OnboardingStepConfigurationDto[]> {
        const url = `${this.baseUrl}/OnboardingStepConfiguration_GetAll`;
        return this.http.post<OnboardingStepConfigurationDto[]>(url, {});
    }

    updateListDisplayConfig(step: OnboardingStepConfigurationDto, listDisplayConfigJson: string): Observable<any> {
        const url = `${this.baseUrl}/OnboardingStepConfiguration_Update`;

        const payload: any = {
            id: step.id,
            stepType: step.stepType,
            stepLabel: step.stepLabel,
            tenantTypeFilter: step.tenantTypeFilter ?? null,
            displayOrder: step.displayOrder,
            isRequired: step.isRequired,
            isEnabled: step.isEnabled,
            description: step.description ?? null,
            icon: step.icon ?? null,
            isSkippable: step.isSkippable,
            formId: step.formId ?? null,
            dynamicEntityTypeKey: step.dynamicEntityTypeKey ?? null,
            formDisplayMode: step.formDisplayMode ?? null,
            listDisplayConfig: listDisplayConfigJson,
            pdfTemplateFileId: step.pdfTemplateFileId ?? null,
            autoGeneratePdf: step.autoGeneratePdf,
            includeStepDataKeys: step.includeStepDataKeys ?? null,
            requireTypedSignature: step.requireTypedSignature,
            termsContentMode: step.termsContentMode ?? null,
            termsPdfFileId: step.termsPdfFileId ?? null,
            termsTextContent: step.termsTextContent ?? null,
            termsTitle: step.termsTitle ?? null,
            termsAcceptanceLabel: step.termsAcceptanceLabel ?? null,
            requireFullReview: step.requireFullReview
        };

        return this.http.post<any>(url, payload);
    }
}
