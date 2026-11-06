import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastHostComponent } from '../toast-host/toast-host.component';
import { ModalHostComponent } from '../modal-host/modal-host.component';

interface AreaLink {
  role: string;
  label: string;
  path: string;
}

const AREA_LINKS: AreaLink[] = [
  { role: 'REQUESTOR', label: 'Requestor', path: '/requestor' },
  { role: 'HOD', label: 'HOD', path: '/hod' },
  { role: 'PROCUREMENT', label: 'Procurement', path: '/procurement' },
  { role: 'FINANCE', label: 'Finance', path: '/finance' },
  { role: 'AUDIT', label: 'Audit', path: '/audit' },
  { role: 'OPD', label: 'OPD', path: '/opd' },
  { role: 'SYSADMIN', label: 'Admin', path: '/admin' },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHostComponent, ModalHostComponent],
  template: `
    <div class="shell">
      <header class="topbar">
        <div class="brand">Procurement System</div>
        <nav class="area-nav">
          @for (area of visibleAreas(); track area.path) {
            <a [routerLink]="area.path" routerLinkActive="active">{{ area.label }}</a>
          }
        </nav>
        <div class="user-info">
          <span class="user-name">{{ auth.displayName() }}</span>
          <button type="button" class="btn btn-secondary btn-sm" (click)="logout()">Log out</button>
        </div>
      </header>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-toast-host></app-toast-host>
    <app-modal-host></app-modal-host>
  `,
  styles: [
    `
      .shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      .topbar {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 0 24px;
        height: 56px;
        background: #163f5c;
        color: #fff;
      }
      .brand {
        font-weight: 700;
        white-space: nowrap;
      }
      .area-nav {
        display: flex;
        gap: 4px;
        flex: 1;
        overflow-x: auto;
      }
      .area-nav a {
        color: #cfe0ec;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        white-space: nowrap;
      }
      .area-nav a:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      .area-nav a.active {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        font-weight: 600;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
      }
      .user-name {
        font-size: 14px;
      }
      .content {
        flex: 1;
      }
    `,
  ],
})
export class LayoutComponent {
  constructor(public auth: AuthService, private router: Router) {}

  visibleAreas(): AreaLink[] {
    const roles = this.auth.roleCodes();
    return AREA_LINKS.filter((a) => roles.includes(a.role));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
