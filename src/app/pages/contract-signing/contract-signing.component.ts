import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { 
  OnboardingContractServiceProxy, 
  GenerateContractRequest, 
  SignContractRequest, 
  ContractGenerationResult 
} from '../../core/services/service-proxies';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-6 max-w-6xl">
      <h2 class="text-2xl font-bold mb-6">Sign Onboarding Contract</h2>

      <!-- ECTA Compliance Notice -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 class="font-semibold text-blue-900 mb-2">
          <i class="bi bi-info-circle me-2"></i>Electronic Signature Agreement
        </h3>
        <p class="text-sm text-blue-800">
          By signing this document electronically, you agree that:
        </p>
        <ul class="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
          <li>This electronic signature has the same legal effect as a handwritten signature</li>
          <li>You consent to conduct this transaction electronically</li>
          <li>You have reviewed the document in full</li>
          <li>Your signature is made voluntarily and with full understanding</li>
        </ul>
        <p class="text-xs text-blue-700 mt-3">
          As per the Electronic Communications and Transactions Act, 2002 (ECTA), this electronic signature is legally binding.
        </p>
      </div>

      <!-- Steps Indicator -->
      <div class="flex justify-between mb-8">
        <div [class]="currentStep >= 1 ? 'step-active' : 'step-inactive'" class="step">
          <div class="step-circle">1</div>
          <div class="step-label">Generate Contract</div>
        </div>
        <div [class]="currentStep >= 2 ? 'step-active' : 'step-inactive'" class="step">
          <div class="step-circle">2</div>
          <div class="step-label">Review Document</div>
        </div>
        <div [class]="currentStep >= 3 ? 'step-active' : 'step-inactive'" class="step">
          <div class="step-circle">3</div>
          <div class="step-label">Sign</div>
        </div>
        <div [class]="currentStep >= 4 ? 'step-active' : 'step-inactive'" class="step">
          <div class="step-circle">4</div>
          <div class="step-label">Complete</div>
        </div>
      </div>

      <!-- Step 1: Generate -->
      <div *ngIf="currentStep === 1" class="card">
        <h3 class="text-lg font-semibold mb-4">Generate Your Contract</h3>
        <p class="text-gray-600 mb-4">
          Click below to generate your onboarding contract with all the information you've provided.
        </p>
        <button (click)="generateContract()" 
                [disabled]="generating"
                class="btn btn-primary">
          <span *ngIf="generating" class="spinner-border spinner-border-sm me-2"></span>
          {{ generating ? 'Generating...' : 'Generate Contract' }}
        </button>
      </div>

      <!-- Step 2: Review PDF -->
      <div *ngIf="currentStep === 2" class="card">
        <h3 class="text-lg font-semibold mb-4">Review Your Contract</h3>
        <p class="text-gray-600 mb-4">
          Please review the contract carefully before signing. Use the checkbox below to confirm.
        </p>

        <!-- PDF Viewer -->
        <div class="pdf-container mb-4">
          <iframe [src]="sanitizedPdfUrl" 
                  frameborder="0" 
                  class="w-full"
                  style="height: 600px;">
          </iframe>
        </div>

        <div class="form-check mb-4">
          <input type="checkbox" 
                 [(ngModel)]="hasReviewedDocument" 
                 id="confirmReview"
                 class="form-check-input">
          <label for="confirmReview" class="form-check-label">
            I have read and understood the terms of this contract
          </label>
        </div>

        <div class="flex gap-3">
          <button (click)="currentStep = 1" class="btn btn-secondary">
            Back
          </button>
          <button (click)="currentStep = 3" 
                  [disabled]="!hasReviewedDocument"
                  class="btn btn-primary">
            Proceed to Sign
          </button>
        </div>
      </div>

      <!-- Step 3: Sign -->
      <div *ngIf="currentStep === 3" class="card">
        <h3 class="text-lg font-semibold mb-4">Sign the Contract</h3>
        <p class="text-gray-600 mb-4">
          Draw your signature in the box below using your mouse or touch screen.
        </p>

        <!-- Signature Canvas -->
        <div class="signature-container mb-4">
          <canvas #signatureCanvas 
                  (mousedown)="startDrawing($event)"
                  (mousemove)="draw($event)"
                  (mouseup)="stopDrawing()"
                  (mouseleave)="stopDrawing()"
                  (touchstart)="handleTouchStart($event)"
                  (touchmove)="handleTouchMove($event)"
                  (touchend)="stopDrawing()"
                  width="700" 
                  height="200" 
                  class="signature-canvas">
          </canvas>
        </div>

        <div class="flex gap-3 mb-4">
          <button (click)="clearSignature()" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-counterclockwise me-2"></i>Clear
          </button>
        </div>

        <!-- Consent Checkbox -->
        <div class="form-check mb-4">
          <input type="checkbox" 
                 [(ngModel)]="consentGiven" 
                 id="confirmConsent"
                 class="form-check-input">
          <label for="confirmConsent" class="form-check-label">
            I consent to sign this document electronically and understand that it is legally binding
          </label>
        </div>

        <div class="flex gap-3">
          <button (click)="currentStep = 2" class="btn btn-secondary">
            Back
          </button>
          <button (click)="signContract()" 
                  [disabled]="!consentGiven || !hasSignature() || signing"
                  class="btn btn-success">
            <span *ngIf="signing" class="spinner-border spinner-border-sm me-2"></span>
            <i class="bi bi-pen me-2" *ngIf="!signing"></i>
            {{ signing ? 'Signing...' : 'Sign Contract' }}
          </button>
        </div>
      </div>

      <!-- Step 4: Complete -->
      <div *ngIf="currentStep === 4" class="card text-center">
        <div class="mb-4">
          <i class="bi bi-check-circle text-success" style="font-size: 4rem;"></i>
        </div>
        <h3 class="text-2xl font-bold mb-2">Contract Signed Successfully!</h3>
        <p class="text-gray-600 mb-4">
          Your onboarding contract has been signed and is legally binding.
        </p>
        <p class="text-sm text-gray-500 mb-6">
          Signed on: {{ signedAt | date:'full' }}<br>
          From IP: {{ ipAddress }}
        </p>
        <div class="flex gap-3 justify-center">
          <button (click)="downloadContract()" class="btn btn-primary">
            <i class="bi bi-download me-2"></i>Download Contract
          </button>
          <button (click)="navigateToProfile()" class="btn btn-outline-primary">
            Return to Profile
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="alert alert-danger mt-4">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .step {
      flex: 1;
      text-align: center;
      position: relative;
    }

    .step-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-weight: 600;
    }

    .step-active .step-circle {
      background: #3b82f6;
      color: white;
    }

    .step-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .step-active .step-label {
      color: #3b82f6;
      font-weight: 600;
    }

    .card {
      background: white;
      border-radius: 0.5rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .signature-canvas {
      border: 2px solid #d1d5db;
      border-radius: 0.5rem;
      cursor: crosshair;
      background: #f9fafb;
      display: block;
      width: 100%;
    }

    .signature-container {
      background: white;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .pdf-container {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }
  `]
})
export class ContractSigningComponent implements OnInit {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  currentStep = 1;
  memberId!: string;
  contractId?: string;
  pdfUrl?: string;
  sanitizedPdfUrl?: SafeResourceUrl;
  
  generating = false;
  signing = false;
  hasReviewedDocument = false;
  consentGiven = false;
  
  errorMessage = '';
  signedAt?: Date;
  ipAddress = '';

  // Signature drawing
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: OnboardingContractServiceProxy,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.memberId = this.route.snapshot.paramMap.get('memberId') || '';
    if (!this.memberId) {
      this.errorMessage = 'Member ID not found';
    }
  }

  async generateContract(): Promise<void> {
    this.generating = true;
    this.errorMessage = '';

    try {
      const request = new GenerateContractRequest({ memberId: this.memberId });
      const result = await this.contractService.generate(request).toPromise();

      if (result) {
        this.contractId = result.contractId!;
        this.pdfUrl = `${environment.apiUrl}${result.pdfUrl}`;
        this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
        this.currentStep = 2;
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to generate contract';
    } finally {
      this.generating = false;
    }
  }

  initializeCanvas(): void {
    if (this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  ngAfterViewInit(): void {
    if (this.currentStep === 3) {
      this.initializeCanvas();
    }
  }

  ngAfterViewChecked(): void {
    if (this.currentStep === 3 && this.canvasRef && !this.ctx) {
      this.initializeCanvas();
    }
  }

  startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isDrawing = true;
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  handleTouchMove(event: TouchEvent): void {
    if (!this.isDrawing) return;
    event.preventDefault();

    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clearSignature(): void {
    if (this.ctx && this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  hasSignature(): boolean {
    if (!this.canvasRef) return false;
    const canvas = this.canvasRef.nativeElement;
    const pixelData = this.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    // Check if any non-transparent pixels exist
    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] !== 0) return true;
    }
    return false;
  }

  async signContract(): Promise<void> {
    if (!this.contractId || !this.hasSignature()) {
      return;
    }

    this.signing = true;
    this.errorMessage = '';

    try {
      const signatureDataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
      
      const request = new SignContractRequest({
        contractId: this.contractId,
        signatureBase64: signatureDataUrl,
        ipAddress: '', // Will be set by backend
        userAgent: navigator.userAgent,
        geoLocation: undefined,
        signatureX: 50,
        signatureY: 50,
        signatureWidth: 200,
        signatureHeight: 50
      });

      const response = await this.contractService.sign(request).toPromise();

      if (response) {
        this.signedAt = response.signedAt ? new Date(response.signedAt.toString()) : new Date();
        this.ipAddress = response.ipAddress || '';
        this.currentStep = 4;
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to sign contract';
    } finally {
      this.signing = false;
    }
  }

  async downloadContract(): Promise<void> {
    if (!this.contractId) return;

    try {
      // Use direct HttpClient for blob download as proxy doesn't expose blob properly
      const url = `${environment.apiUrl}/OnboardingContract/${this.contractId}/download`;
      const blob = await this.contractService['http'].get(url, { responseType: 'blob' }).toPromise();

      if (blob) {
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `Contract_${this.memberId}_${new Date().getTime()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      this.errorMessage = 'Failed to download contract';
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/member/profile']);
  }
}
