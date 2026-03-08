import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageWidgetConfigServiceProxy } from './service-proxies';

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
  constructor(private pageWidgetConfigServiceProxy: PageWidgetConfigServiceProxy) {}

  getConfigsForPage(pageKey: string): Observable<PageWidgetConfigDto[]> {
    return this.pageWidgetConfigServiceProxy
      .pageWidgetConfig_GetByPage(pageKey)
      .pipe(map((response) => (response.result as any as PageWidgetConfigDto[]) || []));
  }

  getVisibleConfigsForPage(pageKey: string, roles: string[]): Observable<PageWidgetConfigDto[]> {
    const body: PageRolesRequest = { pageKey, roles };
    return this.pageWidgetConfigServiceProxy
      .pageWidgetConfig_GetVisibleByRolesForPage(body as any)
      .pipe(map((response) => (response.result as any as PageWidgetConfigDto[]) || []));
  }

  createConfig(dto: CreatePageWidgetConfigDto): Observable<PageWidgetConfigDto> {
    return this.pageWidgetConfigServiceProxy
      .pageWidgetConfig_Create(dto as any)
      .pipe(map((response) => response.result as any as PageWidgetConfigDto));
  }

  updateConfig(dto: UpdatePageWidgetConfigDto): Observable<PageWidgetConfigDto> {
    return this.pageWidgetConfigServiceProxy
      .pageWidgetConfig_Update(dto as any)
      .pipe(map((response) => response.result as any as PageWidgetConfigDto));
  }

  deleteConfig(id: string): Observable<boolean> {
    return this.pageWidgetConfigServiceProxy
      .pageWidgetConfig_Delete(id)
      .pipe(map((response) => !!response.result));
  }
}
