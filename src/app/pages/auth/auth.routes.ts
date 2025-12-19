import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { MemberRegistrationComponent } from './member-registration.component';
import { TenantRegisterWizardComponent } from './tenant-register-wizard/tenant-register-wizard.component';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ResetPasswordComponent } from './reset-password.component';

export const authRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent }, // Unified registration: tenant on host, member on tenant
    { path: 'member-register', component: MemberRegistrationComponent }, // Direct member registration
    { path: 'tenant-register', component: TenantRegisterWizardComponent }, // Tenant registration wizard (host only)
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
