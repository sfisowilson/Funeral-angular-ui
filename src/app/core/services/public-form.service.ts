import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FormDto } from './service-proxies';

@Injectable({ providedIn: 'root' })
export class PublicFormService {
    private readonly baseUrl = environment.apiUrl ?? '';

    constructor(private http: HttpClient) {}

    getFormById(id: string): Observable<FormDto> {
        const encodedId = encodeURIComponent(id);
        const url = `${this.baseUrl}/api/Form/Form_PublicGetById/${encodedId}`;
        return this.http.get<FormDto>(url);
    }
}
