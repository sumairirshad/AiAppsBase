import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VendorService } from '../../core/services/vendor.service';
import { AuthService } from '../../core/services/auth.service';
import { Vendor, VendorRegistrationRequest } from '../../core/models';
import { ReasonDialogComponent } from '../../shared/components/reason-dialog/reason-dialog.component';
import { RegisterVendorDialogComponent } from './register-vendor-dialog.component';

@Component({
  selector: 'app-vendors-page',
  templateUrl: './vendors-page.component.html',
  styleUrls: ['./vendors-page.component.scss'],
})
export class VendorsPageComponent implements OnInit {
  vendors: Vendor[] = [];
  registrations: VendorRegistrationRequest[] = [];
  vendorColumns = ['legalName', 'ntn', 'status', 'score', 'categories', 'action'];
  registrationColumns = ['requestNo', 'legalName', 'status', 'proposedBy', 'action'];

  constructor(private vendorService: VendorService, public auth: AuthService, private dialog: MatDialog) {}

  get isProcurement(): boolean {
    return this.auth.hasRole('PROCUREMENT');
  }

  get isProcurementHod(): boolean {
    return this.auth.hasRole('HOD') && this.auth.currentUser?.roles.some((r) => r.departmentCode === 'PROC') === true;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.vendorService.list(undefined, false).subscribe((vendors) => (this.vendors = vendors));
    this.vendorService.listRegistrations().subscribe((registrations) => (this.registrations = registrations));
  }

  register(): void {
    this.dialog
      .open(RegisterVendorDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.vendorService.register(result).subscribe(() => this.load());
      });
  }

  blacklist(vendor: Vendor): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: `Blacklist ${vendor.legalName}`, label: 'Reason', required: true, confirmText: 'Blacklist' } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.vendorService.blacklist(vendor.id, reason).subscribe(() => this.load());
      });
  }

  procurementDecision(request: VendorRegistrationRequest, approve: boolean): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: approve ? 'Accept registration' : 'Reject registration', label: 'Reason', required: true } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.vendorService.procurementDecision(request.id, approve, reason).subscribe(() => this.load());
      });
  }

  procurementHodDecision(request: VendorRegistrationRequest, approve: boolean): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: approve ? 'Approve vendor' : 'Reject vendor', label: 'Reason', required: true } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.vendorService.procurementHodDecision(request.id, approve, reason).subscribe(() => this.load());
      });
  }
}
