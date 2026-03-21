import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NavConfigDto } from '../models/nav-config.model';
import { API_BASE_URL } from './service-proxies';

@Injectable({
    providedIn: 'root'
})
export class NavConfigService {
    private readonly apiUrl: string;

    constructor(
        private http: HttpClient,
        @Inject(API_BASE_URL) baseUrl: string
    ) {
        this.apiUrl = `${baseUrl}/api/nav-config`;
    }

    /** Fetch the nav config for the current tenant (anonymous — safe for public pages). */
    get(): Observable<NavConfigDto> {
        return this.http.get<NavConfigDto>(this.apiUrl);
    }

    /** Save (upsert) the nav config for the current tenant. Requires navConfig.manage permission. */
    put(dto: NavConfigDto): Observable<NavConfigDto> {
        return this.http.put<NavConfigDto>(this.apiUrl, dto);
    }
}
