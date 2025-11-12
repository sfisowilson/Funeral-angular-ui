import { Component, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../auth/auth-service';

@Component({
  selector: 'app-summary-step',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './summary-step.component.html',
  styleUrl: './summary-step.component.scss'
})
export class SummaryStepComponent implements OnInit {
  viewMode = input<boolean>(false);
  memberId = input<string | undefined>(undefined);
  stepComplete = output<void>();
  
  pdfUrl = signal<SafeResourceUrl | null>(null);
  isLoadingPdf = signal(false);
  isDownloading = signal(false);
  isSigning = signal(false);
  
  // Signature canvas
  isDrawing = false;
  signatureDataUrl = signal<string | null>(null);
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPdfPreview();
    
    // Load existing signature in view mode
    if (this.viewMode()) {
      this.loadExistingSignature();
    }
  }

  ngAfterViewInit() {
    this.initializeCanvas();
  }

  initializeCanvas() {
    this.canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
      }
    }
  }

  loadPdfPreview() {
    this.isLoadingPdf.set(true);
    
    // Build URL with optional memberId query parameter
    let url = `${this.apiUrl}/api/OnboardingPdf/OnboardingPdf_PreviewPdf`;
    if (this.memberId()) {
      url += `?memberId=${this.memberId()}`;
    }
    
    // Get token from AuthService and add to headers
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.get(url, { responseType: 'blob', headers }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl));
        this.isLoadingPdf.set(false);
      },
      error: (error: any) => {
        console.error('Error loading PDF preview:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to load PDF preview'
        });
        this.isLoadingPdf.set(false);
      }
    });
  }

  downloadPdf() {
    this.isDownloading.set(true);
    
    // Build URL with optional memberId query parameter
    let url = `${this.apiUrl}/api/OnboardingPdf/OnboardingPdf_DownloadPdf`;
    if (this.memberId()) {
      url += `?memberId=${this.memberId()}`;
    }
    
    // Get token from AuthService and add to headers
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.get(url, { responseType: 'blob', headers }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Onboarding_Summary_${new Date().toISOString()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        this.isDownloading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'PDF downloaded successfully'
        });
      },
      error: (error: any) => {
        console.error('Error downloading PDF:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to download PDF'
        });
        this.isDownloading.set(false);
      }
    });
  }

  // Canvas drawing methods
  startDrawing(event: MouseEvent) {
    if (!this.ctx || !this.canvas) return;
    
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing || !this.ctx || !this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    if (this.ctx) {
      this.ctx.closePath();
    }
    
    // Save signature as data URL
    if (this.canvas) {
      this.signatureDataUrl.set(this.canvas.toDataURL('image/png'));
    }
  }

  clearSignature() {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.signatureDataUrl.set(null);
    this.messageService.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'Signature cleared'
    });
  }

  signAndComplete() {
    if (!this.signatureDataUrl()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Signature Required',
        detail: 'Please provide your signature before completing'
      });
      return;
    }

    this.isSigning.set(true);
    
    // First, save the signature
    const saveSignatureUrl = `${this.apiUrl}/api/Member/Member_SaveSignature`;
    
    this.http.post(saveSignatureUrl, { 
      signatureDataUrl: this.signatureDataUrl() 
    }).subscribe({
      next: () => {
        // Then recalculate profile completion status
        const recalculateUrl = `${this.apiUrl}/api/MemberProfileCompletion/ProfileCompletion_RecalculateMy`;
        
        this.http.post(recalculateUrl, {}).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Onboarding completed successfully!'
            });
            this.isSigning.set(false);
            
            // Emit completion event to parent component
            this.stepComplete.emit();
          },
          error: (error: any) => {
            console.error('Error completing onboarding:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to complete onboarding. Please try again.'
            });
            this.isSigning.set(false);
          }
        });
      },
      error: (error: any) => {
        console.error('Error saving signature:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save signature. Please try again.'
        });
        this.isSigning.set(false);
      }
    });
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  loadExistingSignature() {
    const url = this.memberId() 
      ? `${this.apiUrl}/api/Member/Member_GetSignatureForMember?memberId=${this.memberId()}`
      : `${this.apiUrl}/api/Member/Member_GetMySignature`;
    
    this.http.get<{ signatureDataUrl: string | null }>(url).subscribe({
      next: (response) => {
        if (response.signatureDataUrl) {
          this.signatureDataUrl.set(response.signatureDataUrl);
          this.drawSignatureOnCanvas(response.signatureDataUrl);
        }
      },
      error: (error: any) => {
        console.error('Error loading signature:', error);
      }
    });
  }

  drawSignatureOnCanvas(dataUrl: string) {
    if (!this.canvas || !this.ctx) return;
    
    const img = new Image();
    img.onload = () => {
      this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.ctx!.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
    };
    img.src = dataUrl;
  }
}
