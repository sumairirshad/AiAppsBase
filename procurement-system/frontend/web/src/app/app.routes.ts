import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home-redirect.component').then((m) => m.HomeRedirectComponent),
      },
      {
        path: 'requestor',
        canActivate: [roleGuard('REQUESTOR')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/requestor/dashboard/dashboard.component').then((m) => m.RequestorDashboardComponent) },
          { path: 'my-requests', loadComponent: () => import('./features/requestor/my-requests/my-requests.component').then((m) => m.MyRequestsComponent) },
          { path: 'raise-pr', loadComponent: () => import('./features/requestor/raise-pr/raise-pr.component').then((m) => m.RaisePrComponent) },
          { path: 'vendor-registration', loadComponent: () => import('./features/requestor/vendor-registration/vendor-registration.component').then((m) => m.VendorRegistrationComponent) },
          { path: 'acknowledge/:id', loadComponent: () => import('./features/requestor/acknowledge/acknowledge.component').then((m) => m.AcknowledgeComponent) },
          { path: 'upload-bill/:id', loadComponent: () => import('./features/requestor/upload-bill/upload-bill.component').then((m) => m.UploadBillComponent) },
          { path: 'pr/:id', loadComponent: () => import('./features/requestor/pr-detail/pr-detail.component').then((m) => m.RequestorPrDetailComponent) },
        ],
      },
      {
        path: 'hod',
        canActivate: [roleGuard('HOD')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/hod/dashboard/dashboard.component').then((m) => m.HodDashboardComponent) },
          { path: 'pr/:id', loadComponent: () => import('./features/hod/pr-detail/pr-detail.component').then((m) => m.HodPrDetailComponent) },
          { path: 'vendor-decisions/:id', loadComponent: () => import('./features/hod/vendor-decisions/vendor-decisions.component').then((m) => m.HodVendorDecisionComponent) },
        ],
      },
      {
        path: 'procurement',
        canActivate: [roleGuard('PROCUREMENT')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/procurement/dashboard/dashboard.component').then((m) => m.ProcurementDashboardComponent) },
          { path: 'pr/:id', loadComponent: () => import('./features/procurement/pr-workbench/pr-workbench.component').then((m) => m.ProcurementPrWorkbenchComponent) },
          { path: 'vendor-decisions/:id', loadComponent: () => import('./features/procurement/vendor-decision/vendor-decision.component').then((m) => m.ProcurementVendorDecisionComponent) },
        ],
      },
      {
        path: 'finance',
        canActivate: [roleGuard('FINANCE')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/finance/dashboard/dashboard.component').then((m) => m.FinanceDashboardComponent) },
          { path: 'pr/:id', loadComponent: () => import('./features/finance/pr-detail/pr-detail.component').then((m) => m.FinancePrDetailComponent) },
        ],
      },
      {
        path: 'audit',
        canActivate: [roleGuard('AUDIT')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/audit/dashboard/dashboard.component').then((m) => m.AuditDashboardComponent) },
          { path: 'pr/:id', loadComponent: () => import('./features/audit/pr-detail/pr-detail.component').then((m) => m.AuditPrDetailComponent) },
        ],
      },
      {
        path: 'opd',
        canActivate: [roleGuard('OPD')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/opd/dashboard/dashboard.component').then((m) => m.OpdDashboardComponent) },
          { path: 'pr/:id', loadComponent: () => import('./features/opd/pr-detail/pr-detail.component').then((m) => m.OpdPrDetailComponent) },
          // Escalation hand-off: Operational stages Procurement, the Requestor or Audit own
          // (accept/quotations/PO-contract/GRN/bill-forward, acknowledge, owner-upload,
          // quote-review, audit-stamp) escalate to OPD after their EscalationDays timeout. These
          // OPD-prefixed routes reuse those roles' own screens unchanged, with route `data`
          // telling the screen it is OPD acting (so its generic actions go through as OPD, and
          // "back"/"done" return to OPD's own pages) - see features/opd/pr-detail for where these
          // are linked from, gated on the PR's own allowedActions actually showing OPD as the
          // task's escalation target.
          {
            path: 'pr/:id/workbench',
            data: { roleCode: 'OPD', backLink: '/opd/pr', backLabel: 'Back to escalated PR' },
            loadComponent: () => import('./features/procurement/pr-workbench/pr-workbench.component').then((m) => m.ProcurementPrWorkbenchComponent),
          },
          {
            path: 'pr/:id/acknowledge',
            data: { roleCode: 'OPD', backLink: '/opd/pr', backLabel: 'Back to escalated PR' },
            loadComponent: () => import('./features/requestor/acknowledge/acknowledge.component').then((m) => m.AcknowledgeComponent),
          },
          {
            path: 'pr/:id/upload-bill',
            data: { roleCode: 'OPD', backLink: '/opd/pr', backLabel: 'Back to escalated PR' },
            loadComponent: () => import('./features/requestor/upload-bill/upload-bill.component').then((m) => m.UploadBillComponent),
          },
          {
            path: 'pr/:id/audit-review',
            data: { roleCode: 'OPD', backLink: '/opd/pr', backLabel: 'Back to escalated PR' },
            loadComponent: () => import('./features/audit/pr-detail/pr-detail.component').then((m) => m.AuditPrDetailComponent),
          },
          { path: 'policy', loadComponent: () => import('./features/opd/policy/policy.component').then((m) => m.OpdPolicyComponent) },
          { path: 'catalog', loadComponent: () => import('./features/opd/catalog-admin/catalog-admin.component').then((m) => m.OpdCatalogAdminComponent) },
          { path: 'recurring', loadComponent: () => import('./features/opd/recurring/recurring.component').then((m) => m.OpdRecurringComponent) },
        ],
      },
      {
        path: 'admin',
        canActivate: [roleGuard('SYSADMIN')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          { path: 'users', loadComponent: () => import('./features/admin/users/users.component').then((m) => m.AdminUsersComponent) },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
