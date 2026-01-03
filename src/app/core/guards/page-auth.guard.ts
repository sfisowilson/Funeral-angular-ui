import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { CustomPageService } from '../services/custom-page.service';
import { AuthService } from '../../auth/auth-service';
import { map, catchError, of } from 'rxjs';

export const pageAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const customPageService = inject(CustomPageService);
  const authService = inject(AuthService);

  const slug = route.params['slug'];
  
  if (!slug) {
    return true;
  }

  return customPageService.getPageBySlug(slug).pipe(
    map(page => {
      // Check if page requires authentication
      if (page.requiresAuth && !authService.isAuthenticated()) {
        // Redirect to login with return URL
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      // Check if page is public
      if (!page.isPublic && !authService.isAuthenticated()) {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      return true;
    }),
    catchError((error) => {
      // If page not found, let the component handle it (don't log as error)
      if (error.status === 404) {
        return of(true);
      }
      // For other errors, log and redirect to home
      console.error('Error checking page auth:', error);
      router.navigate(['/']);
      return of(false);
    })
  );
};
