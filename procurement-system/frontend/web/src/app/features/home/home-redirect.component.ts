import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

const AREA_BY_ROLE: Record<string, string> = {
  REQUESTOR: '/requestor',
  HOD: '/hod',
  PROCUREMENT: '/procurement',
  FINANCE: '/finance',
  AUDIT: '/audit',
  OPD: '/opd',
  SYSADMIN: '/admin',
};

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: `<p class="page">Loading...</p>`,
})
export class HomeRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const roles = this.auth.roleCodes();
    const target = roles.map((r) => AREA_BY_ROLE[r]).find(Boolean) ?? '/login';
    this.router.navigate([target]);
  }
}
