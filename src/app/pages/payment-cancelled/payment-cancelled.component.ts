import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-cancelled',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <!-- Cancelled Card -->
          <div class="card shadow-lg border-0">
            <div class="card-body text-center p-5">
              <!-- Error Icon -->
              <div class="mb-4">
                <div class="error-icon">
                  <i class="bi bi-x-circle text-danger"></i>
                </div>
              </div>

              <!-- Cancelled Message -->
              <h1 class="text-danger mb-3">Payment {{ isFailed ? 'Failed' : 'Cancelled' }}</h1>
              <p class="lead text-muted mb-4">
                {{ isFailed 
                  ? 'Your payment could not be processed. Please try again or contact support if the problem persists.' 
                  : 'Your payment has been cancelled. No charges have been made to your account.' 
                }}
              </p>

              <!-- Error Details -->
              <div class="card bg-light border-0 mb-4" *ngIf="errorMessage || reference">
                <div class="card-body">
                  <h6 class="text-uppercase text-muted small mb-3">Details</h6>
                  <div class="text-start">
                    <div class="mb-2" *ngIf="reference">
                      <small class="text-muted d-block">Reference</small>
                      <strong class="font-monospace">{{ reference }}</strong>
                    </div>
                    <div class="mb-2" *ngIf="errorMessage">
                      <small class="text-muted d-block">Reason</small>
                      <strong>{{ errorMessage }}</strong>
                    </div>
                    <div>
                      <small class="text-muted d-block">Date & Time</small>
                      <strong>{{ currentDate | date:'short' }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Common Reasons -->
              <div class="alert alert-warning mb-4" role="alert">
                <h6 class="alert-heading">
                  <i class="bi bi-exclamation-triangle me-2"></i>Common Reasons for Payment Issues
                </h6>
                <ul class="text-start small mb-0 mt-2">
                  <li>Insufficient funds in your account</li>
                  <li>Incorrect card or banking details</li>
                  <li>Card expired or blocked</li>
                  <li>Transaction limit exceeded</li>
                  <li>Network or connection issues</li>
                </ul>
              </div>

              <!-- Action Buttons -->
              <div class="d-grid gap-2">
                <button class="btn btn-primary btn-lg" (click)="retryPayment()">
                  <i class="bi bi-arrow-clockwise me-2"></i>Try Again
                </button>
                <button class="btn btn-outline-secondary" (click)="goToDashboard()">
                  <i class="bi bi-house-door me-2"></i>Return to Dashboard
                </button>
                <button class="btn btn-outline-info" (click)="contactSupport()">
                  <i class="bi bi-headset me-2"></i>Contact Support
                </button>
              </div>

              <!-- Alternative Payment Methods -->
              <div class="mt-4 pt-4 border-top">
                <p class="text-muted small mb-2">
                  <i class="bi bi-lightbulb me-1"></i>
                  <strong>Need another payment option?</strong>
                </p>
                <p class="text-muted small">
                  We accept multiple payment methods including credit cards, debit cards, 
                  and instant EFT. Visit your profile settings to manage payment methods.
                </p>
              </div>
            </div>
          </div>

          <!-- Support Section -->
          <div class="text-center mt-4">
            <p class="text-muted small">
              <i class="bi bi-shield-check me-1"></i>
              Your security is important to us. All transactions are encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-icon {
      font-size: 80px;
      animation: shake 0.5s;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
      20%, 40%, 60%, 80% { transform: translateX(10px); }
    }

    @media print {
      .btn, .alert, .border-top { display: none !important; }
    }
  `]
})
export class PaymentCancelledComponent implements OnInit {
  reference: string | null = null;
  errorMessage: string | null = null;
  isFailed = false;
  currentDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get query parameters from URL
    this.route.queryParams.subscribe(params => {
      this.reference = params['reference'] || params['transactionId'] || params['transaction_id'];
      this.errorMessage = params['error'] || params['errorMessage'] || params['message'];
      this.isFailed = params['status'] === 'failed' || params['failed'] === 'true';
    });
  }

  retryPayment(): void {
    // Navigate back to payment page or last attempted payment
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/payments']);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  contactSupport(): void {
    this.router.navigate(['/contact'], {
      queryParams: {
        subject: 'Payment Issue',
        reference: this.reference
      }
    });
  }
}
