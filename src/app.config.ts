import { provideHttpClient, withFetch, withInterceptors, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, enableProdMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { environment } from './environments/environment';
import { SwaggerResponseInterceptor } from './app/core/interceptors/swagger-response.interceptor';
import { Http201SuccessInterceptor } from './app/core/interceptors/http-201-success.interceptor';
import { 
    API_BASE_URL, 
    TenantSettingServiceProxy, 
    FileUploadServiceProxy, 
    MemberProfileCompletionServiceProxy, 
    DependentServiceProxy, 
    BeneficiaryServiceProxy, 
    TermsServiceProxy, 
    RequiredDocumentServiceProxy, 
    VerificationServiceProxy, 
    PremiumCalculationServiceProxy,
    AuthServiceProxy,
    MemberServiceProxy,
    MemberBankingDetailServiceProxy,
    MemberRegistrationServiceProxy,
    Payment_configServiceProxy,
    Payment_gatewayServiceProxy,
    Debit_orderServiceProxy,
    Tenant_bankingServiceProxy,
    Tenant_invoiceServiceProxy,
    NgoServiceProxy,
    CustomPagesServiceProxy
} from './app/core/services/service-proxies';
import { AuthService } from './app/auth/auth-service';
import { AuthInterceptor } from './app/auth/auth.service';
import { appInitializerProvider } from './app/core/services/tenant-settings.service';
import { TenantService } from './app/core/services/tenant.service';

if (environment.production) {
    enableProdMode();
}

export function initializeAuth(authService: AuthService) {
    return (): Promise<void> => {
        return authService.init().then(() => console.log('APP_INITIALIZER: initializeAuth completed'));
    };
}

export function initializeTenant(tenantService: TenantService) {
    return (): Promise<void> => {
        return tenantService.determineTenant().then(() => console.log('APP_INITIALIZER: initializeTenant completed'));
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        AuthService,
        TenantSettingServiceProxy,
        FileUploadServiceProxy,
        MemberProfileCompletionServiceProxy,
        CustomPagesServiceProxy,
        DependentServiceProxy,
        BeneficiaryServiceProxy,
        TermsServiceProxy,
        RequiredDocumentServiceProxy,
        VerificationServiceProxy,
        PremiumCalculationServiceProxy,
        AuthServiceProxy,
        MemberServiceProxy,
        MemberBankingDetailServiceProxy,
        MemberRegistrationServiceProxy,
        Payment_configServiceProxy,
        Payment_gatewayServiceProxy,
        Debit_orderServiceProxy,
        Tenant_bankingServiceProxy,
        Tenant_invoiceServiceProxy,
        NgoServiceProxy,
        appInitializerProvider,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuth,
            deps: [AuthService],
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeTenant,
            deps: [TenantService],
            multi: true
        },
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withInterceptorsFromDi(), withInterceptors([AuthInterceptor])),
        { provide: HTTP_INTERCEPTORS, useClass: SwaggerResponseInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: Http201SuccessInterceptor, multi: true },
        provideAnimationsAsync(),
        { 
            provide: API_BASE_URL, 
            useValue: (() => {
                console.log('🔍 Environment loaded:', { 
                    apiUrl: environment.apiUrl, 
                    baseDomain: environment.baseDomain,
                    production: environment.production 
                });
                return environment.apiUrl;
            })()
        },
        providePrimeNG({ theme: { preset: Aura } })
    ]
};
