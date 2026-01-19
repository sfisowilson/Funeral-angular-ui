import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * HTTP Interceptor that automatically unwraps SwaggerResponse objects
 * When NSwag has wrapResponses: true, all responses come wrapped in a SwaggerResponse object
 * This interceptor extracts the result property automatically for all responses
 */
@Injectable()
export class SwaggerResponseInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      map((event: HttpEvent<unknown>) => {
        // Only process successful HTTP responses
        if (event instanceof HttpResponse) {
          const response = event.body;
          
          // Check if it's a SwaggerResponse object with a result property
          if (response && typeof response === 'object' && 'result' in response && !Array.isArray(response)) {
            // Clone the response event with the unwrapped result
            return event.clone({ body: response.result });
          }
        }
        
        return event;
      })
    );
  }
}
