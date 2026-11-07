import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, UserDto } from '../../../core/services/admin.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DepartmentDto } from '../../../core/models/catalog.models';
import { ROLE_CODES } from '../../../core/models/auth.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <h2>User administration</h2>

      <div class="card">
        <h3>Users</h3>
        <table class="data">
          <thead><tr><th>Employee #</th><th>Name</th><th>Email</th><th>Department</th><th>Active</th></tr></thead>
          <tbody>
            @for (u of users; track u.id) {
              <tr [class]="u.id === selectedUserId ? 'selected-row' : ''" style="cursor:pointer" (click)="select(u.id)">
                <td>{{ u.employeeNo }}</td>
                <td>{{ u.displayName }}</td>
                <td>{{ u.email }}</td>
                <td>{{ departmentName(u.departmentId) }}</td>
                <td>{{ u.isActive ? 'Yes' : 'No' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Create a new user</h3>
        <div class="form-grid">
          <div class="field"><label>Employee #</label><input type="text" [(ngModel)]="newUser.employeeNo" /></div>
          <div class="field"><label>Display name</label><input type="text" [(ngModel)]="newUser.displayName" /></div>
          <div class="field"><label>Email</label><input type="email" [(ngModel)]="newUser.email" /></div>
          <div class="field">
            <label>Department</label>
            <select [(ngModel)]="newUser.departmentId">
              @for (d of departments; track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field"><label>Temporary password</label><input type="text" [(ngModel)]="newUser.password" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!canCreate()" (click)="createUser()">Create user</button>
      </div>

      <div class="card">
        <h3>Assign a role {{ selectedUserId ? '(user #' + selectedUserId + ')' : '' }}</h3>
        <p style="color:var(--color-muted)">Click a user above first, or type their id directly.</p>
        <div class="form-grid">
          <div class="field"><label>User id</label><input type="number" min="1" [(ngModel)]="selectedUserId" /></div>
          <div class="field">
            <label>Role</label>
            <select [(ngModel)]="roleAssignment.roleCode">
              @for (r of roleCodes; track r) { <option [value]="r">{{ r }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Department (required for HOD, optional otherwise)</label>
            <select [(ngModel)]="roleAssignment.departmentId">
              <option [ngValue]="null">-</option>
              @for (d of departments; track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!selectedUserId" (click)="assignRole()">Assign role</button>

        <h4 style="margin-top:16px">Grant extra department access (for multi-department requestors/approvers)</h4>
        <div class="form-grid">
          <div class="field">
            <label>Department</label>
            <select [(ngModel)]="accessDepartmentId">
              @for (d of departments; track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-secondary" [disabled]="!selectedUserId || !accessDepartmentId" (click)="grantAccess()">Grant access</button>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  users: UserDto[] = [];
  departments: DepartmentDto[] = [];
  roleCodes = ROLE_CODES;

  newUser = { employeeNo: '', displayName: '', email: '', departmentId: null as number | null, password: '' };
  selectedUserId: number | null = null;
  roleAssignment = { roleCode: ROLE_CODES[0] as string, departmentId: null as number | null };
  accessDepartmentId: number | null = null;

  constructor(private admin: AdminService, private catalog: CatalogService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
    this.catalog.departments().subscribe((d) => (this.departments = d));
  }

  load(): void {
    this.admin.users().subscribe((u) => (this.users = u));
  }

  departmentName(id: number): string {
    return this.departments.find((d) => d.id === id)?.name ?? String(id);
  }

  select(id: number): void {
    this.selectedUserId = id;
  }

  canCreate(): boolean {
    return !!(this.newUser.employeeNo.trim() && this.newUser.displayName.trim() && this.newUser.email.trim() && this.newUser.departmentId && this.newUser.password.trim());
  }

  createUser(): void {
    if (!this.canCreate()) return;
    this.admin
      .createUser(this.newUser.employeeNo.trim(), this.newUser.displayName.trim(), this.newUser.email.trim(), this.newUser.departmentId!, this.newUser.password.trim())
      .subscribe((id) => {
        this.toast.success(`User #${id} created.`);
        this.newUser = { employeeNo: '', displayName: '', email: '', departmentId: null, password: '' };
        this.load();
      });
  }

  assignRole(): void {
    if (!this.selectedUserId) return;
    this.admin.assignRole(this.selectedUserId, this.roleAssignment.roleCode, this.roleAssignment.departmentId).subscribe(() => {
      this.toast.success('Role assigned.');
    });
  }

  grantAccess(): void {
    if (!this.selectedUserId || !this.accessDepartmentId) return;
    this.admin.grantDepartmentAccess(this.selectedUserId, this.accessDepartmentId).subscribe(() => {
      this.toast.success('Department access granted.');
      this.accessDepartmentId = null;
    });
  }
}
