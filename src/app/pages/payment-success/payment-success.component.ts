import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <!-- Success Card -->
          <div class="card shadow-lg border-0">
            <div class="card-body text-center p-5">
              <!-- Success Icon -->
              <div class="mb-4">
                <div class="success-checkmark">
                  <div class="check-icon">
                    <span class="icon-line line-tip"></span>
                    <span class="icon-line line-long"></span>
                    <div class="icon-circle"></div>
                    <div class="icon-fix"></div>
                  </div>
                </div>
              </div>

              <!-- Success Message -->
              <h1 class="text-success mb-3">Payment Successful!</h1>
              <p class="lead text-muted mb-4">
                Thank you for your payment. Your transaction has been completed successfully.
              </p>

              <!-- Transaction Details -->
              <div class="card bg-light border-0 mb-4" *ngIf="transactionId || amount">
                <div class="card-body">
                  <h6 class="text-uppercase text-muted small mb-3">Transaction Details</h6>
                  <div class="row g-3 text-start">
                    <div class="col-6" *ngIf="transactionId">
                      <small class="text-muted d-block">Transaction ID</small>
                      <strong class="font-monospace">{{ transactionId }}</strong>
                    </div>
                    <div class="col-6" *ngIf="amount">
                      <small class="text-muted d-block">Amount</small>
                      <strong>{{ amount | currency:'ZAR':'symbol':'1.2-2' }}</strong>
                    </div>
                    <div class="col-6" *ngIf="paymentMethod">
                      <small class="text-muted d-block">Payment Method</small>
                      <strong>{{ paymentMethod }}</strong>
                    </div>
                    <div class="col-6">
                      <small class="text-muted d-block">Date & Time</small>
                      <strong>{{ currentDate | date:'short' }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- What's Next -->
              <div class="alert alert-info mb-4" role="alert">
                <i class="bi bi-info-circle-fill me-2"></i>
                <strong>What's next?</strong>
                <p class="mb-0 small mt-2">
                  Your account has been created successfully! Please log in with your credentials to access your dashboard.
                  A confirmation email will be sent once your account is fully configured.
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                <button class="btn btn-primary btn-lg" (click)="goToDashboard()">
                  <i class="bi bi-box-arrow-in-right me-2"></i>Go to Login
                </button>
                <button class="btn btn-outline-secondary btn-lg" (click)="viewTransactions()">
                  <i class="bi bi-receipt me-2"></i>View Transactions
                </button>
              </div>

              <!-- Print Receipt -->
              <div class="mt-4">
                <button class="btn btn-link text-muted" (click)="printReceipt()">
                  <i class="bi bi-printer me-1"></i>Print Receipt
                </button>
              </div>
            </div>
          </div>

          <!-- Support Section -->
          <div class="text-center mt-4">
            <p class="text-muted small">
              <i class="bi bi-headset me-1"></i>
              Need help? <a href="/contact" class="text-decoration-none">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Success Checkmark Animation */
    .success-checkmark {
      width: 80px;
      height: 80px;
      margin: 0 auto;
    }

    .check-icon {
      width: 80px;
      height: 80px;
      position: relative;
      border-radius: 50%;
      box-sizing: content-box;
      border: 4px solid #198754;
    }

    .check-icon::before {
      top: 3px;
      left: -2px;
      width: 30px;
      transform-origin: 100% 50%;
      border-radius: 100px 0 0 100px;
    }

    .check-icon::after {
      top: 0;
      left: 30px;
      width: 60px;
      transform-origin: 0 50%;
      border-radius: 0 100px 100px 0;
      animation: rotate-circle 4.25s ease-in;
    }

    .icon-line {
      height: 5px;
      background-color: #198754;
      display: block;
      border-radius: 2px;
      position: absolute;
      z-index: 10;
    }

    .icon-line.line-tip {
      top: 46px;
      left: 14px;
      width: 25px;
      transform: rotate(45deg);
      animation: icon-line-tip 0.75s;
    }

    .icon-line.line-long {
      top: 38px;
      right: 8px;
      width: 47px;
      transform: rotate(-45deg);
      animation: icon-line-long 0.75s;
    }

    .icon-circle {
      top: -4px;
      left: -4px;
      z-index: 10;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      position: absolute;
      box-sizing: content-box;
      border: 4px solid rgba(25, 135, 84, 0.5);
    }

    .icon-fix {
      top: 8px;
      width: 5px;
      left: 26px;
      z-index: 1;
      height: 85px;
      position: absolute;
      transform: rotate(-45deg);
      background-color: #fff;
    }

    @keyframes icon-line-tip {
      0% {
        width: 0;
        left: 1px;
        top: 19px;
      }
      54% {
        width: 0;
        left: 1px;
        top: 19px;
      }
      70% {
        width: 50px;
        left: -8px;
        top: 37px;
      }
      84% {
        width: 17px;
        left: 21px;
        top: 48px;
      }
      100% {
        width: 25px;
        left: 14px;
        top: 45px;
      }
    }

    @keyframes icon-line-long {
      0% {
        width: 0;
        right: 46px;
        top: 54px;
      }
      65% {
        width: 0;
        right: 46px;
        top: 54px;
      }
      84% {
        width: 55px;
        right: 0px;
        top: 35px;
      }
      100% {
        width: 47px;
        right: 8px;
        top: 38px;
      }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  transactionId: string | null = null;
  amount: number | null = null;
  paymentMethod: string | null = null;
  currentDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get query parameters from URL (payment gateway redirects with these)
    this.route.queryParams.subscribe(params => {
      this.transactionId = params['transactionId'] || params['transaction_id'] || params['reference'];
      this.amount = params['amount'] ? parseFloat(params['amount']) : null;
      this.paymentMethod = params['paymentMethod'] || params['payment_method'] || 'Online Payment';
    });
  }

  goToDashboard(): void {
    // After registration payment, redirect to tenant-specific login page
    const subdomain = this.route.snapshot.queryParams['subdomain'];
    const email = this.route.snapshot.queryParams['email'];
    
    if (subdomain) {
      // Redirect to tenant subdomain login (e.g., riverside.mizo.co.za/auth/login)
      const protocol = window.location.protocol;
      const tenantLoginUrl = `${protocol}//${subdomain}.${environment.baseDomain}/auth/login?message=${encodeURIComponent('Registration successful! Please log in with your credentials.')}&email=${encodeURIComponent(email || '')}`;
      window.location.href = tenantLoginUrl;
    } else {
      // Fallback to regular login if subdomain not provided
      this.router.navigate(['/auth/login'], { 
        queryParams: { 
          message: 'Registration successful! Please log in with your credentials.',
          email: email
        } 
      });
    }
  }

  viewTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  printReceipt(): void {
    window.print();
  }
}
