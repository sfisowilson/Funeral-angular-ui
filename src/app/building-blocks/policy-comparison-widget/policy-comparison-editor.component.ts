import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PolicyDto, PolicyServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-policy-comparison-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, MultiSelectModule],
    providers: [PolicyServiceProxy],
    template: `
        <div class="p-fluid" style="min-height: 300px;">
            <div class="p-field">
                <label for="policies">Select Policies to Compare</label>
                <p-multiSelect id="policies" [options]="availablePolicies" [(ngModel)]="config.settings.policyIds" optionLabel="name" optionValue="id" display="chip" placeholder="Select Policies"></p-multiSelect>
            </div>
            <div class="p-field">
                <label for="title">Widget Title</label>
                <input id="title" type="text" pInputText [(ngModel)]="config.settings.title" />
            </div>
        </div>
    `,
    styles: []
})
export class PolicyComparisonEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    availablePolicies: PolicyDto[] = [];

    constructor(private policyService: PolicyServiceProxy) {}

    ngOnInit(): void {
        this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe((policies) => {
            this.availablePolicies = policies;
        });
    }
}
