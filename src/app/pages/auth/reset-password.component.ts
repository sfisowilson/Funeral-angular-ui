import { Component, Injector } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthServiceProxy, ResetPasswordRequest } from '../../core/services/service-proxies';
import { TenantBaseComponent } from '../../core/tenant-base.component';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule, RouterModule, ToastModule],
    providers: [MessageService],
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
        private route: ActivatedRoute,
        private messageService: MessageService
    ) {
        super(injector);
        this.form = this.fb.group(
            {
                password: ['', [Validators.required, Validators.minLength(8)]],
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
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Link',
                detail: 'The reset link is invalid or has expired. Please request a new one.',
                life: 5000
            });
            this.isBusy = false;
            return;
        }

        const resetPasswordRequest = new ResetPasswordRequest();
        resetPasswordRequest.email = this.email;
        resetPasswordRequest.code = this.code;
        resetPasswordRequest.newPassword = this.form.value.password;

        this.authServiceProxy.auth_ResetPassword(resetPasswordRequest).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Password Reset',
                    detail: 'Your password has been reset successfully.',
                    life: 4000
                });
                setTimeout(() => this.router.navigate(['/auth/login']), 2000);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Reset Failed',
                    detail: 'Invalid or expired reset code. Please request a new reset link.',
                    life: 5000
                });
                this.isBusy = false;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }
}
