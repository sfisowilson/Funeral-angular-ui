import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderHistoryWidgetComponent } from '../../../building-blocks/order-history-widget/order-history-widget.component';

@Component({
    selector: 'app-order-history-page',
    standalone: true,
    imports: [CommonModule, OrderHistoryWidgetComponent],
    template: `
        <app-order-history-widget [config]="widgetConfig"></app-order-history-widget>
    `,
    styles: [`:host { display: block; min-height: 60vh; }`]
})
export class OrderHistoryPageComponent {
    widgetConfig = {
        title: 'My Orders',
        showTitle: true,
        pageSize: 20,
        showTracking: true,
        showStatusBadges: true,
        currencySymbol: '$',
        backgroundColor: '#ffffff',
        titleColor: '#222222',
        cardBackground: '#f9f9f9'
    };
}
