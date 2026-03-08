import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormDto, FormServiceProxy } from './service-proxies';

@Injectable({ providedIn: 'root' })
export class PublicFormService {
    constructor(private formService: FormServiceProxy) {}

    getFormById(id: string): Observable<FormDto> {
        return this.formService
            .form_PublicGetById(id)
            .pipe(map((response) => response.result as FormDto));
    }
}
