import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';
import { environment } from '../environments/environment';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();


    // Clone the request to modify headers
    let modifiedReq = req.clone();

    // 1. Add Authorization header if token exists
    if (token) {
        modifiedReq = modifiedReq.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (req.url.includes('Auth_ChangePassword')) {
            console.log('✅ Authorization header added');
        }
    } else if (req.url.includes('Auth_ChangePassword')) {
        console.log('❌ No token available for Auth_ChangePassword');
    }

    // 2. Extract subdomain intelligently for multi-level TLDs like dev.co.za or mizo.co.za
    // For dev.co.za: subdomain = '' (empty, it's the host)
    // For tenant.dev.co.za: subdomain = 'tenant'
    const host = window.location.hostname;
    let subdomain = '';
    
    const baseDomain = environment.baseDomain;
    if (host.endsWith(baseDomain) && host !== baseDomain) {
        // Remove the base domain and the trailing dot
        subdomain = host.substring(0, host.length - baseDomain.length - 1);
    }

    // 3. Add X-Tenant-ID header (only if subdomain exists and is not "www")
    if (subdomain && subdomain !== 'www') {
        modifiedReq = modifiedReq.clone({
            setHeaders: {
                'X-Tenant-ID': subdomain
            }
        });
    }

    // 4. Handle HTTP errors, especially 401 Unauthorized
    return next(modifiedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Clear the authentication token
                authService.removeToken();
                
                // Navigate to login with session expired message
                router.navigate(['/auth/login'], {
                    queryParams: { 
                        sessionExpired: 'true',
                        returnUrl: router.url 
                    }
                });
                
                console.warn('🔒 Session expired - redirecting to login');
            }
            
            return throwError(() => error);
        })
    );
};
