import { Component, Injector } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthServiceProxy, ForgotPasswordRequest } from '../../core/services/service-proxies';
import { TenantBaseComponent } from '../../core/tenant-base.component';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ButtonModule, InputTextModule, ReactiveFormsModule, RouterModule],
    providers: [AuthServiceProxy],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends TenantBaseComponent {
    form: FormGroup;
    isBusy: boolean = false;

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private authServiceProxy: AuthServiceProxy,
        private router: Router
    ) {
        super(injector);
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    sendResetLink() {
        this.isBusy = true;
        if (this.form.invalid) {
            this.isBusy = false;
            return;
        }

        const forgotPasswordRequest = new ForgotPasswordRequest();
        forgotPasswordRequest.email = this.form.value.email;

        this.authServiceProxy.auth_ForgotPassword(forgotPasswordRequest).subscribe({
            next: () => {
                alert('Password reset link sent to your email.');
                this.router.navigate(['/auth/reset-password']);
            },
            error: (err) => {
                alert('Error sending reset link: ' + err.message);
                this.isBusy = false;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }
}
