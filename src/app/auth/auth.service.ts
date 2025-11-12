import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';

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

    // 2. Extract subdomain (e.g., "tenant1" from "tenant1.exampleui.com")
    const host = window.location.hostname; // Gets current UI host (tenant1.exampleui.com)
    const subdomain = host.split('.')[0]; // Extracts "tenant1"

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
