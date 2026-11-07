import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PolicyService } from '../../../core/services/policy.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CurrentPolicyDto } from '../../../core/models/policy.models';

@Component({
  selector: 'app-opd-policy',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/opd/dashboard">&larr; Back</a></p>
      <h2>Policy administration</h2>

      @if (policy) {
        <div class="card">
          <h3>Current policy version</h3>
          <p>Version {{ policy.versionNo }}, effective from {{ policy.effectiveFrom }}</p>

          <h4>Approval bands</h4>
          <table class="data">
            <thead><tr><th>Role</th><th>Min</th><th>Max</th><th>Sequence</th><th>Spend sub-head</th></tr></thead>
            <tbody>
              @for (b of policy.bands; track b.id) {
                <tr>
                  <td>{{ b.roleCode }}</td>
                  <td>{{ b.minAmount | number: '1.0-2' }}</td>
                  <td>{{ b.maxAmount != null ? (b.maxAmount | number: '1.0-2') : 'No limit' }}</td>
                  <td>{{ b.sequence }}</td>
                  <td>{{ b.spendSubHeadId ?? 'Any' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <h4>Quotation rules</h4>
          <table class="data">
            <thead><tr><th>Description</th><th>Min</th><th>Max</th><th>Star vendor</th><th>Emergency</th><th>Required quotes</th><th>Priority</th></tr></thead>
            <tbody>
              @for (r of policy.quotationRules; track r.id) {
                <tr>
                  <td>{{ r.description }}</td>
                  <td>{{ r.minAmount != null ? (r.minAmount | number: '1.0-2') : '-' }}</td>
                  <td>{{ r.maxAmount != null ? (r.maxAmount | number: '1.0-2') : '-' }}</td>
                  <td>{{ r.starVendor === null ? 'Any' : r.starVendor ? 'Yes' : 'No' }}</td>
                  <td>{{ r.emergency === null ? 'Any' : r.emergency ? 'Yes' : 'No' }}</td>
                  <td>{{ r.requiredQuotes }}</td>
                  <td>{{ r.priority }}</td>
                </tr>
              }
            </tbody>
          </table>

          <h4>Settings</h4>
          <table class="data">
            <thead><tr><th>Key</th><th>Value</th><th>Description</th><th></th></tr></thead>
            <tbody>
              @for (s of policy.settings; track s.key) {
                <tr>
                  <td>{{ s.key }}</td>
                  <td>
                    @if (editingKey === s.key) {
                      <input type="text" [(ngModel)]="editingValue" style="max-width:200px" />
                    } @else {
                      {{ s.value }}
                    }
                  </td>
                  <td>{{ s.description }}</td>
                  <td>
                    @if (editingKey === s.key) {
                      <button type="button" class="btn btn-primary btn-sm" (click)="saveSetting()">Save</button>
                    } @else {
                      <button type="button" class="btn btn-secondary btn-sm" (click)="editSetting(s.key, s.value)">Edit</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <div class="card">
        <h3>Create a new policy version</h3>
        <p style="color:var(--color-muted)">
          Approval bands and quotation rules you add below attach to whichever version is current; create a new
          version first if this is a deliberate policy change you want dated and traceable.
        </p>
        <div class="form-grid">
          <div class="field">
            <label>Change reason</label>
            <input type="text" [(ngModel)]="versionReason" />
          </div>
          <div class="field">
            <label>Effective from</label>
            <input type="date" [(ngModel)]="versionEffectiveFrom" />
          </div>
        </div>
        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="!versionReason.trim() || !versionEffectiveFrom" (click)="createVersion()">Create version</button>
        </div>
      </div>

      <div class="card">
        <h3>Add an approval band</h3>
        <div class="form-grid">
          <div class="field"><label>Role code</label><input type="text" [(ngModel)]="band.roleCode" placeholder="HOD / FINANCE / AUDIT / OPD" /></div>
          <div class="field"><label>Min amount</label><input type="number" min="0" [(ngModel)]="band.minAmount" /></div>
          <div class="field"><label>Max amount (blank = no limit)</label><input type="number" min="0" [(ngModel)]="band.maxAmount" /></div>
          <div class="field"><label>Sequence</label><input type="number" min="1" [(ngModel)]="band.sequence" /></div>
          <div class="field"><label>Spend sub-head id (blank = any)</label><input type="number" min="1" [(ngModel)]="band.spendSubHeadId" /></div>
        </div>
        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="!band.roleCode.trim()" (click)="addBand()">Add band</button>
        </div>
      </div>

      <div class="card">
        <h3>Add a quotation rule</h3>
        <div class="form-grid">
          <div class="field"><label>Description</label><input type="text" [(ngModel)]="rule.description" /></div>
          <div class="field"><label>Spend sub-head id (blank = any)</label><input type="number" min="1" [(ngModel)]="rule.spendSubHeadId" /></div>
          <div class="field"><label>Min amount (blank = any)</label><input type="number" min="0" [(ngModel)]="rule.minAmount" /></div>
          <div class="field"><label>Max amount (blank = any)</label><input type="number" min="0" [(ngModel)]="rule.maxAmount" /></div>
          <div class="field">
            <label>Star vendor</label>
            <select [(ngModel)]="rule.starVendor">
              <option [ngValue]="null">Any</option>
              <option [ngValue]="true">Yes</option>
              <option [ngValue]="false">No</option>
            </select>
          </div>
          <div class="field">
            <label>Emergency</label>
            <select [(ngModel)]="rule.emergency">
              <option [ngValue]="null">Any</option>
              <option [ngValue]="true">Yes</option>
              <option [ngValue]="false">No</option>
            </select>
          </div>
          <div class="field"><label>Required quotes</label><input type="number" min="1" max="10" [(ngModel)]="rule.requiredQuotes" /></div>
          <div class="field"><label>Priority (lower wins ties)</label><input type="number" min="1" [(ngModel)]="rule.priority" /></div>
        </div>
        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="!rule.description.trim()" (click)="addRule()">Add rule</button>
        </div>
      </div>
    </div>
  `,
})
export class OpdPolicyComponent implements OnInit {
  policy: CurrentPolicyDto | null = null;
  editingKey: string | null = null;
  editingValue = '';

  versionReason = '';
  versionEffectiveFrom = '';

  band = { roleCode: '', minAmount: 0, maxAmount: null as number | null, sequence: 1, spendSubHeadId: null as number | null };
  rule = {
    description: '',
    spendSubHeadId: null as number | null,
    minAmount: null as number | null,
    maxAmount: null as number | null,
    starVendor: null as boolean | null,
    emergency: null as boolean | null,
    requiredQuotes: 1,
    priority: 10,
  };

  constructor(private policyService: PolicyService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.policyService.current().subscribe((p) => (this.policy = p));
  }

  editSetting(key: string, value: string): void {
    this.editingKey = key;
    this.editingValue = value;
  }

  saveSetting(): void {
    if (!this.editingKey) return;
    this.policyService.updateSetting(this.editingKey, this.editingValue).subscribe(() => {
      this.toast.success('Setting updated.');
      this.editingKey = null;
      this.load();
    });
  }

  createVersion(): void {
    this.policyService.createVersion(this.versionReason.trim(), this.versionEffectiveFrom).subscribe(() => {
      this.toast.success('New policy version created.');
      this.versionReason = '';
      this.versionEffectiveFrom = '';
      this.load();
    });
  }

  addBand(): void {
    this.policyService.createApprovalBand(this.band.minAmount, this.band.maxAmount, this.band.sequence, this.band.roleCode.trim().toUpperCase(), this.band.spendSubHeadId).subscribe(() => {
      this.toast.success('Approval band added.');
      this.band = { roleCode: '', minAmount: 0, maxAmount: null, sequence: 1, spendSubHeadId: null };
      this.load();
    });
  }

  addRule(): void {
    this.policyService
      .createQuotationRule(
        this.rule.spendSubHeadId,
        this.rule.minAmount,
        this.rule.maxAmount,
        this.rule.starVendor,
        this.rule.emergency,
        this.rule.requiredQuotes,
        this.rule.priority,
        this.rule.description.trim()
      )
      .subscribe(() => {
        this.toast.success('Quotation rule added.');
        this.rule = { description: '', spendSubHeadId: null, minAmount: null, maxAmount: null, starVendor: null, emergency: null, requiredQuotes: 1, priority: 10 };
        this.load();
      });
  }
}
