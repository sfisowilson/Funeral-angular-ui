import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, first, switchMap } from 'rxjs/operators';

import { MemberContextService } from '../../core/services/member-context.service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import {
    MemberApprovalDetailDto,
    MemberApprovalServiceProxy,
    MemberDto,
    MemberDynamicTableDto,
    OnboardingContractDto,
    OnboardingContractServiceProxy,
    OnboardingFieldConfigurationServiceProxy,
    MemberServiceProxy,
    PdfFieldMappingServiceProxy,
    PdfMappingProfileDto
} from '../../core/services/service-proxies';
import { OnboardingStepConfigurationClient } from '../../core/services/onboarding-step-configuration.client';
import { environment } from '../../../environments/environment';

interface MemberOnboardingDataDto {
    memberId: string;
    tenantId: string;
    fieldValues: { [key: string]: string };
    submittedAt?: string;
}

interface LegacyField {
    label: string;
    value: string;
}

interface PdfDocumentView {
    profileId: string;
    profileName: string;
    displayUrl: SafeResourceUrl | null;
    objectUrl: string | null;
    loading: boolean;
    error: string;
}

@Component({
    selector: 'app-member-onboarding-readonly-view',
    standalone: true,
    imports: [CommonModule, CardModule, TabViewModule, ProgressSpinnerModule],
    providers: [MemberContextService, TenantSettingsService],
    templateUrl: './member-onboarding-readonly-view.component.html',
    styleUrl: './member-onboarding-readonly-view.component.scss'
})
export class MemberOnboardingReadonlyViewComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);

    member: MemberDto | null = null;
    memberNumberLabel = 'Member Number';

    loadingMember = false;
    loadingOnboarding = false;
    loadingDocuments = false;
    errorMessage = '';

    legacyFields: LegacyField[] = [];
    dynamicTables: MemberDynamicTableDto[] = [];
    submittedAt?: string;
    isViewMode = false;

    documents: PdfDocumentView[] = [];

    constructor(
        private memberContext: MemberContextService,
        private memberService: MemberServiceProxy,
        private fieldConfigService: OnboardingFieldConfigurationServiceProxy,
        private tenantSettingsService: TenantSettingsService,
        private memberApprovalService: MemberApprovalServiceProxy,
        private contractService: OnboardingContractServiceProxy,
        private onboardingStepClient: OnboardingStepConfigurationClient,
        private http: HttpClient,
        private sanitizer: DomSanitizer,
        private pdfFieldMappingService: PdfFieldMappingServiceProxy
    ) {}

    ngOnDestroy(): void {
        this.clearAllObjectUrls();
    }

    ngOnInit(): void {
        this.loadMemberNumberLabel();
        this.resolveMemberAndLoadData();
    }

    private loadMemberNumberLabel(): void {
        try {
            this.memberNumberLabel = this.tenantSettingsService.getMemberNumberLabel();
        } catch (error) {
            console.error('Error getting member number label from tenant settings:', error);
            this.memberNumberLabel = 'Member Number';
        }
    }

    private resolveMemberAndLoadData(): void {
        this.loadingMember = true;
        this.errorMessage = '';

        this.route.queryParamMap
            .pipe(
                first(),
                switchMap((params) => {
                    this.isViewMode = params.get('view') === 'true';
                    const memberIdFromQuery = params.get('memberId');
                    if (memberIdFromQuery) {
                        return of(memberIdFromQuery);
                    }

                    // Fallback to current logged-in member ("My Onboarding" scenario)
                    return this.memberContext.getCurrentMember$().pipe(
                        first(),
                        switchMap((member) => {
                            if (!member || !member.id) {
                                this.errorMessage = 'No member found for onboarding summary.';
                                return of(null as string | null);
                            }
                            this.member = member;
                            return of(member.id as string);
                        })
                    );
                })
            )
            .subscribe({
                next: (memberId) => {
                    if (!memberId) {
                        this.loadingMember = false;
                        return;
                    }

                    const hasExplicitMemberId = !!this.route.snapshot.queryParamMap.get('memberId');

                    if (!hasExplicitMemberId) {
                        this.loadingMember = false;
                        this.loadOnboardingData(memberId, false);
                        return;
                    }

                    // Ensure we have full member details
                    this.memberService
                        .member_GetById(memberId)
                        .pipe(first())
                        .subscribe({
                            next: (resp) => {
                                this.member = (resp as any)?.result || null;
                                this.loadingMember = false;
                                this.loadOnboardingData(memberId, true);
                            },
                            error: (err) => {
                                console.error('Error loading member for onboarding view:', err);
                                this.errorMessage = 'Failed to load member information.';
                                this.loadingMember = false;
                            }
                        });
                },
                error: (err) => {
                    console.error('Error resolving member for onboarding view:', err);
                    this.errorMessage = 'Failed to resolve member for onboarding view.';
                    this.loadingMember = false;
                }
            });
    }

    private loadOnboardingData(memberId: string, useMemberIdLookup: boolean): void {
        this.loadingOnboarding = true;
        this.loadingDocuments = true;
        this.errorMessage = '';
        this.legacyFields = [];
        this.dynamicTables = [];
        this.submittedAt = undefined;
        this.clearAllObjectUrls();
        this.documents = [];

        const fieldData$ = (useMemberIdLookup
            ? this.fieldConfigService.onboardingFieldConfiguration_GetMemberDataById(memberId)
            : this.fieldConfigService.onboardingFieldConfiguration_GetMemberData()
        ).pipe(
            first(),
            catchError((err) => {
                console.error('Error loading member onboarding data:', err);
                return of(null as any);
            })
        );

        const memberDetail$ = this.memberApprovalService.memberApproval_GetMemberDetail(memberId).pipe(
            first(),
            catchError((err) => {
                console.error('Error loading member dynamic onboarding detail:', err);
                return of(null as any);
            })
        );

        const contracts$ = this.contractService.contractsByMember(memberId).pipe(
            first(),
            catchError((err) => {
                console.error('Error loading member contracts:', err);
                return of(null as any);
            })
        );

        const enabledSteps$ = this.onboardingStepClient.getEnabledSteps().pipe(
            first(),
            catchError((err) => {
                console.error('Error loading onboarding step config:', err);
                return of([] as any[]);
            })
        );

        const profiles$ = this.pdfFieldMappingService.pdfFieldMapping_GetProfiles().pipe(
            first(),
            catchError((err) => {
                console.error('Error loading PDF mapping profiles:', err);
                return of(null as any);
            })
        );

        forkJoin({
            fieldData: fieldData$,
            memberDetail: memberDetail$,
            contracts: contracts$,
            enabledSteps: enabledSteps$,
            profiles: profiles$
        }).subscribe({
            next: ({ fieldData, memberDetail, contracts, enabledSteps, profiles }) => {
                try {
                    const dto = (fieldData as any)?.result as MemberOnboardingDataDto | null;
                    const detail = (memberDetail as any)?.result as MemberApprovalDetailDto | null;
                    const contractList = ((contracts as any)?.result as OnboardingContractDto[]) || [];
                    const profileList = ((profiles as any)?.result as PdfMappingProfileDto[]) || [];

                    this.buildLegacyFields(dto, detail);
                    this.buildDynamicTables(detail, enabledSteps || []);
                    this.resolveDocuments(memberId, profileList, contractList);
                } catch (err) {
                    console.error('Error building onboarding readonly view:', err);
                    this.errorMessage = 'Failed to build onboarding summary.';
                    this.loadingDocuments = false;
                } finally {
                    this.loadingOnboarding = false;
                }
            },
            error: (err) => {
                console.error('Error loading onboarding readonly payload:', err);
                this.errorMessage = 'Failed to load onboarding data.';
                this.loadingOnboarding = false;
                this.loadingDocuments = false;
            }
        });
    }

    private buildLegacyFields(dto: MemberOnboardingDataDto | null, detail: MemberApprovalDetailDto | null): void {
        this.submittedAt = dto?.submittedAt ? this.dateTimeToIso(dto.submittedAt as any) : undefined;

        const byKey = new Map<string, LegacyField>();
        const fieldValues = dto?.fieldValues || {};

        Object.entries(fieldValues)
            .filter(([key]) => !!key)
            .forEach(([key, value]) => {
                byKey.set(this.normalizeKey(key), {
                    label: this.toDisplayLabel(key),
                    value: value || ''
                });
            });

        (detail?.customFields || []).forEach((field) => {
            const key = field.fieldKey || field.fieldLabel || '';
            if (!key) {
                return;
            }

            byKey.set(this.normalizeKey(key), {
                label: field.fieldLabel || this.toDisplayLabel(field.fieldKey || ''),
                value: field.fieldValue || ''
            });
        });

        this.legacyFields = Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    private buildDynamicTables(detail: MemberApprovalDetailDto | null, enabledSteps: Array<{ dynamicEntityTypeKey?: string | null }>): void {
        const onboardingDynamicKeys = enabledSteps
            .map((step) => (step.dynamicEntityTypeKey || '').trim())
            .filter((key) => !!key);

        const tables = detail?.dynamicTables || [];
        if (!onboardingDynamicKeys.length) {
            this.dynamicTables = tables;
            return;
        }

        this.dynamicTables = tables.filter((table) => this.matchesOnboardingEntity(table.entityName || '', onboardingDynamicKeys));
    }

    private resolveDocuments(memberId: string, profiles: PdfMappingProfileDto[], contracts: OnboardingContractDto[]): void {
        const enabledProfiles = profiles
            .filter((p) => p.isEnabled)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        if (enabledProfiles.length > 0) {
            this.documents = enabledProfiles.map((profile) => ({
                profileId: profile.id,
                profileName: profile.name || 'Unnamed Document',
                displayUrl: null,
                objectUrl: null,
                loading: true,
                error: ''
            }));
            this.loadingDocuments = false;

            this.documents.forEach((doc) => {
                const url = `${environment.apiUrl}/api/OnboardingPdf/OnboardingPdf_PreviewPdf?memberId=${memberId}&mappingProfileId=${doc.profileId}`;
                this.fetchDocumentBlob(url, doc);
            });
            return;
        }

        // Fallback: no profiles configured — show contracts or generic preview
        this.loadingDocuments = false;
        const sortedContracts = [...contracts].sort((a, b) => {
            const aMs = this.dateToMs(a.signedAt as any);
            const bMs = this.dateToMs(b.signedAt as any);
            return bMs - aMs;
        });

        if (sortedContracts.length > 0) {
            this.documents = sortedContracts.map((contract, i) => {
                const isSigned = !!contract.signedPdfPath || !!contract.signedAt;
                return {
                    profileId: contract.id,
                    profileName: isSigned
                        ? `Signed Document ${i + 1}${contract.signedAt ? ' — ' + this.dateTimeToIso(contract.signedAt as any) : ''}`
                        : `Document ${i + 1}`,
                    displayUrl: null,
                    objectUrl: null,
                    loading: true,
                    error: ''
                };
            });
            sortedContracts.forEach((contract, i) => {
                const url = `${environment.apiUrl}/api/OnboardingContract/contract-download/${contract.id}`;
                this.fetchDocumentBlob(url, this.documents[i]);
            });
            return;
        }

        // Final fallback: generic generated preview
        const doc: PdfDocumentView = {
            profileId: '',
            profileName: 'Generated PDF Preview',
            displayUrl: null,
            objectUrl: null,
            loading: true,
            error: ''
        };
        this.documents = [doc];
        this.fetchDocumentBlob(`${environment.apiUrl}/api/OnboardingPdf/OnboardingPdf_PreviewPdf?memberId=${memberId}`, doc);
    }

    private fetchDocumentBlob(url: string, doc: PdfDocumentView): void {
        doc.loading = true;
        doc.error = '';

        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                if (doc.objectUrl) {
                    URL.revokeObjectURL(doc.objectUrl);
                }
                doc.objectUrl = URL.createObjectURL(blob);
                doc.displayUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.objectUrl);
                doc.loading = false;
            },
            error: (error) => {
                console.error('Error loading document PDF:', error);
                doc.error = 'Failed to load PDF.';
                doc.loading = false;
            }
        });
    }

    private clearAllObjectUrls(): void {
        for (const doc of this.documents) {
            if (doc.objectUrl) {
                URL.revokeObjectURL(doc.objectUrl);
                doc.objectUrl = null;
            }
            doc.displayUrl = null;
        }
    }

    openDocumentInNewTab(doc: PdfDocumentView): void {
        if (doc.objectUrl) {
            window.open(doc.objectUrl, '_blank');
        }
    }

    private normalizeKey(value: string): string {
        return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    private matchesOnboardingEntity(entityName: string, dynamicEntityKeys: string[]): boolean {
        const entityNormalized = this.normalizeKey(entityName);
        return dynamicEntityKeys.some((key) => {
            const keyNormalized = this.normalizeKey(key);
            return entityNormalized === keyNormalized || entityNormalized.includes(keyNormalized) || keyNormalized.includes(entityNormalized);
        });
    }

    private dateToMs(value: any): number {
        if (!value) {
            return 0;
        }

        if (typeof value.toMillis === 'function') {
            return value.toMillis();
        }

        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private dateTimeToIso(value: any): string {
        if (!value) {
            return '';
        }

        if (typeof value.toISO === 'function') {
            return value.toISO() || '';
        }

        return String(value);
    }

    private toDisplayLabel(key: string): string {
        return key
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    get memberDisplayName(): string {
        if (!this.member) {
            return '';
        }
        // Prefer explicit name if available
        return (this.member as any).name || `${(this.member as any).firstNames || ''} ${(this.member as any).surname || ''}`.trim();
    }

    get memberNumber(): string {
        if (!this.member) {
            return '';
        }
        const m: any = this.member;
        return m.memberNumber || m.id || '';
    }
}
