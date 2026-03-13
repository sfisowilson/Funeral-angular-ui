import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrderServiceProxy, OrderDto, CreateOrderDto, UpdateOrderStatusDto, OrderStatsDto, UpdateOrderTrackingDto } from './service-proxies';

export interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    shippingAddress: Address;
    billingAddress: Address;
    notes?: string;
    trackingNumber?: string;
    shippingCarrier?: string;
    trackingUrl?: string;
    paymentMethod?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially-refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partially-fulfilled' | 'fulfilled' | 'shipped' | 'delivered';

export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    image?: string;
}

export interface Address {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    statusBreakdown: { [key: string]: number };
    revenueByMonth: { month: string; revenue: number }[];
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    constructor(private orderProxy: OrderServiceProxy) {}

    getOrders(status?: string): Observable<Order[]> {
        const statusValue = status ? this.mapStatusToEnum(status) : undefined;
        return this.orderProxy.order_GetAll(statusValue as any).pipe(map((r: any) => r?.result ?? r ?? []));
    }

    getOrder(id: string): Observable<Order> {
        return this.orderProxy.order_GetById(id).pipe(map((r: any) => r?.result ?? r));
    }

    getOrderByNumber(orderNumber: string): Observable<Order> {
        // Would filter on client side or use dedicated endpoint
        return new Observable((observer) => observer.complete());
    }

    getCustomerOrders(customerId: string): Observable<Order[]> {
        return this.getOrders();
    }

    createOrder(order: Partial<Order>): Observable<Order> {
        const dto = new CreateOrderDto(order as any);
        return this.orderProxy.order_Create(dto).pipe(map((r: any) => r?.result ?? r));
    }

    updateOrder(id: string, order: Partial<Order>): Observable<Order> {
        return new Observable((observer) => {
            observer.next(order as Order);
            observer.complete();
        });
    }

    updateOrderStatus(id: string, status: string): Observable<Order> {
        const dto = new UpdateOrderStatusDto({ orderId: id, status: this.mapStatusToEnum(status) as any, note: undefined });
        return this.orderProxy.order_UpdateStatus(dto).pipe(map((r: any) => r?.result ?? r));
    }

    updatePaymentStatus(id: string, paymentStatus: string): Observable<Order> {
        return new Observable((observer) => observer.complete());
    }

    updateFulfillmentStatus(id: string, fulfillmentStatus: string, trackingNumber?: string): Observable<Order> {
        return new Observable((observer) => observer.complete());
    }

    updateTracking(orderId: string, trackingNumber?: string, shippingCarrier?: string, trackingUrl?: string): Observable<void> {
        const dto = new UpdateOrderTrackingDto({ orderId, trackingNumber, shippingCarrier, trackingUrl });
        return this.orderProxy.order_UpdateTracking(dto) as any as Observable<void>;
    }

    cancelOrder(id: string, reason?: string): Observable<Order> {
        const dto = new UpdateOrderStatusDto({ orderId: id, status: 3 as any, note: reason });
        return this.orderProxy.order_UpdateStatus(dto).pipe(map((r: any) => r?.result ?? r));
    }

    refundOrder(id: string, amount: number, reason?: string): Observable<Order> {
        return new Observable((observer) => observer.complete());
    }

    getOrderStats(): Observable<OrderStats> {
        return this.orderProxy.order_GetStats().pipe(map((r: any) => r?.result ?? r));
    }

    searchOrders(query: string): Observable<Order[]> {
        return this.getOrders();
    }

    private mapStatusToEnum(status: string): number {
        const statusMap: Record<string, number> = {
            pending: 0,
            processing: 1,
            completed: 2,
            cancelled: 3,
            refunded: 4
        };
        return statusMap[status.toLowerCase()] || 0;
    }
}
