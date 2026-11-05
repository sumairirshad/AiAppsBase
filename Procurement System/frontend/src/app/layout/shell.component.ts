import { Component } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>inventory_2</mat-icon>
          <span>Procurement</span>
        </div>
        <mat-nav-list>
          <a mat-list-item *ngFor="let item of visibleNavItems" [routerLink]="item.route" routerLinkActive="active-link">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar class="toolbar">
          <button mat-icon-button (click)="sidenav.toggle()"><mat-icon>menu</mat-icon></button>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="notifMenu" [matBadge]="unreadCount" [matBadgeHidden]="unreadCount === 0" matBadgeColor="warn" matBadgeSize="small">
            <mat-icon>notifications</mat-icon>
          </button>
          <mat-menu #notifMenu="matMenu">
            <div class="notif-panel">
              <div *ngIf="notifications.length === 0" class="notif-empty">No notifications</div>
              <button mat-menu-item *ngFor="let n of notifications" (click)="markRead(n.id)">
                <span class="notif-message" [class.unread]="!n.isRead">{{ n.message }}</span>
              </button>
            </div>
          </mat-menu>
          <button mat-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
            {{ (auth.currentUser$ | async)?.displayName }}
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-roles">
              <span *ngFor="let r of (auth.currentUser$ | async)?.roles" class="role-pill">{{ r.roleName }}</span>
            </div>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon> Sign out
            </button>
          </mat-menu>
        </mat-toolbar>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell { height: 100vh; }
    .sidenav { width: 240px; background: #16222c; color: #e6edf1; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 18px 16px; font-weight: 600; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sidenav ::ng-deep .mat-mdc-list-item { color: #cfd9e0; }
    .sidenav ::ng-deep .mat-mdc-list-item mat-icon { color: #8fa3b0; }
    .sidenav ::ng-deep .active-link { background: rgba(255,255,255,0.08); color: #fff; }
    .sidenav ::ng-deep .active-link mat-icon { color: #7db4dc; }
    .toolbar { background: #fff; border-bottom: 1px solid #e3e7ea; color: #1c2b36; }
    .spacer { flex: 1 1 auto; }
    .content { padding: 24px 32px; background: #f6f8f9; min-height: calc(100vh - 64px); }
    .notif-panel { min-width: 280px; max-height: 360px; overflow-y: auto; }
    .notif-empty { padding: 16px; color: rgba(0,0,0,0.5); text-align: center; }
    .notif-message { white-space: normal; display: block; font-size: 13px; }
    .notif-message.unread { font-weight: 600; }
    .user-roles { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 16px; }
    .role-pill { background: #eef1f4; border-radius: 10px; padding: 2px 8px; font-size: 11px; }
  `],
})
export class ShellComponent {
  navItems: NavItem[] = [
    { label: 'Home', icon: 'space_dashboard', route: '/home' },
    { label: 'New Requisition', icon: 'add_circle', route: '/requisitions/new' },
    { label: 'My Requisitions', icon: 'description', route: '/requisitions/mine' },
    { label: 'Approvals Inbox', icon: 'inbox', route: '/requisitions/inbox' },
    { label: 'Vendors', icon: 'storefront', route: '/vendors' },
    { label: 'Admin', icon: 'admin_panel_settings', route: '/admin', roles: ['OPD', 'SYSADMIN'] },
  ];

  notifications: { id: number; message: string; isRead: boolean }[] = [];
  unreadCount = 0;

  constructor(public auth: AuthService, private notificationService: NotificationService, private router: Router) {
    this.loadNotifications();
  }

  get visibleNavItems(): NavItem[] {
    const roles = this.auth.currentUser?.roles.map((r) => r.roleCode) ?? [];
    return this.navItems.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r)));
  }

  loadNotifications(): void {
    this.notificationService.list().subscribe((items) => {
      this.notifications = items;
      this.unreadCount = items.filter((i) => !i.isRead).length;
    });
  }

  markRead(id: number): void {
    this.notificationService.markRead(id).subscribe(() => this.loadNotifications());
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
