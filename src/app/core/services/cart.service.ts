import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { AuthService } from '../../auth/auth-service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productImageUrl?: string;
    productVariantId?: string;
    variantName?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    stockQuantity: number;
}

export interface Cart {
    id: string;
    sessionId?: string;
    userId?: string;
    items: CartItem[];
    subtotal: number;
    totalQuantity: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService implements OnDestroy {
    private readonly CART_SESSION_KEY = 'shop_cart_session_id';
    private readonly CART_ITEMS_KEY = 'shop_cart_items';
    private readonly baseUrl = environment.apiUrl;

    private _cart$ = new BehaviorSubject<CartItem[]>([]);
    readonly cart$ = this._cart$.asObservable();

    get count$(): Observable<number> {
        return new Observable((obs) => this._cart$.subscribe((items) => obs.next(items.reduce((sum, i) => sum + i.quantity, 0))));
    }

    get subtotal$(): Observable<number> {
        return new Observable((obs) => this._cart$.subscribe((items) => obs.next(items.reduce((sum, i) => sum + i.lineTotal, 0))));
    }

    get count(): number {
        return this._cart$.value.reduce((sum, i) => sum + i.quantity, 0);
    }

    get subtotal(): number {
        return this._cart$.value.reduce((sum, i) => sum + i.lineTotal, 0);
    }

    get items(): CartItem[] {
        return this._cart$.value;
    }

    constructor(
        private storage: StorageService,
        private authService: AuthService,
        private http: HttpClient
    ) {
        this._loadCart();
    }

    ngOnDestroy() {
        this._cart$.complete();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    addItem(productId: string, quantity: number, unitPrice: number, productName: string, options?: {
        productImageUrl?: string;
        productVariantId?: string;
        variantName?: string;
        sku?: string;
        stockQuantity?: number;
    }): void {
        const current = [...this._cart$.value];
        const existing = current.find(
            (i) => i.productId === productId && i.productVariantId === (options?.productVariantId ?? undefined)
        );

        if (existing) {
            existing.quantity += quantity;
            existing.lineTotal = existing.quantity * existing.unitPrice;
        } else {
            current.push({
                id: this._uuid(),
                productId,
                productName,
                productImageUrl: options?.productImageUrl,
                productVariantId: options?.productVariantId,
                variantName: options?.variantName,
                sku: options?.sku,
                quantity,
                unitPrice,
                lineTotal: unitPrice * quantity,
                stockQuantity: options?.stockQuantity ?? 999
            });
        }
        this._updateCart(current);

        // Mirror to backend if logged in
        if (this.authService.isAuthenticated()) {
            this._addToBackend(productId, quantity, options?.productVariantId).subscribe();
        }
    }

    updateQuantity(itemId: string, quantity: number): void {
        if (quantity <= 0) {
            this.removeItem(itemId);
            return;
        }
        const current = this._cart$.value.map((i) =>
            i.id === itemId ? { ...i, quantity, lineTotal: i.unitPrice * quantity } : i
        );
        this._updateCart(current);

        if (this.authService.isAuthenticated()) {
            this._updateBackendItem(itemId, quantity).subscribe();
        }
    }

    removeItem(itemId: string): void {
        const current = this._cart$.value.filter((i) => i.id !== itemId);
        this._updateCart(current);

        if (this.authService.isAuthenticated()) {
            this.http.delete(`${this.baseUrl}/api/Cart/Cart_RemoveItem/${itemId}`).pipe(catchError(() => of(null))).subscribe();
        }
    }

    clearCart(): void {
        this._updateCart([]);
        const sessionId = this._getOrCreateSessionId();

        if (this.authService.isAuthenticated()) {
            this.http.post(`${this.baseUrl}/api/Cart/Cart_Clear`, {}).pipe(catchError(() => of(null))).subscribe();
        } else {
            this.http.post(`${this.baseUrl}/api/Cart/Cart_Clear?sessionId=${sessionId}`, {}).pipe(catchError(() => of(null))).subscribe();
        }
    }

    /**
     * Call after login to merge the guest session cart into the user's backend cart,
     * then reload from backend.
     */
    mergeGuestCartOnLogin(): void {
        const sessionId = this.storage.getItem<string>(this.CART_SESSION_KEY);
        if (!sessionId) return;

        this.http.post<any>(`${this.baseUrl}/api/Cart/Cart_MergeGuestCart`, { sessionId }).pipe(
            tap((cart) => {
                if (cart?.items) this._syncFromBackend(cart.items);
                this.storage.removeItem(this.CART_SESSION_KEY);
            }),
            catchError(() => of(null))
        ).subscribe();
    }

    /**
     * Reload cart from backend (for logged-in users).
     */
    reloadFromBackend(): void {
        if (!this.authService.isAuthenticated()) return;
        this.http.get<any>(`${this.baseUrl}/api/Cart/Cart_Get`).pipe(
            tap((cart) => { if (cart?.items) this._syncFromBackend(cart.items); }),
            catchError(() => of(null))
        ).subscribe();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private _loadCart(): void {
        const saved = this.storage.getItem<CartItem[]>(this.CART_ITEMS_KEY);
        if (saved && Array.isArray(saved)) {
            this._cart$.next(saved);
        }
    }

    private _updateCart(items: CartItem[]): void {
        this._cart$.next(items);
        this.storage.setItem(this.CART_ITEMS_KEY, items);
    }

    private _syncFromBackend(backendItems: any[]): void {
        const mapped: CartItem[] = backendItems.map((i: any) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            productImageUrl: i.productImageUrl,
            productVariantId: i.productVariantId,
            variantName: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal ?? i.unitPrice * i.quantity,
            stockQuantity: i.stockQuantity ?? 999
        }));
        this._updateCart(mapped);
    }

    private _getOrCreateSessionId(): string {
        let sessionId = this.storage.getItem<string>(this.CART_SESSION_KEY);
        if (!sessionId) {
            sessionId = this._uuid();
            this.storage.setItem(this.CART_SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    private _addToBackend(productId: string, quantity: number, variantId?: string): Observable<any> {
        const sessionId = this._getOrCreateSessionId();
        return this.http.post(`${this.baseUrl}/api/Cart/Cart_AddItem`, {
            productId,
            quantity,
            productVariantId: variantId ?? null,
            sessionId
        }).pipe(catchError(() => of(null)));
    }

    private _updateBackendItem(cartItemId: string, quantity: number): Observable<any> {
        return this.http.put(`${this.baseUrl}/api/Cart/Cart_UpdateItem`, { cartItemId, quantity }).pipe(catchError(() => of(null)));
    }

    private _uuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
    }
}
