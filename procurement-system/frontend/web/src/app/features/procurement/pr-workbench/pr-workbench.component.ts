import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { SourcingService } from '../../../core/services/sourcing.service';
import { PurchasingService } from '../../../core/services/purchasing.service';
import { BillsService } from '../../../core/services/bills.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { DocumentUploadComponent } from '../../../shared/components/document-upload/document-upload.component';
import { PrDetailDto, PrLineDto } from '../../../core/models/requisition.models';
import { VendorDto } from '../../../core/models/vendor.models';

interface QuotationLineForm {
  prLineId: number;
  include: boolean;
  qty: number;
  unitPrice: number;
  tax: number;
  discount: number;
}

interface TrackedQuotation {
  id: number;
  groupId: number;
  vendorId: number;
  vendorName: string;
}

/**
 * The entire sourcing -> PO -> contract -> activate -> bill pipeline for one PR, on a single
 * screen. The backend exposes no GET endpoints for sourcing groups, quotations or purchase
 * orders (only the commands that create them, each returning bare ids) - so instead of
 * pretending those ids can be looked up later, this screen tracks every id a command returns
 * in local state for the length of this session and lets the next step use it directly. If
 * the officer navigates away and back, anything not yet acted on has to be redone from the id
 * (PO id, group id, ...) they noted down - the same "write down the id" limitation this build
 * uses consistently wherever the API has no matching GET (see the report for the full list).
 */
@Component({
  selector: 'app-procurement-pr-workbench',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink, FormsModule, DocumentUploadComponent],
  template: `
    <div class="page">
      <p><a routerLink="/procurement/dashboard">&larr; Back to Procurement</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()"></app-pr-detail-core>

      @if (pr) {
        @if (pr.statusCode === 'PendingProcurement') {
          <div class="card">
            <h3>1. Accept for sourcing</h3>
            <p>Groups this PR's lines by category and resolves how many quotes each group needs (BR-026).</p>
            <button type="button" class="btn btn-primary" [disabled]="busy" (click)="acceptAndGroup()">Accept &amp; group</button>
          </div>
        }

        @if (groupIds.length > 0) {
          <div class="card">
            <h3>2. Quotations</h3>
            <p style="color:var(--color-muted)">Sourcing groups from this session: {{ groupIds.join(', ') }}.</p>
            <div class="form-grid">
              <div class="field">
                <label>Target group id</label>
                <select [(ngModel)]="quotation.groupId">
                  @for (g of groupIds; track g) { <option [ngValue]="g">Group {{ g }}</option> }
                </select>
              </div>
              <div class="field">
                <label>Vendor</label>
                <select [(ngModel)]="quotation.vendorId">
                  @for (v of vendors; track v.id) { <option [ngValue]="v.id">{{ v.legalName }}{{ v.isStarVendor ? ' (star)' : '' }}</option> }
                </select>
              </div>
              <div class="field"><label>Quotation #</label><input type="text" [(ngModel)]="quotation.quotationNo" /></div>
              <div class="field"><label>Quotation date</label><input type="date" [(ngModel)]="quotation.quotationDate" /></div>
              <div class="field"><label>Tax total</label><input type="number" min="0" [(ngModel)]="quotation.taxTotal" /></div>
            </div>
            <app-document-upload label="Quotation document" documentTypeCode="Quotation" (uploaded)="quotation.documentId = $event"></app-document-upload>

            <table class="data">
              <thead><tr><th>Include</th><th>Item</th><th>Qty</th><th>Unit price</th><th>Tax</th><th>Discount</th></tr></thead>
              <tbody>
                @for (line of quotationLines; track line.prLineId) {
                  <tr>
                    <td><input type="checkbox" style="width:auto" [(ngModel)]="line.include" /></td>
                    <td>{{ lineLabel(line.prLineId) }}</td>
                    <td><input type="number" min="0" step="0.01" [(ngModel)]="line.qty" [disabled]="!line.include" style="width:90px" /></td>
                    <td><input type="number" min="0" [(ngModel)]="line.unitPrice" [disabled]="!line.include" style="width:110px" /></td>
                    <td><input type="number" min="0" [(ngModel)]="line.tax" [disabled]="!line.include" style="width:90px" /></td>
                    <td><input type="number" min="0" [(ngModel)]="line.discount" [disabled]="!line.include" style="width:90px" /></td>
                  </tr>
                }
              </tbody>
            </table>
            <button type="button" class="btn btn-primary" style="margin-top:8px" [disabled]="!canAddQuotation() || busy" (click)="addQuotation()">Add quotation</button>
          </div>

          @if (quotations.length > 0) {
            <div class="card">
              <h3>3. Select the winning quote</h3>
              <table class="data">
                <thead><tr><th>Quotation id</th><th>Group</th><th>Vendor</th></tr></thead>
                <tbody>
                  @for (q of quotations; track q.id) {
                    <tr><td>{{ q.id }}</td><td>{{ q.groupId }}</td><td>{{ q.vendorName }}</td></tr>
                  }
                </tbody>
              </table>
              <div class="form-grid" style="margin-top:8px">
                <div class="field">
                  <label>Group</label>
                  <select [(ngModel)]="selection.groupId">
                    @for (g of groupIds; track g) { <option [ngValue]="g">Group {{ g }}</option> }
                  </select>
                </div>
                <div class="field">
                  <label>Winning quotation</label>
                  <select [(ngModel)]="selection.quotationId">
                    @for (q of quotations; track q.id) { <option [ngValue]="q.id">#{{ q.id }} - {{ q.vendorName }}</option> }
                  </select>
                </div>
                <div class="field"><label>Justification (required if not the lowest quote)</label><input type="text" [(ngModel)]="selection.justification" /></div>
              </div>
              <button type="button" class="btn btn-primary" [disabled]="!selection.groupId || !selection.quotationId || busy" (click)="selectQuote()">Select winning quote</button>
            </div>
          }
        }

        <div class="card">
          <h3>4. Create purchase order(s)</h3>
          <p style="color:var(--color-muted)">
            Every line must already be awarded to a vendor (via quote selection above, or an override) before this
            can run.
          </p>
          <div class="form-grid">
            <div class="field">
              <label>Advance type</label>
              <select [(ngModel)]="po.advanceTypeCode">
                <option value="None">None</option>
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>
            @if (po.advanceTypeCode === 'Percentage') {
              <div class="field"><label>Advance %</label><input type="number" min="0" max="100" [(ngModel)]="po.advancePct" /></div>
            }
            @if (po.advanceTypeCode === 'Fixed') {
              <div class="field"><label>Advance amount</label><input type="number" min="0" [(ngModel)]="po.advanceAmount" /></div>
            }
            <div class="field"><label>Delivery date</label><input type="date" [(ngModel)]="po.deliveryDate" /></div>
            <div class="field"><label>Payment terms (optional)</label><input type="text" [(ngModel)]="po.paymentTerms" /></div>
          </div>
          <button type="button" class="btn btn-primary" [disabled]="!po.deliveryDate || busy" (click)="createOrders()">Create PO(s)</button>
          @if (poIds.length) {
            <p style="margin-top:8px">PO ids from this session: {{ poIds.join(', ') }}</p>
          }
        </div>

        @if (poIds.length) {
          <div class="card">
            <h3>5. Generate &amp; activate contract</h3>
            <div class="form-grid">
              <div class="field">
                <label>PO id</label>
                <select [(ngModel)]="contractPoId">
                  @for (id of poIds; track id) { <option [ngValue]="id">{{ id }}</option> }
                </select>
              </div>
              <div class="field"><label>Contract template id</label><input type="number" min="1" [(ngModel)]="contract.templateId" /></div>
              <div class="field"><label>Start date</label><input type="date" [(ngModel)]="contract.startDate" /></div>
              <div class="field"><label>End date</label><input type="date" [(ngModel)]="contract.endDate" /></div>
              <div class="field"><label>Country of origin</label><input type="text" [(ngModel)]="contract.countryOfOrigin" /></div>
              <div class="field"><label>Incoterms</label><input type="text" [(ngModel)]="contract.incoterms" /></div>
            </div>
            <button type="button" class="btn btn-secondary" [disabled]="!contractPoId || !contract.templateId || busy" (click)="generateContract()">Generate contract</button>

            <h4 style="margin-top:16px">Activate (signed contract + security cheque)</h4>
            <app-document-upload label="Signed contract document" documentTypeCode="SignedContract" (uploaded)="activation.signedDocumentId = $event"></app-document-upload>
            <div class="form-grid">
              <div class="field"><label>Cheque #</label><input type="text" [(ngModel)]="activation.chequeNo" /></div>
              <div class="field"><label>Cheque bank</label><input type="text" [(ngModel)]="activation.chequeBank" /></div>
              <div class="field"><label>Cheque amount</label><input type="number" min="0" [(ngModel)]="activation.chequeAmount" /></div>
            </div>
            <app-document-upload label="Cheque document" documentTypeCode="SecurityCheque" (uploaded)="activation.chequeDocumentId = $event"></app-document-upload>
            <button type="button" class="btn btn-primary" style="margin-top:8px" [disabled]="!canActivate() || busy" (click)="activate()">Activate PO</button>

            <h4 style="margin-top:16px">Amend PO terms (BR-036)</h4>
            <div class="form-grid">
              <div class="field">
                <label>Amendment type</label>
                <select [(ngModel)]="amendment.amendmentTypeCode">
                  <option value="DeliveryDate">Delivery date</option>
                  <option value="Quantity">Quantity</option>
                  <option value="Price">Price</option>
                  <option value="PaymentTerms">Payment terms</option>
                </select>
              </div>
              <div class="field"><label>Old value</label><input type="text" [(ngModel)]="amendment.oldValue" /></div>
              <div class="field"><label>New value</label><input type="text" [(ngModel)]="amendment.newValue" /></div>
              <label class="field" style="flex-direction:row;align-items:center;gap:8px">
                <input type="checkbox" style="width:auto" [(ngModel)]="amendment.isEscalation" />
                <span>This is an increase/escalation (notifies Requestor, HOD, Finance, Audit)</span>
              </label>
              <div class="field"><label>Reason (mandatory)</label><input type="text" [(ngModel)]="amendment.reason" /></div>
            </div>
            <button type="button" class="btn btn-secondary" [disabled]="!amendment.reason.trim() || busy" (click)="amendPo()">Record amendment</button>
          </div>

          <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
            <h3>6. Goods receipt (GRN)</h3>
            <p class="warning-badge">
              Not available from this screen: recording a GRN needs each PO line's internal id, and no endpoint
              returns PO line ids (the PO-creation endpoint returns only PO ids) or lets this screen look a PO up
              by id. See the delivered report for this gap and the fix it needs on the backend.
            </p>
          </div>
        }

        <div class="card">
          <h3>Forward a bill for payment</h3>
          <p style="color:var(--color-muted)">For the purchase-cycle route (bills on the Bill/On-Usage/As-Policy route forward automatically on Finance approval).</p>
          <div class="form-grid">
            <div class="field">
              <label>PO id (optional for a bill PR)</label>
              <select [(ngModel)]="bill.poId">
                <option [ngValue]="null">-</option>
                @for (id of poIds; track id) { <option [ngValue]="id">{{ id }}</option> }
              </select>
            </div>
            <div class="field">
              <label>Vendor</label>
              <select [(ngModel)]="bill.vendorId">
                @for (v of vendors; track v.id) { <option [ngValue]="v.id">{{ v.legalName }}</option> }
              </select>
            </div>
            <div class="field"><label>Vendor invoice ref</label><input type="text" [(ngModel)]="bill.vendorInvoiceRef" /></div>
            <div class="field"><label>Invoice date</label><input type="date" [(ngModel)]="bill.invoiceDate" /></div>
            <div class="field"><label>Total</label><input type="number" min="0" [(ngModel)]="bill.total" /></div>
          </div>
          <app-document-upload label="Bill document" documentTypeCode="Bill" (uploaded)="bill.documentId = $event"></app-document-upload>
          <div class="actions-row">
            <button type="button" class="btn btn-primary" [disabled]="!canUploadBill() || busy" (click)="uploadBill()">Upload bill</button>
            @if (lastBillId) {
              <button type="button" class="btn btn-secondary" [disabled]="busy" (click)="forwardBill()">Forward bill #{{ lastBillId }} to Finance</button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ProcurementPrWorkbenchComponent implements OnInit {
  pr: PrDetailDto | null = null;
  vendors: VendorDto[] = [];
  busy = false;
  private prId = 0;

  groupIds: number[] = [];
  quotation = { groupId: null as number | null, vendorId: null as number | null, quotationNo: '', quotationDate: '', taxTotal: 0, documentId: 0 };
  quotationLines: QuotationLineForm[] = [];
  quotations: TrackedQuotation[] = [];
  selection = { groupId: null as number | null, quotationId: null as number | null, justification: '' };

  po = { advanceTypeCode: 'None', advancePct: null as number | null, advanceAmount: null as number | null, deliveryDate: '', paymentTerms: '' };
  poIds: number[] = [];
  contractPoId: number | null = null;
  contract = { templateId: null as number | null, startDate: '', endDate: '', countryOfOrigin: '', incoterms: '' };
  activation = { signedDocumentId: 0, chequeNo: '', chequeBank: '', chequeAmount: 0, chequeDocumentId: 0 };
  amendment = { amendmentTypeCode: 'DeliveryDate', oldValue: '', newValue: '', isEscalation: false, reason: '' };

  bill = { poId: null as number | null, vendorId: null as number | null, vendorInvoiceRef: '', invoiceDate: '', total: 0, documentId: 0 };
  lastBillId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private requisitions: RequisitionsService,
    private sourcing: SourcingService,
    private purchasing: PurchasingService,
    private bills: BillsService,
    private vendorsService: VendorsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    this.vendorsService.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode === 'Approved')));
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => {
      this.pr = pr;
      this.quotationLines = pr.lines.map((l) => ({ prLineId: l.id, include: false, qty: l.qty, unitPrice: l.estUnitPrice, tax: 0, discount: 0 }));
    });
  }

  lineLabel(prLineId: number): string {
    const line = this.pr?.lines.find((l: PrLineDto) => l.id === prLineId);
    return line ? line.itemName : String(prLineId);
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    this.requisitions.act(this.prId, 'PROCUREMENT', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }

  acceptAndGroup(): void {
    this.busy = true;
    this.sourcing.acceptAndGroup(this.prId).subscribe({
      next: (groupIds) => {
        this.busy = false;
        this.groupIds = groupIds;
        this.quotation.groupId = groupIds[0] ?? null;
        this.toast.success(`Grouped into ${groupIds.length} sourcing group(s).`);
        this.load();
      },
      error: () => (this.busy = false),
    });
  }

  canAddQuotation(): boolean {
    return !!(this.quotation.groupId && this.quotation.vendorId && this.quotation.quotationNo.trim() && this.quotation.quotationDate && this.quotation.documentId && this.quotationLines.some((l) => l.include));
  }

  addQuotation(): void {
    if (!this.canAddQuotation() || !this.quotation.groupId || !this.quotation.vendorId) return;
    this.busy = true;
    this.sourcing
      .addQuotation(this.quotation.groupId, {
        vendorId: this.quotation.vendorId,
        quotationNo: this.quotation.quotationNo.trim(),
        quotationDate: this.quotation.quotationDate,
        taxTotal: this.quotation.taxTotal,
        documentId: this.quotation.documentId,
        lines: this.quotationLines.filter((l) => l.include).map((l) => ({ prLineId: l.prLineId, qty: l.qty, unitPrice: l.unitPrice, tax: l.tax, discount: l.discount })),
      })
      .subscribe({
        next: (quotationId) => {
          this.busy = false;
          const vendorName = this.vendors.find((v) => v.id === this.quotation.vendorId)?.legalName ?? String(this.quotation.vendorId);
          this.quotations.push({ id: quotationId, groupId: this.quotation.groupId!, vendorId: this.quotation.vendorId!, vendorName });
          this.selection.groupId = this.quotation.groupId;
          this.toast.success(`Quotation #${quotationId} added.`);
          this.quotation = { groupId: this.quotation.groupId, vendorId: null, quotationNo: '', quotationDate: '', taxTotal: 0, documentId: 0 };
        },
        error: () => (this.busy = false),
      });
  }

  selectQuote(): void {
    if (!this.selection.groupId || !this.selection.quotationId) return;
    this.busy = true;
    this.sourcing.selectQuote(this.selection.groupId, { quotationId: this.selection.quotationId, justification: this.selection.justification.trim() || undefined }).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('Winning quote selected. Lines awarded to that vendor.');
        this.selection = { groupId: null, quotationId: null, justification: '' };
        this.load();
      },
      error: () => (this.busy = false),
    });
  }

  createOrders(): void {
    if (!this.po.deliveryDate) return;
    this.busy = true;
    this.purchasing.createOrders(this.prId, this.po.advanceTypeCode, this.po.deliveryDate, this.po.paymentTerms.trim() || undefined, this.po.advancePct ?? undefined, this.po.advanceAmount ?? undefined).subscribe({
      next: (poIds) => {
        this.busy = false;
        this.poIds = poIds;
        this.contractPoId = poIds[0] ?? null;
        this.toast.success(`Created ${poIds.length} PO(s): ${poIds.join(', ')}.`);
        this.load();
      },
      error: () => (this.busy = false),
    });
  }

  generateContract(): void {
    if (!this.contractPoId || !this.contract.templateId) return;
    this.busy = true;
    this.purchasing
      .generateContract(this.contractPoId, this.contract.templateId, this.contract.startDate || undefined, this.contract.endDate || undefined, this.contract.countryOfOrigin.trim() || undefined, this.contract.incoterms.trim() || undefined)
      .subscribe({
        next: (contractId) => {
          this.busy = false;
          this.toast.success(`Contract #${contractId} generated.`);
        },
        error: () => (this.busy = false),
      });
  }

  canActivate(): boolean {
    return !!(this.contractPoId && this.activation.signedDocumentId && this.activation.chequeNo.trim() && this.activation.chequeBank.trim() && this.activation.chequeAmount && this.activation.chequeDocumentId);
  }

  activate(): void {
    if (!this.canActivate() || !this.contractPoId) return;
    this.busy = true;
    this.purchasing.activate(this.contractPoId, this.activation.signedDocumentId, this.activation.chequeNo.trim(), this.activation.chequeBank.trim(), this.activation.chequeAmount, this.activation.chequeDocumentId).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('PO activated.');
        this.activation = { signedDocumentId: 0, chequeNo: '', chequeBank: '', chequeAmount: 0, chequeDocumentId: 0 };
        this.load();
      },
      error: () => (this.busy = false),
    });
  }

  amendPo(): void {
    if (!this.contractPoId || !this.amendment.reason.trim()) return;
    this.busy = true;
    this.purchasing.amend(this.contractPoId, this.amendment.amendmentTypeCode, this.amendment.oldValue.trim(), this.amendment.newValue.trim(), this.amendment.isEscalation, this.amendment.reason.trim()).subscribe({
      next: (amendmentId) => {
        this.busy = false;
        this.toast.success(`Amendment #${amendmentId} recorded.`);
        this.amendment = { amendmentTypeCode: 'DeliveryDate', oldValue: '', newValue: '', isEscalation: false, reason: '' };
      },
      error: () => (this.busy = false),
    });
  }

  canUploadBill(): boolean {
    return !!(this.bill.vendorId && this.bill.vendorInvoiceRef.trim() && this.bill.invoiceDate && this.bill.total && this.bill.documentId);
  }

  uploadBill(): void {
    if (!this.canUploadBill() || !this.bill.vendorId) return;
    this.busy = true;
    this.bills.upload(this.prId, this.bill.poId, this.bill.vendorId, this.bill.vendorInvoiceRef.trim(), this.bill.invoiceDate, this.bill.total, this.bill.documentId).subscribe({
      next: (billId) => {
        this.busy = false;
        this.lastBillId = billId;
        this.toast.success(`Bill #${billId} uploaded.`);
      },
      error: () => (this.busy = false),
    });
  }

  forwardBill(): void {
    if (!this.lastBillId) return;
    this.busy = true;
    this.bills.forward(this.lastBillId).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('Bill forwarded to Finance.');
        this.lastBillId = null;
        this.load();
      },
      error: () => (this.busy = false),
    });
  }
}
