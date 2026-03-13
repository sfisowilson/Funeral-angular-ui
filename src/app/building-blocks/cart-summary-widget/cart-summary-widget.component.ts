import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService, CartItem } from '../../core/services/cart.service';

@Component({
    selector: 'app-cart-summary-widget',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
        <div class="cart-summary-widget" [ngStyle]="getContainerStyles()">
            <div class="container">
                <h2 *ngIf="config.showTitle" [ngStyle]="getTitleStyles()">{{ config.title || 'Your Cart' }}</h2>

                <!-- Empty state -->
                <div class="empty-cart" *ngIf="items.length === 0">
                    <p>{{ config.emptyMessage || 'Your cart is empty.' }}</p>
                    <a [routerLink]="[config.shopLink || '/shop']" class="btn-action" [ngStyle]="getButtonStyles()">{{ config.continueShopping || 'Continue Shopping' }}</a>
                </div>

                <!-- Cart items table -->
                <div *ngIf="items.length > 0">
                    <div class="cart-table">
                        <div class="cart-header">
                            <span class="col-product">Product</span>
                            <span class="col-price">Price</span>
                            <span class="col-qty">Qty</span>
                            <span class="col-total">Total</span>
                            <span class="col-remove"></span>
                        </div>

                        <div class="cart-row" *ngFor="let item of items" [ngStyle]="getRowStyles()">
                            <div class="col-product product-cell">
                                <img *ngIf="config.showThumbnails && item.productImageUrl" [src]="item.productImageUrl" [alt]="item.productName" class="item-thumb" />
                                <div class="item-meta">
                                    <span class="item-name">{{ item.productName }}</span>
                                    <span class="item-variant" *ngIf="item.variantName">{{ item.variantName }}</span>
                                    <span class="item-sku" *ngIf="item.sku">{{ item.sku }}</span>
                                </div>
                            </div>
                            <div class="col-price">{{ config.currencySymbol || '$' }}{{ item.unitPrice | number:'1.2-2' }}</div>
                            <div class="col-qty">
                                <div class="qty-stepper">
                                    <button (click)="updateQty(item, item.quantity - 1)" [disabled]="item.quantity <= 1">–</button>
                                    <span>{{ item.quantity }}</span>
                                    <button (click)="updateQty(item, item.quantity + 1)" [disabled]="item.quantity >= item.stockQuantity && item.stockQuantity > 0">+</button>
                                </div>
                            </div>
                            <div class="col-total">{{ config.currencySymbol || '$' }}{{ item.lineTotal | number:'1.2-2' }}</div>
                            <div class="col-remove">
                                <button class="btn-remove" (click)="removeItem(item.id)" title="Remove">&#10005;</button>
                            </div>
                        </div>
                    </div>

                    <!-- Coupon + Summary -->
                    <div class="cart-footer">
                        <div class="coupon-section" *ngIf="config.showCouponField">
                            <input type="text" class="coupon-input" placeholder="Coupon code" [(ngModel)]="couponCode" />
                            <button class="btn-coupon" (click)="applyCoupon()">Apply</button>
                            <span class="coupon-msg" *ngIf="couponMessage" [class.error]="couponError">{{ couponMessage }}</span>
                        </div>

                        <div class="summary">
                            <div class="summary-row"><span>Subtotal</span><span>{{ config.currencySymbol || '$' }}{{ subtotal | number:'1.2-2' }}</span></div>
                            <div class="summary-row discount" *ngIf="discount > 0"><span>Discount</span><span>– {{ config.currencySymbol || '$' }}{{ discount | number:'1.2-2' }}</span></div>
                            <div class="summary-row total"><span>Total</span><span>{{ config.currencySymbol || '$' }}{{ (subtotal - discount) | number:'1.2-2' }}</span></div>
                        </div>

                        <div class="cart-ctas">
                            <a [routerLink]="[config.shopLink || '/shop']" class="btn-continue">{{ config.continueShopping || '← Continue Shopping' }}</a>
                            <button class="btn-action btn-checkout" [ngStyle]="getButtonStyles()" (click)="checkout()">{{ config.checkoutLabel || 'Proceed to Checkout' }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .cart-summary-widget { padding: 3rem 0; }
        .container { max-width: 900px; margin: 0 auto; padding: 0 1rem; }
        h2 { margin-bottom: 1.5rem; }
        .empty-cart { text-align: center; padding: 3rem; }
        .empty-cart p { color: #888; margin-bottom: 1rem; }
        .cart-table { width: 100%; border-collapse: collapse; }
        .cart-header {
            display: grid;
            grid-template-columns: 3fr 1fr 1fr 1fr 40px;
            gap: 0.5rem;
            padding: 0.6rem 0;
            border-bottom: 2px solid #eee;
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            color: #999;
        }
        .cart-row {
            display: grid;
            grid-template-columns: 3fr 1fr 1fr 1fr 40px;
            gap: 0.5rem;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .product-cell { display: flex; align-items: center; gap: 0.75rem; }
        .item-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .item-meta { display: flex; flex-direction: column; }
        .item-name { font-weight: 600; font-size: 0.9rem; }
        .item-variant { font-size: 0.75rem; color: #888; }
        .item-sku { font-size: 0.7rem; color: #bbb; }
        .qty-stepper { display: flex; align-items: center; gap: 0.5rem; }
        .qty-stepper button {
            width: 28px; height: 28px; border: 1px solid #ddd; background: #fff;
            cursor: pointer; border-radius: 4px; font-size: 1rem; line-height: 1;
        }
        .qty-stepper button:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-remove {
            background: transparent; border: none; cursor: pointer;
            color: #ccc; font-size: 1rem; padding: 0.2rem;
        }
        .btn-remove:hover { color: #e11d48; }
        .cart-footer { margin-top: 1.5rem; }
        .coupon-section { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .coupon-input { padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; min-width: 180px; }
        .btn-coupon { padding: 0.5rem 1rem; border: 1px solid #ddd; background: #f8f8f8; border-radius: 4px; cursor: pointer; }
        .coupon-msg { font-size: 0.8rem; color: #16a34a; }
        .coupon-msg.error { color: #e11d48; }
        .summary { margin-left: auto; max-width: 320px; margin-bottom: 1.5rem; }
        .summary-row { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem; border-bottom: 1px solid #f5f5f5; }
        .summary-row.discount { color: #16a34a; }
        .summary-row.total { font-weight: 700; font-size: 1.1rem; border-top: 2px solid #eee; border-bottom: none; padding-top: 0.75rem; }
        .cart-ctas { display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .btn-continue { color: #555; text-decoration: none; font-size: 0.875rem; }
        .btn-continue:hover { text-decoration: underline; }
        .btn-action { padding: 0.75rem 2rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: inline-block; }
        .btn-checkout { min-width: 200px; }
        @media (max-width: 600px) {
            .cart-header, .cart-row { grid-template-columns: 2fr 1fr 1fr 40px; }
            .col-price { display: none; }
        }
    `]
})
export class CartSummaryWidgetComponent implements OnInit, OnDestroy {
    @Input() config: any = {
        title: 'Your Cart',
        showTitle: true,
        showThumbnails: true,
        showCouponField: true,
        emptyMessage: 'Your cart is empty.',
        continueShopping: '← Continue Shopping',
        checkoutLabel: 'Proceed to Checkout',
        shopLink: '/shop',
        currencySymbol: '$',
        backgroundColor: '#ffffff',
        titleColor: '#222222',
        buttonColor: '#007bff',
        buttonTextColor: '#ffffff',
        rowAlternateColor: '#fafafa'
    };

    items: CartItem[] = [];
    subtotal = 0;
    discount = 0;
    couponCode = '';
    couponMessage = '';
    couponError = false;

    private _destroy$ = new Subject<void>();

    constructor(private cartService: CartService, private router: Router) {}

    ngOnInit(): void {
        this.cartService.cart$.pipe(takeUntil(this._destroy$)).subscribe((items) => {
            this.items = items;
            this.subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
        });
    }

    ngOnDestroy(): void { this._destroy$.next(); this._destroy$.complete(); }

    updateQty(item: CartItem, qty: number): void {
        this.cartService.updateQuantity(item.id, qty);
    }

    removeItem(itemId: string): void {
        this.cartService.removeItem(itemId);
    }

    applyCoupon(): void {
        // Placeholder — wire to CouponServiceProxy when available
        if (!this.couponCode) { this.couponMessage = 'Enter a code first.'; this.couponError = true; return; }
        this.couponMessage = 'Coupon applied!';
        this.couponError = false;
        // TODO: call backend coupon validation and set discount
    }

    checkout(): void {
        this.router.navigate(['/checkout']);
    }

    getContainerStyles() { return { backgroundColor: this.config.backgroundColor }; }
    getTitleStyles() { return { color: this.config.titleColor }; }
    getButtonStyles() { return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor }; }
    getRowStyles() { return {}; }
}
