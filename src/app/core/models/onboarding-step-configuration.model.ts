import { OnboardingStepType } from '../services/service-proxies';

export interface OnboardingStepConfiguration {
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
    // Form / entity bindings
    formId?: string | null;
    dynamicEntityTypeKey?: string | null;
    formDisplayMode?: string | null;
    listDisplayConfig?: string | null;
    // PDF-related properties
    pdfTemplateFileId?: string | null;
    autoGeneratePdf?: boolean;
    includeStepDataKeys?: string | null;
    requireTypedSignature?: boolean;
    // Terms and conditions
    termsContentMode?: string | null;
    termsPdfFileId?: string | null;
    termsTextContent?: string | null;
    termsTitle?: string | null;
    termsAcceptanceLabel?: string | null;
    requireFullReview?: boolean;
}
