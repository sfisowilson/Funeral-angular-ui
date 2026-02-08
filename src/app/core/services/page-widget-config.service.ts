import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PageWidgetConfigDto {
  id: string;
  pageKey: string;
  widgetKey: string;
  isVisible: boolean;
  allowedRoles: string[];
  displayOrder: number;
  settingsJson?: string | null;
  layoutJson?: string | null;
}

export interface CreatePageWidgetConfigDto {
  pageKey: string;
  widgetKey: string;
  isVisible: boolean;
  allowedRoles: string[];
  displayOrder: number;
  settingsJson?: string | null;
  layoutJson?: string | null;
}

export interface UpdatePageWidgetConfigDto {
  id: string;
  isVisible: boolean;
  allowedRoles: string[];
  displayOrder: number;
  settingsJson?: string | null;
  layoutJson?: string | null;
}

interface PageRolesRequest {
  pageKey: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class PageWidgetConfigService {
  private readonly baseUrl = environment.apiUrl + '/api/PageWidgetConfig';

  constructor(private http: HttpClient) {}

  getConfigsForPage(pageKey: string): Observable<PageWidgetConfigDto[]> {
    return this.http.get<PageWidgetConfigDto[]>(`${this.baseUrl}/PageWidgetConfig_GetByPage/${encodeURIComponent(pageKey)}`);
  }

  getVisibleConfigsForPage(pageKey: string, roles: string[]): Observable<PageWidgetConfigDto[]> {
    const body: PageRolesRequest = { pageKey, roles };
    return this.http.post<PageWidgetConfigDto[]>(`${this.baseUrl}/PageWidgetConfig_GetVisibleByRolesForPage`, body);
  }

  createConfig(dto: CreatePageWidgetConfigDto): Observable<PageWidgetConfigDto> {
    return this.http.post<PageWidgetConfigDto>(`${this.baseUrl}/PageWidgetConfig_Create`, dto);
  }

  updateConfig(dto: UpdatePageWidgetConfigDto): Observable<PageWidgetConfigDto> {
    return this.http.put<PageWidgetConfigDto>(`${this.baseUrl}/PageWidgetConfig_Update`, dto);
  }

  deleteConfig(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/PageWidgetConfig_Delete/${id}`);
  }
}
