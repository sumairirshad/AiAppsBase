import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CategoryDto } from '../../../core/models/catalog.models';
import { VendorContactData } from '../../../core/models/vendor.models';

@Component({
  selector: 'app-vendor-registration',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <h2>Register a new vendor</h2>
      <p style="color:var(--color-muted)">
        Submits a vendor registration request for Procurement's review and approval. The vendor cannot be used
        on a PR until it is approved.
      </p>

      <div class="card">
        <h3>1. Identity</h3>
        <div class="form-grid">
          <div class="field">
            <label>Legal name</label>
            <input type="text" [(ngModel)]="legalName" />
          </div>
          <div class="field">
            <label>NTN</label>
            <input type="text" [(ngModel)]="ntn" />
          </div>
          <div class="field">
            <label>STRN (optional)</label>
            <input type="text" [(ngModel)]="strn" />
          </div>
        </div>
      </div>

      <div class="card">
        <h3>2. Categories supplied</h3>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          @for (c of categories; track c.id) {
            <label style="display:flex;align-items:center;gap:6px;font-weight:normal">
              <input type="checkbox" style="width:auto" [checked]="selectedCategoryIds.has(c.id)" (change)="toggleCategory(c.id)" />
              {{ c.name }}
            </label>
          }
        </div>
      </div>

      <div class="card">
        <h3>3. Bank details</h3>
        <div class="form-grid">
          <div class="field">
            <label>Bank name</label>
            <input type="text" [(ngModel)]="bankName" />
          </div>
          <div class="field">
            <label>Account title</label>
            <input type="text" [(ngModel)]="accountTitle" />
          </div>
          <div class="field">
            <label>Account number</label>
            <input type="text" [(ngModel)]="accountNo" />
          </div>
        </div>
      </div>

      <div class="card">
        <h3>4. Contacts</h3>
        <table class="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Primary</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of contacts; track $index) {
              <tr>
                <td><input type="text" [(ngModel)]="c.name" /></td>
                <td><input type="text" [(ngModel)]="c.email" /></td>
                <td><input type="text" [(ngModel)]="c.phone" /></td>
                <td style="text-align:center">
                  <input type="radio" name="primaryContact" style="width:auto" [checked]="c.isPrimary" (change)="setPrimary($index)" />
                </td>
                <td>
                  <button type="button" class="btn btn-secondary" (click)="removeContact($index)">Remove</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <button type="button" class="btn btn-secondary" style="margin-top:8px" (click)="addContact()">+ Add contact</button>
      </div>

      <div class="actions-row">
        <button type="button" class="btn btn-primary" [disabled]="submitting" (click)="submit()">Submit registration</button>
      </div>
    </div>
  `,
})
export class VendorRegistrationComponent implements OnInit {
  categories: CategoryDto[] = [];
  selectedCategoryIds = new Set<number>();

  legalName = '';
  ntn = '';
  strn = '';
  bankName = '';
  accountTitle = '';
  accountNo = '';
  contacts: VendorContactData[] = [{ name: '', email: '', phone: '', isPrimary: true }];
  submitting = false;

  constructor(private catalog: CatalogService, private vendors: VendorsService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void {
    this.catalog.categories().subscribe((c) => (this.categories = c));
  }

  toggleCategory(id: number): void {
    if (this.selectedCategoryIds.has(id)) {
      this.selectedCategoryIds.delete(id);
    } else {
      this.selectedCategoryIds.add(id);
    }
  }

  addContact(): void {
    this.contacts.push({ name: '', email: '', phone: '', isPrimary: this.contacts.length === 0 });
  }

  removeContact(index: number): void {
    const wasPrimary = this.contacts[index].isPrimary;
    this.contacts.splice(index, 1);
    if (wasPrimary && this.contacts.length) {
      this.contacts[0].isPrimary = true;
    }
  }

  setPrimary(index: number): void {
    this.contacts.forEach((c, i) => (c.isPrimary = i === index));
  }

  submit(): void {
    if (!this.legalName.trim() || !this.ntn.trim()) {
      this.toast.error('Legal name and NTN are required.');
      return;
    }
    if (this.selectedCategoryIds.size === 0) {
      this.toast.error('Select at least one category.');
      return;
    }
    if (!this.bankName.trim() || !this.accountTitle.trim() || !this.accountNo.trim()) {
      this.toast.error('Bank details are required.');
      return;
    }
    const contacts = this.contacts.filter((c) => c.name.trim());
    if (contacts.length === 0) {
      this.toast.error('Add at least one contact.');
      return;
    }

    this.submitting = true;
    this.vendors
      .register({
        legalName: this.legalName,
        ntn: this.ntn,
        strn: this.strn || null,
        categoryIds: Array.from(this.selectedCategoryIds),
        bankName: this.bankName,
        accountTitle: this.accountTitle,
        accountNo: this.accountNo,
        contacts,
      })
      .subscribe({
        next: () => {
          this.toast.success('Vendor registration submitted for Procurement review.');
          this.router.navigate(['/requestor/my-requests']);
        },
        error: () => {
          this.submitting = false;
        },
      });
  }
}
