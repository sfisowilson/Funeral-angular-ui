import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UserProfileServiceProxy, UserProfileDto, UpdateUserProfileDto, SaveSignatureDto } from '../../core/services/service-proxies';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth-service';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.css',
    standalone: true,
    imports: [FormsModule, CommonModule],
    providers: [UserProfileServiceProxy]
})
export class UserProfileComponent implements OnInit, AfterViewInit {
    userProfile: UserProfileDto = new UserProfileDto();
    updateUserProfileDto: UpdateUserProfileDto = new UpdateUserProfileDto();
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    // Signature
    @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D | null;
    private isDrawing = false;
    private lastX = 0;
    private lastY = 0;

    constructor(
        private userProfileService: UserProfileServiceProxy,
        public authService: AuthService
    ) {}

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.loadUserProfile();
    }
    
    ngAfterViewInit(): void {
        // Defer canvas setup until we might have it (e.g. if loaded)
        // But since it is in *ngIf="!isLoading", we might need to call setup when loading finishes.
    }

    setupCanvas(): void {
        if (!this.canvasRef) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d');
        
        // Load existing signature if available
        if (this.userProfile.signatureDataUrl) {
           const img = new Image();
           img.onload = () => {
               this.ctx?.drawImage(img, 0, 0);
           };
           img.src = this.userProfile.signatureDataUrl;
        }

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.lastX = touch.clientX - rect.left;
            this.lastY = touch.clientY - rect.top;
            this.isDrawing = true;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDrawing) return;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.drawLine(this.lastX, this.lastY, x, y);
            this.lastX = x;
            this.lastY = y;
        });
        
        canvas.addEventListener('touchend', () => this.stopDrawing());
    }

    startDrawing(e: MouseEvent): void {
        this.isDrawing = true;
        [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    }

    draw(e: MouseEvent): void {
        if (!this.isDrawing) return;
        this.drawLine(this.lastX, this.lastY, e.offsetX, e.offsetY);
        [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    }
    
    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        if (!this.ctx) return;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    stopDrawing(): void {
        this.isDrawing = false;
    }

    clearSignature(): void {
        if (!this.ctx || !this.canvasRef) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    forceSaveSignature(): void {
        if (!this.canvasRef) return;
        const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
        
        const dto = new SaveSignatureDto();
        dto.signatureDataUrl = dataUrl;

        this.userProfileService.userProfile_SaveSignature(dto)
            .subscribe({
                next: () => {
                    this.successMessage = 'Signature saved!';
                    this.userProfile.signatureDataUrl = dataUrl;
                     setTimeout(() => (this.successMessage = ''), 3000);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMessage = 'Failed to save signature.';
                }
            });
    }

    generateAgentCode(): void {
        this.isLoading = true;
        this.userProfileService.userProfile_GenerateAgentCode()
            .subscribe({
                next: (res) => {
                    // Assuming the response is mapped correctly or we handle custom mapping if generated poorly
                    // The generator likely returned void if type not found, or 'any' body
                    // We check if we need to reload to get the code or if we can extract it.
                    // Given the proxy "Observable<SwaggerResponse<void>>", it seems the Generator didn't pick up the anonymous return type { code: string }
                    // So we might need to reload the profile or cast result if possible
                    
                    // Reload profile to be safe and get the new code
                    this.loadUserProfile(); 
                    
                    this.successMessage = 'Agent code generated!';
                    this.isLoading = false;
                },
                error: (err) => {
                    this.errorMessage = 'Failed to generate code.';
                    this.isLoading = false;
                }
            });
    }

    loadUserProfile(): void {
        this.isLoading = true;
        this.errorMessage = '';

        if (!this.authService.isAuthenticated()) {
            this.isLoading = false;
            return;
        }

        this.userProfileService.userProfile_GetCurrentUserProfile().subscribe({
            next: (response) => {
                const profile = response?.result;
                if (profile) {
                    this.userProfile = profile;
                    this.updateUserProfileDto.firstName = profile.firstName;
                    this.updateUserProfileDto.lastName = profile.lastName;
                    this.updateUserProfileDto.phoneNumber = profile.phoneNumber;
                    this.updateUserProfileDto.address = profile.address;
                }
                this.isLoading = false;
                
                // Init canvas logic after view check?
                setTimeout(() => this.setupCanvas(), 100);
            },
            error: (error) => {
                console.error('Error loading profile:', error);
                this.errorMessage = 'Failed to load profile. Please try again.';
                this.isLoading = false;
            }
        });
    }

    updateProfile(): void {
        if (!this.isFormValid()) {
            this.errorMessage = 'Please fill in all required fields.';
            return;
        }

        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';

        this.userProfileService.userProfile_UpdateCurrentUserProfile(this.updateUserProfileDto).subscribe({
            next: () => {
                this.successMessage = 'Profile updated successfully!';
                this.loadUserProfile();
                setTimeout(() => (this.successMessage = ''), 3000);
            },
            error: (error) => {
                console.error('Error updating profile:', error);
                this.errorMessage = 'Failed to update profile. Please try again.';
                this.isLoading = false;
            }
        });
    }

    isFormValid(): boolean {
        return !!(this.updateUserProfileDto.firstName && this.updateUserProfileDto.lastName);
    }

    resetForm(): void {
        this.updateUserProfileDto.firstName = this.userProfile.firstName;
        this.updateUserProfileDto.lastName = this.userProfile.lastName;
        this.updateUserProfileDto.phoneNumber = this.userProfile.phoneNumber;
        this.updateUserProfileDto.address = this.userProfile.address;
        this.successMessage = '';
        this.errorMessage = '';
    }
}
