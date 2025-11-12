import { Component, Injector } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthServiceProxy, ResetPasswordRequest } from '../../core/services/service-proxies';
import { TenantBaseComponent } from '../../core/tenant-base.component';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule, RouterModule],
    providers: [AuthServiceProxy],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent extends TenantBaseComponent {
    form: FormGroup;
    isBusy: boolean = false;
    email: string | null = null;
    code: string | null = null;

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private authServiceProxy: AuthServiceProxy,
        private router: Router,
        private route: ActivatedRoute
    ) {
        super(injector);
        this.form = this.fb.group(
            {
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirmPassword: ['', Validators.required]
            },
            { validators: this.passwordMatchValidator }
        );

        this.route.queryParams.subscribe((params) => {
            this.email = params['email'];
            this.code = params['code'];
        });
    }

    passwordMatchValidator(form: FormGroup) {
        return form.get('password')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true };
    }

    resetPassword() {
        this.isBusy = true;
        if (this.form.invalid) {
            this.isBusy = false;
            return;
        }

        if (!this.email || !this.code) {
            alert('Email or code missing.');
            this.isBusy = false;
            return;
        }

        const resetPasswordRequest = new ResetPasswordRequest();
        resetPasswordRequest.email = this.email;
        resetPasswordRequest.code = this.code;
        resetPasswordRequest.newPassword = this.form.value.password;

        this.authServiceProxy.auth_ResetPassword(resetPasswordRequest).subscribe({
            next: () => {
                alert('Password has been reset successfully.');
                this.router.navigate(['/auth/login']);
            },
            error: (err) => {
                alert('Error resetting password: ' + err.message);
                this.isBusy = false;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }
}
