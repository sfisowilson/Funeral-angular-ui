import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiServiceProxy, CustomPagesServiceProxy } from './service-proxies';
import { CustomPage, PageListItem, CreatePageRequest, UpdatePageRequest, PageLimits } from '../models/custom-page.model';

@Injectable({
    providedIn: 'root'
})
export class CustomPageService {
    private pagesSubject = new BehaviorSubject<PageListItem[]>([]);
    public pages$ = this.pagesSubject.asObservable();

    constructor(
        private customPagesServiceProxy: CustomPagesServiceProxy,
        private apiServiceProxy: ApiServiceProxy
    ) {}

    getPages(): Observable<PageListItem[]> {
        return this.customPagesServiceProxy
            .all()
            .pipe(map((response) => (response.result as any as PageListItem[]) || []), tap((pages) => this.pagesSubject.next(pages)));
    }

    getPageBySlug(slug: string): Observable<CustomPage> {
        return this.customPagesServiceProxy.slug(slug).pipe(map((response) => response.result as any as CustomPage));
    }

    getPageById(id: string): Observable<CustomPage> {
        return this.apiServiceProxy.customPagesGet(id).pipe(map((response) => response.result as any as CustomPage));
    }

    getPublicPages(): Observable<PageListItem[]> {
        return this.customPagesServiceProxy.public().pipe(map((response) => (response.result as any as PageListItem[]) || []));
    }

    getNavbarPages(): Observable<PageListItem[]> {
        return this.customPagesServiceProxy.navbar().pipe(map((response) => (response.result as any as PageListItem[]) || []));
    }

    getFooterPages(): Observable<PageListItem[]> {
        return this.customPagesServiceProxy.footer().pipe(map((response) => (response.result as any as PageListItem[]) || []));
    }

    createPage(request: CreatePageRequest): Observable<CustomPage> {
        return this.apiServiceProxy
            .customPagesPost(request as any)
            .pipe(map((response) => response.result as any as CustomPage), tap(() => this.getPages().subscribe()));
    }

    updatePage(request: UpdatePageRequest): Observable<CustomPage> {
        return this.apiServiceProxy
            .customPagesPut(request.id, request as any)
            .pipe(map((response) => response.result as any as CustomPage), tap(() => this.getPages().subscribe()));
    }

    deletePage(id: string): Observable<void> {
        return this.apiServiceProxy.customPagesDelete(id).pipe(map(() => undefined), tap(() => this.getPages().subscribe()));
    }

    duplicatePage(id: string): Observable<CustomPage> {
        return this.customPagesServiceProxy
            .duplicate(id)
            .pipe(map((response) => response.result as any as CustomPage), tap(() => this.getPages().subscribe()));
    }

    updatePageOrder(pageId: string, location: 'navbar' | 'footer', order: number): Observable<void> {
        return this.customPagesServiceProxy.order(pageId, { location, order } as any).pipe(map(() => undefined));
    }

    togglePageStatus(id: string, isActive: boolean): Observable<void> {
        return this.customPagesServiceProxy.status(id, { isActive } as any).pipe(map(() => undefined));
    }

    getPageLimits(): Observable<PageLimits> {
        return this.customPagesServiceProxy.limits().pipe(map((response) => response.result as any as PageLimits));
    }

    validateSlug(slug: string, excludeId?: string): Observable<boolean> {
        return this.customPagesServiceProxy.validateSlug(slug, excludeId).pipe(map((response) => !!response.result));
    }
}
