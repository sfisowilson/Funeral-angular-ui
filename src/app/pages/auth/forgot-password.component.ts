import { Component, Injector } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/services/generated/auth/auth.service';
import { TenantBaseComponent } from '../../core/tenant-base.component';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ButtonModule, InputTextModule, ReactiveFormsModule, RouterModule],
    providers: [],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends TenantBaseComponent {
    form: FormGroup;
    isBusy: boolean = false;

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private authService: AuthService,
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

        this.authService.postApiAuthAuthForgotPassword({
            email: this.form.value.email
        }).subscribe({
            next: () => {
                alert('Password reset link sent to your email.');
                this.router.navigate(['/auth/reset-password']);
            },
            error: (err: any) => {
                alert('Error sending reset link: ' + err.message);
                this.isBusy = false;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }
}
