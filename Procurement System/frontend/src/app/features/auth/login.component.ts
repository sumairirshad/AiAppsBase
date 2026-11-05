import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-shell">
      <mat-card class="login-card">
        <div class="brand">
          <mat-icon class="brand-icon">inventory_2</mat-icon>
          <h1>Procurement System</h1>
          <p class="subtitle">Sign in to continue</p>
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
          </mat-form-field>
          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
          <button mat-raised-button color="primary" class="full-width submit-btn" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="hint">Dev seed accounts use password <code>Passw0rd!</code> (e.g. requestor.it&#64;procurement.local).</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1f5f8b 0%, #123a54 100%);
      padding: 16px;
    }
    .login-card { width: 100%; max-width: 380px; padding: 32px 28px; }
    .brand { text-align: center; margin-bottom: 24px; }
    .brand-icon { font-size: 40px; width: 40px; height: 40px; color: #1f5f8b; }
    .brand h1 { font-size: 20px; margin: 8px 0 2px; }
    .subtitle { color: rgba(0, 0, 0, 0.55); margin: 0; font-size: 13px; }
    .full-width { width: 100%; }
    .submit-btn { height: 44px; margin-top: 8px; }
    .error { color: #b3261e; font-size: 13px; margin: -4px 0 8px; }
    .hint { font-size: 11px; color: rgba(0, 0, 0, 0.45); text-align: center; margin-top: 18px; }
  `],
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = null;
    const { email, password } = this.form.getRawValue();

    this.auth.login(email!, password!).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Invalid email or password.';
      },
    });
  }
}
