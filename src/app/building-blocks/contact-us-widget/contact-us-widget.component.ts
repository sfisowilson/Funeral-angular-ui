import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';

interface Branch {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface SocialMedia {
    platform: string;
    url: string;
}

@Component({
    selector: 'app-contact-us-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contact-us-widget.component.html',
    styleUrls: ['./contact-us-widget.component.scss']
})
export class ContactUsWidgetComponent {
    @Input() config!: WidgetConfig;

    get branches(): Branch[] {
        return this.config.settings.branches || [];
    }

    get socialMediaHandles(): SocialMedia[] {
        return this.config.settings.socialMediaHandles || [];
    }
}
