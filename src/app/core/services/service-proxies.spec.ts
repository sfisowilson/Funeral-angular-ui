import { TestBed } from '@angular/core/testing';

import { ServiceProxies } from './service-proxies';

describe('ServiceProxies', () => {
    let service: ServiceProxies;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ServiceProxies);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
