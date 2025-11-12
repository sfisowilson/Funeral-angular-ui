import { Component, signal, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthServiceProxy, ChangePasswordRequest } from '../../../core/services/service-proxies';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss'
})
export class ChangePasswordDialogComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() passwordChanged = new EventEmitter<void>();

  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  loading = signal<boolean>(false);

  constructor(
    private authService: AuthServiceProxy,
    private messageService: MessageService
  ) {}

  onHide() {
    this.visibleChange.emit(false);
  }

  validatePasswords(): boolean {
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'All fields are required'
      });
      return false;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'New passwords do not match'
      });
      return false;
    }

    if (this.newPassword().length < 8) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Password must be at least 8 characters'
      });
      return false;
    }

    if (this.newPassword() === this.currentPassword()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'New password must be different from current password'
      });
      return false;
    }

    return true;
  }

  changePassword() {
    if (!this.validatePasswords()) {
      return;
    }

    this.loading.set(true);

    const request = new ChangePasswordRequest({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
      confirmPassword: this.confirmPassword()
    });

    // Debug: Log token availability
    console.log('🔐 Attempting password change...');
    const token = localStorage.getItem('auth_token');
    console.log('Token available:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token has sub claim:', !!payload.sub);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }

    this.authService.auth_ChangePassword(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password changed successfully'
        });
        
        // Clear form
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        
        this.loading.set(false);
        this.passwordChanged.emit();
        this.onHide();
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Password change error:', error);
        const errorMessage = error?.response || error?.message || error?.error?.error || 'Failed to change password';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
      }
    });
  }
}
