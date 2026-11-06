import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';

const DEMO_ACCOUNTS = [
  { label: 'Requestor', email: 'requestor@procurement.local' },
  { label: 'HOD (IT)', email: 'hod.it@procurement.local' },
  { label: 'Procurement HOD', email: 'hod.procurement@procurement.local' },
  { label: 'Procurement', email: 'procurement@procurement.local' },
  { label: 'Finance', email: 'finance@procurement.local' },
  { label: 'Audit', email: 'audit@procurement.local' },
  { label: 'OPD', email: 'opd@procurement.local' },
  { label: 'System Administrator', email: 'sysadmin@procurement.local' },
];
const DEMO_PASSWORD = 'Passw0rd!1';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Procurement System</h1>
        <p class="sub">Sign in to continue</p>

        <form (ngSubmit)="submit()">
          <div class="field">
            <label>Email</label>
            <input type="email" name="email" [(ngModel)]="email" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" name="password" [(ngModel)]="password" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <button type="button" class="demo-toggle" (click)="showDemo = !showDemo">
          {{ showDemo ? 'Hide' : 'Show' }} demo accounts
        </button>
        @if (showDemo) {
          <ul class="demo-list">
            @for (account of demoAccounts; track account.email) {
              <li><button type="button" (click)="fillDemo(account.email)">{{ account.label }} - {{ account.email }}</button></li>
            }
          </ul>
          <p class="demo-password">Password for every demo account: <code>{{ demoPassword }}</code></p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #163f5c, #1f5f8b);
      }
      .login-card {
        background: #fff;
        border-radius: 10px;
        padding: 32px;
        width: 380px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      }
      h1 {
        font-size: 22px;
        margin: 0 0 4px;
      }
      .sub {
        color: #6b7280;
        margin: 0 0 20px;
        font-size: 14px;
      }
      .demo-toggle {
        margin-top: 16px;
        background: none;
        border: none;
        color: #1f5f8b;
        font-size: 13px;
        cursor: pointer;
        padding: 0;
      }
      .demo-list {
        list-style: none;
        padding: 0;
        margin: 10px 0 0;
        font-size: 13px;
        max-height: 200px;
        overflow-y: auto;
      }
      .demo-list li button {
        background: none;
        border: none;
        text-align: left;
        width: 100%;
        padding: 4px 0;
        cursor: pointer;
        color: #374151;
      }
      .demo-list li button:hover {
        color: #1f5f8b;
      }
      .demo-password {
        font-size: 12px;
        color: #6b7280;
        margin-top: 8px;
      }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  showDemo = false;
  demoAccounts = DEMO_ACCOUNTS;
  demoPassword = DEMO_PASSWORD;

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {}

  fillDemo(email: string): void {
    this.email = email;
    this.password = DEMO_PASSWORD;
    this.showDemo = false;
  }

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: () => {
        this.loading = false;
        this.toast.error('Invalid email or password.');
      },
    });
  }
}
