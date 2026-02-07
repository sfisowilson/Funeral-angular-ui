import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * HTTP Interceptor that treats HTTP 201 (Created) responses as successful.
 * By default, Angular's HttpClient only treats 2xx status codes ending in a successful path,
 * but 201 should be treated as success in POST/PUT operations that create resources.
 *
 * This interceptor normalizes 201 responses to 200 for easier client handling.
 */
@Injectable()
export class Http201SuccessInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            map((event) => {
                // If we get a 201 Created response, treat it as success (map it to a 200 for client code)
                if (event instanceof HttpResponse && event.status === 201) {
                    return event.clone({
                        status: 200,
                        statusText: 'OK'
                    });
                }
                return event;
            })
        );
    }
}
