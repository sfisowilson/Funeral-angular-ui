import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-my-onboarding-widget',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule],
    templateUrl: './my-onboarding-widget.component.html',
    styleUrl: './my-onboarding-widget.component.scss'
})
export class MyOnboardingWidgetComponent {
    constructor(private router: Router) {}

    viewOnboarding() {
        this.router.navigate(['/member-onboarding'], {
            queryParams: { view: 'true' }
        });
    }
}
