import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MultiSubmitStepContextDto {
  step: any;
  records: Array<{
    id: string;
    tenantId: string;
    entityTypeId: string;
    displayName?: string | null;
    externalKey?: string | null;
    dataJson: string;
  }>;
}

export interface SaveMultiSubmitRecordDto {
  stepKey: string;
  id?: string | null;
  displayName?: string | null;
  dataJson: string;
}

@Injectable({ providedIn: 'root' })
export class OnboardingMultiSubmitService {
  private readonly baseUrl = environment.apiUrl + '/api/OnboardingMultiSubmit';

  constructor(private http: HttpClient) {}

  getStepContext(stepKey?: string): Observable<MultiSubmitStepContextDto> {
    let params = new HttpParams();
    if (stepKey) {
      params = params.set('stepKey', stepKey);
    }
    return this.http.get<MultiSubmitStepContextDto>(
      `${this.baseUrl}/OnboardingMultiSubmit_GetStepContext`,
      { params }
    );
  }

  saveRecord(dto: SaveMultiSubmitRecordDto): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/OnboardingMultiSubmit_SaveRecord`,
      dto
    );
  }

  deleteRecord(stepKey: string | undefined, recordId: string): Observable<void> {
    let params = new HttpParams().set('recordId', recordId);
    if (stepKey) {
      params = params.set('stepKey', stepKey);
    }
    return this.http.delete<void>(
      `${this.baseUrl}/OnboardingMultiSubmit_DeleteRecord`,
      { params }
    );
  }
}
