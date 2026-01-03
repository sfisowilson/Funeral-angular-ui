import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CustomPage, PageListItem, CreatePageRequest, UpdatePageRequest, PageLimits } from '../models/custom-page.model';

@Injectable({
    providedIn: 'root'
})
export class CustomPageService {
    private apiUrl = `${environment.apiUrl}/api/custom-pages`;
    private pagesSubject = new BehaviorSubject<PageListItem[]>([]);
    public pages$ = this.pagesSubject.asObservable();

    constructor(private http: HttpClient) {}

    getPages(): Observable<PageListItem[]> {
        return this.http.get<PageListItem[]>(this.apiUrl).pipe(
            tap(pages => this.pagesSubject.next(pages))
        );
    }

    getPageBySlug(slug: string): Observable<CustomPage> {
        return this.http.get<CustomPage>(`${this.apiUrl}/slug/${slug}`);
    }

    getPageById(id: string): Observable<CustomPage> {
        return this.http.get<CustomPage>(`${this.apiUrl}/${id}`);
    }

    getPublicPages(): Observable<PageListItem[]> {
        return this.http.get<PageListItem[]>(`${this.apiUrl}/public`);
    }

    getNavbarPages(): Observable<PageListItem[]> {
        return this.http.get<PageListItem[]>(`${this.apiUrl}/navbar`);
    }

    getFooterPages(): Observable<PageListItem[]> {
        return this.http.get<PageListItem[]>(`${this.apiUrl}/footer`);
    }

    createPage(request: CreatePageRequest): Observable<CustomPage> {
        return this.http.post<CustomPage>(this.apiUrl, request).pipe(
            tap(() => this.getPages().subscribe())
        );
    }

    updatePage(request: UpdatePageRequest): Observable<CustomPage> {
        return this.http.put<CustomPage>(`${this.apiUrl}/${request.id}`, request).pipe(
            tap(() => this.getPages().subscribe())
        );
    }

    deletePage(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.getPages().subscribe())
        );
    }

    duplicatePage(id: string): Observable<CustomPage> {
        return this.http.post<CustomPage>(`${this.apiUrl}/${id}/duplicate`, {}).pipe(
            tap(() => this.getPages().subscribe())
        );
    }

    updatePageOrder(pageId: string, location: 'navbar' | 'footer', order: number): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${pageId}/order`, { location, order });
    }

    togglePageStatus(id: string, isActive: boolean): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/status`, { isActive });
    }

    getPageLimits(): Observable<PageLimits> {
        return this.http.get<PageLimits>(`${this.apiUrl}/limits`);
    }

    validateSlug(slug: string, excludeId?: string): Observable<boolean> {
        const params: any = { slug };
        if (excludeId) params.excludeId = excludeId;
        return this.http.get<boolean>(`${this.apiUrl}/validate-slug`, { params });
    }
}
