import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartSummaryWidgetComponent } from '../../../building-blocks/cart-summary-widget/cart-summary-widget.component';

@Component({
    selector: 'app-cart-page',
    standalone: true,
    imports: [CommonModule, CartSummaryWidgetComponent],
    template: `
        <app-cart-summary-widget [config]="cartConfig"></app-cart-summary-widget>
    `,
    styles: [`
        :host { display: block; min-height: 60vh; }
    `]
})
export class CartPageComponent {
    cartConfig = {
        title: 'Your Cart',
        showThumbnails: true,
        showCouponField: false,
        emptyMessage: 'Your cart is empty.',
        continueShopping: 'Continue Shopping',
        checkoutLabel: 'Proceed to Checkout',
        shopLink: '/shop',
        currencySymbol: '$',
        buttonColor: '#007bff',
        buttonTextColor: '#ffffff',
        backgroundColor: '#ffffff'
    };
}
