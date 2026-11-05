import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Department, Role, UserSummary } from '../../../core/models';

@Component({
  selector: 'app-users-tab',
  template: `
    <div class="layout">
      <mat-card class="list-card">
        <table mat-table [dataSource]="users" class="full-width-table">
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let u">{{ u.displayName }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let u">{{ u.email }}</td></ng-container>
          <ng-container matColumnDef="department"><th mat-header-cell *matHeaderCellDef>Department</th><td mat-cell *matCellDef="let u">{{ u.departmentName }}</td></ng-container>
          <ng-container matColumnDef="roles"><th mat-header-cell *matHeaderCellDef>Roles</th><td mat-cell *matCellDef="let u">{{ u.roleCodes.join(', ') }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['name','email','department','roles']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['name','email','department','roles']"></tr>
        </table>
      </mat-card>

      <mat-card class="form-card">
        <h4>New user</h4>
        <form [formGroup]="form" (ngSubmit)="create()">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Employee no.</mat-label><input matInput formControlName="employeeNo" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Display name</mat-label><input matInput formControlName="displayName" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Department</mat-label>
            <mat-select formControlName="departmentId"><mat-option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Role</mat-label>
            <mat-select formControlName="roleCode"><mat-option *ngFor="let r of roles" [value]="r.code">{{ r.name }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" *ngIf="form.value.roleCode === 'HOD'">
            <mat-label>HOD of department</mat-label>
            <mat-select formControlName="roleDepartmentId"><mat-option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</mat-option></mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Add user</button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .list-card, .form-card { padding: 16px; }
    .full-width-table, .full-width { width: 100%; }
    h4 { margin: 0 0 12px; }
  `],
})
export class UsersTabComponent implements OnInit {
  users: UserSummary[] = [];
  departments: Department[] = [];
  roles: Role[] = [];
  form = this.fb.group({
    employeeNo: ['', Validators.required],
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    departmentId: [null, Validators.required],
    roleCode: ['', Validators.required],
    roleDepartmentId: [null as number | null],
  });

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
    this.adminService.listDepartments().subscribe((departments) => (this.departments = departments));
    this.adminService.listRoles().subscribe((roles) => (this.roles = roles));
  }

  load(): void {
    this.adminService.listUsers().subscribe((users) => (this.users = users));
  }

  create(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.adminService
      .createUser(v.employeeNo!, v.displayName!, v.email!, v.departmentId!, v.password!, v.roleCode!, v.roleDepartmentId)
      .subscribe(() => {
        this.form.reset();
        this.load();
      });
  }
}
