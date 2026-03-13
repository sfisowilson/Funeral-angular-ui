import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { AuthService } from '../../../auth/auth-service';
import { TenantFeatureService } from '../../../core/services/tenant-feature.service';
import { environment } from '../../../../environments/environment';

interface AddressForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

@Component({
    selector: 'app-checkout-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
        <div class="checkout-page">
            <div class="container">
                <h1 class="checkout-title">Checkout</h1>

                <!-- Guest checkout blocked -->
                <div class="access-denied" *ngIf="guestBlocked">
                    <p>Please <a routerLink="/auth/login">log in</a> to continue checkout.</p>
                </div>

                <!-- Empty cart -->
                <div class="empty-cart" *ngIf="!guestBlocked && items.length === 0 && !submitted">
                    <p>Your cart is empty. <a routerLink="/shop">Continue shopping →</a></p>
                </div>

                <!-- Success -->
                <div class="success-state" *ngIf="submitted && orderNumber">
                    <div class="success-icon">✓</div>
                    <h2>Order Placed!</h2>
                    <p>Thank you. Your order <strong>{{ orderNumber }}</strong> has been received.</p>
                    <a routerLink="/shop" class="btn-continue">Back to Shop</a>
                    <a routerLink="/customer/orders" class="btn-orders" *ngIf="isLoggedIn">View My Orders</a>
                </div>

                <!-- Checkout form -->
                <div class="checkout-layout" *ngIf="!guestBlocked && items.length > 0 && !submitted">
                    <!-- Left: Form -->
                    <div class="form-col">
                        <section class="form-section">
                            <h2>Contact</h2>
                            <div class="form-row two">
                                <div class="form-group">
                                    <label>First Name *</label>
                                    <input type="text" [(ngModel)]="form.firstName" required />
                                </div>
                                <div class="form-group">
                                    <label>Last Name *</label>
                                    <input type="text" [(ngModel)]="form.lastName" required />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" [(ngModel)]="form.email" required />
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" [(ngModel)]="form.phone" />
                            </div>
                        </section>

                        <section class="form-section">
                            <h2>Shipping Address</h2>
                            <div class="form-group">
                                <label>Address Line 1 *</label>
                                <input type="text" [(ngModel)]="form.address1" required />
                            </div>
                            <div class="form-group">
                                <label>Address Line 2</label>
                                <input type="text" [(ngModel)]="form.address2" />
                            </div>
                            <div class="form-row two">
                                <div class="form-group">
                                    <label>City *</label>
                                    <input type="text" [(ngModel)]="form.city" required />
                                </div>
                                <div class="form-group">
                                    <label>State / Province</label>
                                    <input type="text" [(ngModel)]="form.state" />
                                </div>
                            </div>
                            <div class="form-row two">
                                <div class="form-group">
                                    <label>Postal Code</label>
                                    <input type="text" [(ngModel)]="form.postalCode" />
                                </div>
                                <div class="form-group">
                                    <label>Country *</label>
                                    <input type="text" [(ngModel)]="form.country" required />
                                </div>
                            </div>
                        </section>

                        <section class="form-section">
                            <h2>Payment</h2>
                            <div class="payment-info">
                                <p>Secure payment processing. Upon confirming your order, you will be redirected to the payment gateway.</p>
                            </div>
                        </section>

                        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>

                        <button
                            class="btn-place-order"
                            (click)="placeOrder()"
                            [disabled]="placing"
                        >
                            {{ placing ? 'Placing Order…' : 'Place Order' }}
                        </button>
                    </div>

                    <!-- Right: Order summary -->
                    <div class="summary-col">
                        <h2>Order Summary</h2>
                        <div class="summary-items">
                            <div class="summary-item" *ngFor="let item of items">
                                <div class="item-info">
                                    <img *ngIf="item.productImageUrl" [src]="item.productImageUrl" [alt]="item.productName" />
                                    <div class="item-text">
                                        <span class="item-name">{{ item.productName }}</span>
                                        <span class="item-variant" *ngIf="item.variantName">{{ item.variantName }}</span>
                                        <span class="item-qty">× {{ item.quantity }}</span>
                                    </div>
                                </div>
                                <span class="item-price">{{ currencySymbol }}{{ (item.unitPrice * item.quantity) | number:'1.2-2' }}</span>
                            </div>
                        </div>
                        <div class="summary-totals">
                            <div class="total-row subtotal">
                                <span>Subtotal</span>
                                <span>{{ currencySymbol }}{{ subtotal | number:'1.2-2' }}</span>
                            </div>
                            <div class="total-row shipping-note">
                                <span>Shipping</span>
                                <span>Calculated at confirmation</span>
                            </div>
                            <div class="total-row grand">
                                <span>Total</span>
                                <span>{{ currencySymbol }}{{ subtotal | number:'1.2-2' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .checkout-page { padding: 2rem 0 4rem; min-height: 60vh; }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 1rem; }
        .checkout-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; }
        .access-denied, .empty-cart { text-align: center; padding: 3rem; }
        .access-denied a, .empty-cart a { color: #007bff; }
        .success-state { text-align: center; padding: 3rem; }
        .success-icon { font-size: 3rem; color: #28a745; margin-bottom: 0.5rem; }
        .success-state h2 { margin-bottom: 0.5rem; }
        .btn-continue, .btn-orders { display: inline-block; margin: 0.5rem; padding: 8px 20px; border-radius: 4px; text-decoration: none; border: 1px solid #007bff; color: #007bff; }
        .btn-orders { background: #007bff; color: white; }
        .checkout-layout { display: grid; grid-template-columns: 1fr 420px; gap: 2.5rem; align-items: start; }
        @media(max-width: 860px) { .checkout-layout { grid-template-columns: 1fr; } }
        .form-section { margin-bottom: 1.75rem; }
        .form-section h2 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; padding-bottom: 6px; border-bottom: 1px solid #eee; }
        .form-row.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
        label { font-size: 0.8rem; color: #555; }
        input { border: 1px solid #ddd; border-radius: 4px; padding: 7px 10px; font-size: 0.9rem; }
        input:focus { outline: none; border-color: #007bff; }
        .payment-info { background: #f0f7ff; border-radius: 8px; padding: 1rem; font-size: 0.85rem; color: #555; }
        .error-msg { background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.85rem; }
        .btn-place-order { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .btn-place-order:hover:not(:disabled) { background: #0056b3; }
        .btn-place-order:disabled { background: #aaa; cursor: default; }
        /* Summary col */
        .summary-col { background: #f9f9f9; border-radius: 8px; padding: 1.5rem; }
        .summary-col h2 { font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; }
        .summary-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 1rem; }
        .summary-item { display: flex; justify-content: space-between; align-items: flex-start; }
        .item-info { display: flex; gap: 8px; align-items: flex-start; }
        .item-info img { width: 44px; height: 44px; object-fit: cover; border-radius: 4px; }
        .item-text { display: flex; flex-direction: column; }
        .item-name { font-size: 0.85rem; font-weight: 600; }
        .item-variant { font-size: 0.75rem; color: #888; }
        .item-qty { font-size: 0.75rem; color: #aaa; }
        .item-price { font-size: 0.9rem; font-weight: 600; }
        .summary-totals { border-top: 1px solid #eee; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 6px; }
        .total-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
        .total-row.grand { font-weight: 700; font-size: 1rem; border-top: 1px solid #ddd; padding-top: 6px; margin-top: 4px; }
        .shipping-note span:last-child { color: #aaa; font-size: 0.8rem; }
    `]
})
export class CheckoutPageComponent implements OnInit {
    items: CartItem[] = [];
    subtotal = 0;
    form: AddressForm = {
        firstName: '', lastName: '', email: '', phone: '',
        address1: '', address2: '', city: '', state: '',
        postalCode: '', country: ''
    };
    placing = false;
    submitted = false;
    orderNumber = '';
    errorMsg = '';
    guestBlocked = false;
    isLoggedIn = false;
    currencySymbol = '$';

    private readonly baseUrl = environment.apiUrl;

    constructor(
        private cartService: CartService,
        private authService: AuthService,
        private tenantFeatureService: TenantFeatureService,
        private http: HttpClient,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.isLoggedIn = this.authService.isAuthenticated();
        this.items = this.cartService.items;
        this.subtotal = this.cartService.subtotal;

        // Check guest checkout permission
        if (!this.isLoggedIn) {
            this.tenantFeatureService.allowGuestCheckout().subscribe(allowed => {
                if (!allowed) this.guestBlocked = true;
            });
        }

        // Pre-fill email from auth token
        if (this.isLoggedIn) {
            const user = this.authService.decodeToken();
            if (user?.email) this.form.email = user.email;
        }
    }

    isFormValid(): boolean {
        return !!(this.form.firstName && this.form.lastName && this.form.email && this.form.address1 && this.form.city && this.form.country);
    }

    placeOrder(): void {
        if (!this.isFormValid()) { this.errorMsg = 'Please fill in all required fields.'; return; }
        if (this.items.length === 0) { this.errorMsg = 'Your cart is empty.'; return; }

        this.placing = true;
        this.errorMsg = '';

        const payload = {
            customerFirstName: this.form.firstName,
            customerLastName: this.form.lastName,
            customerEmail: this.form.email,
            customerPhone: this.form.phone,
            shippingAddress: {
                firstName: this.form.firstName,
                lastName: this.form.lastName,
                address1: this.form.address1,
                address2: this.form.address2,
                city: this.form.city,
                state: this.form.state,
                postalCode: this.form.postalCode,
                country: this.form.country
            },
            items: this.items.map(i => ({
                productId: i.productId,
                productVariantId: i.productVariantId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                productName: i.productName
            })),
            notes: ''
        };

        this.http.post<{ orderId: string; orderNumber: string; paymentUrl?: string }>(`${this.baseUrl}/api/Order/Order_CreateCheckoutSession`, payload).subscribe({
            next: (result) => {
                this.placing = false;
                this.submitted = true;
                this.orderNumber = result.orderNumber;
                this.cartService.clearCart();
                if (result.paymentUrl) {
                    window.location.href = result.paymentUrl;
                }
            },
            error: (err) => {
                this.placing = false;
                this.errorMsg = err?.error?.message ?? 'Failed to place order. Please try again.';
            }
        });
    }
}
