import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerServiceProxy, CustomerDto, CreateCustomerDto, UpdateCustomerDto, CustomerStatsDto } from './service-proxies';

export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  isActive: boolean;
  acceptsMarketing: boolean;
  notes?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id?: string;
  customerId?: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isShipping: boolean;
  isBilling: boolean;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalCustomerValue: number;
  averageCustomerValue: number;
  customersWithOrders: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private customerProxy: CustomerServiceProxy) {}

  getCustomers(isActive?: boolean, search?: string): Observable<Customer[]> {
    return this.customerProxy.customer_GetAll(isActive, search) as Observable<Customer[]>;
  }

  getCustomer(id: string): Observable<Customer> {
    return this.customerProxy.customer_GetById(id) as Observable<Customer>;
  }

  getCustomerByEmail(email: string): Observable<Customer | undefined> {
    // Would need a dedicated endpoint or filter on client side
    return new Observable(observer => {
      observer.next(undefined);
      observer.complete();
    });
  }

  createCustomer(customer: Customer): Observable<Customer> {
    const dto = new CreateCustomerDto(customer as any);
    return this.customerProxy.customer_Create(dto) as Observable<Customer>;
  }

  updateCustomer(customer: Customer): Observable<Customer> {
    const dto = new UpdateCustomerDto({ ...customer, id: customer.id! } as any);
    return this.customerProxy.customer_Update(dto) as Observable<Customer>;
  }

  deleteCustomer(id: string): Observable<void> {
    return this.customerProxy.customer_Delete(id) as Observable<void>;
  }

  addAddress(customerId: string, address: CustomerAddress): Observable<CustomerAddress> {
    // Would need a dedicated endpoint
    return new Observable(observer => {
      observer.next(address);
      observer.complete();
    });
  }

  updateAddress(address: CustomerAddress): Observable<CustomerAddress> {
    // Would need a dedicated endpoint
    return new Observable(observer => {
      observer.next(address);
      observer.complete();
    });
  }

  deleteAddress(customerId: string, addressId: string): Observable<void> {
    // Would need a dedicated endpoint
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  setDefaultAddress(customerId: string, addressId: string): Observable<void> {
    // Would need a dedicated endpoint
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  getCustomerStats(): Observable<CustomerStats> {
    return this.customerProxy.customer_GetStats() as Observable<CustomerStats>;
  }
}
