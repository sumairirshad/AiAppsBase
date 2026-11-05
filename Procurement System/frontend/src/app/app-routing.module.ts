import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { ShellComponent } from './layout/shell.component';
import { HomeComponent } from './features/dashboard/home.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'requisitions', loadChildren: () => import('./features/requisitions/requisitions.module').then((m) => m.RequisitionsModule) },
      { path: 'vendors', loadChildren: () => import('./features/vendors/vendors.module').then((m) => m.VendorsModule) },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
        canActivate: [RoleGuard],
        data: { roles: ['OPD', 'SYSADMIN'] },
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
