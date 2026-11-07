import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { SourcingService } from '../../../core/services/sourcing.service';
import { PurchasingService } from '../../../core/services/purchasing.service';
import { ReceivingService, GrnLineInput } from '../../../core/services/receiving.service';
import { BillsService } from '../../../core/services/bills.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { DocumentUploadComponent } from '../../../shared/components/document-upload/document-upload.component';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { VendorDto } from '../../../core/models/vendor.models';
import { SourcingGroupDto } from '../../../core/models/sourcing.models';
import { PurchaseOrderDto } from '../../../core/models/purchasing.models';

interface QuotationLineForm {
  prLineId: number;
  itemName: string;
  include: boolean;
  qty: number;
  unitPrice: number;
  tax: number;
  discount: number;
}

interface GrnLineForm {
  poLineId: number;
  itemName: string;
  orderedQty: number;
  outstandingQty: number;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectReason: string;
}

/**
 * The sourcing -> PO -> contract -> activate -> GRN -> bill pipeline for one PR, on a single
 * screen. GET /sourcing/pr/{id}/groups and GET /purchasing/pr/{id}/orders are the durable
 * source of truth for everything below "1. Accept for sourcing" - groups, quotations, purchase
 * orders, PO lines and contracts are all reloaded from the API after every write, so the
 * screen works the same after a refresh or for a different Procurement officer picking up the
 * same PR, and goods receipt can be entered against real PO line ids instead of guessed ones.
 */
@Component({
  selector: 'app-procurement-pr-workbench',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink, FormsModule, DecimalPipe, DocumentUploadComponent],
  template: `
    <div class="page">
      <p><a [routerLink]="backLink">&larr; {{ backLabel }}</a></p>
      @if (isOpdHandoff) {
        <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
          <p style="margin:0">
            <strong>Escalated to OPD.</strong> Procurement did not act on this stage within its deadline, so OPD is
            completing it here on Procurement's behalf.
          </p>
        </div>
      }
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()"></app-pr-detail-core>

      @if (pr) {
        @if (pr.statusCode === 'PendingProcurement') {
          <div class="card">
            <h3>1. Accept for sourcing</h3>
            <p>Groups this PR's lines by category and resolves how many quotes each group needs (BR-026).</p>
            <button type="button" class="btn btn-primary" [disabled]="busy" (click)="acceptAndGroup()">Accept &amp; group</button>
          </div>
        }

        @if (groups.length > 0) {
          <div class="card">
            <h3>2. Sourcing groups &amp; quotations</h3>
            @for (g of groups; track g.id) {
              <div style="border-top:1px solid var(--color-border, #e2e2e2);padding-top:12px;margin-top:12px">
                <p style="margin:0 0 6px">
                  <strong>Group {{ g.groupNo }}</strong> - {{ g.lines.length }} line(s), amount {{ g.groupAmount | number: '1.0-2' }},
                  needs {{ g.requiredQuotes }} quote(s)
                  @if (g.selectedQuotationId) {
                    <span class="chip chip-success">Awarded</span>
                  }
                </p>
                <table class="data">
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Awarded vendor</th></tr></thead>
                  <tbody>
                    @for (l of g.lines; track l.id) {
                      <tr><td>{{ l.itemName }}</td><td>{{ l.qty }}</td><td>{{ l.unitCode }}</td><td>{{ l.awardedVendorId ? vendorName(l.awardedVendorId) : '-' }}</td></tr>
                    }
                  </tbody>
                </table>

                @if (g.quotations.length > 0) {
                  <table class="data" style="margin-top:8px">
                    <thead><tr><th>Quotation #</th><th>Vendor</th><th>Total</th><th>Comparable total</th><th></th></tr></thead>
                    <tbody>
                      @for (q of g.quotations; track q.id) {
                        <tr>
                          <td>{{ q.quotationNo }}</td>
                          <td>{{ q.vendorName }}{{ q.isStarVendor ? ' (star)' : '' }}</td>
                          <td>{{ q.total | number: '1.0-2' }}</td>
                          <td>{{ q.comparableTotal | number: '1.0-2' }}</td>
                          <td>
                            @if (g.selectedQuotationId === q.id) {
                              <span class="chip chip-success">Selected</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }

                @if (!g.selectedQuotationId) {
                  <div class="actions-row" style="margin-top:8px">
                    <button type="button" class="btn btn-secondary btn-sm" (click)="startQuotation(g)">Add quotation</button>
                    @if (g.quotations.length > 0) {
                      <button type="button" class="btn btn-primary btn-sm" (click)="startSelection(g)">Select winning quote</button>
                    }
                  </div>
                }

                @if (quotation.groupId === g.id) {
                  <div class="card" style="background:var(--color-surface-muted, #f6f6f6);margin-top:8px">
                    <h4 style="margin-top:0">Add a quotation to group {{ g.groupNo }}</h4>
                    <div class="form-grid">
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
                            <td>{{ line.itemName }}</td>
                            <td><input type="number" min="0" step="0.01" [(ngModel)]="line.qty" [disabled]="!line.include" style="width:90px" /></td>
                            <td><input type="number" min="0" [(ngModel)]="line.unitPrice" [disabled]="!line.include" style="width:110px" /></td>
                            <td><input type="number" min="0" [(ngModel)]="line.tax" [disabled]="!line.include" style="width:90px" /></td>
                            <td><input type="number" min="0" [(ngModel)]="line.discount" [disabled]="!line.include" style="width:90px" /></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                    <div class="actions-row" style="margin-top:8px">
                      <button type="button" class="btn btn-primary" [disabled]="!canAddQuotation() || busy" (click)="addQuotation()">Add quotation</button>
                      <button type="button" class="btn btn-secondary" (click)="cancelQuotation()">Cancel</button>
                    </div>
                  </div>
                }

                @if (selection.groupId === g.id) {
                  <div class="card" style="background:var(--color-surface-muted, #f6f6f6);margin-top:8px">
                    <h4 style="margin-top:0">Select the winning quote for group {{ g.groupNo }}</h4>
                    <div class="form-grid">
                      <div class="field">
                        <label>Winning quotation</label>
                        <select [(ngModel)]="selection.quotationId">
                          @for (q of g.quotations; track q.id) { <option [ngValue]="q.id">{{ q.quotationNo }} - {{ q.vendorName }} ({{ q.comparableTotal | number: '1.0-2' }})</option> }
                        </select>
                      </div>
                      <div class="field"><label>Justification (required if not the lowest quote)</label><input type="text" [(ngModel)]="selection.justification" /></div>
                    </div>
                    <div class="actions-row">
                      <button type="button" class="btn btn-primary" [disabled]="!selection.quotationId || busy" (click)="selectQuote()">Confirm selection</button>
                      <button type="button" class="btn btn-secondary" (click)="cancelSelection()">Cancel</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <div class="card">
          <h3>3. Create purchase order(s)</h3>
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
        </div>

        @if (purchaseOrders.length > 0) {
          <div class="card">
            <h3>4. Purchase orders, contracts &amp; amendments</h3>
            <table class="data">
              <thead><tr><th>PO #</th><th>Vendor</th><th>Status</th><th>Total</th><th>Delivery</th><th>Contract</th></tr></thead>
              <tbody>
                @for (po_ of purchaseOrders; track po_.id) {
                  <tr [style.fontWeight]="selectedPoId === po_.id ? 'bold' : 'normal'" style="cursor:pointer" (click)="selectedPoId = po_.id">
                    <td>{{ po_.poNumber }}</td>
                    <td>{{ po_.vendorName }}</td>
                    <td>{{ po_.poStatusCode }}</td>
                    <td>{{ po_.total | number: '1.0-2' }}</td>
                    <td>{{ po_.deliveryDate }}</td>
                    <td>{{ po_.contract ? po_.contract.contractTypeCode + (po_.contract.signedDocumentId ? ' (signed)' : ' (not yet activated)') : '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            @if (selectedPo) {
              <div style="margin-top:12px">
                @if (!selectedPo.contract) {
                  <h4>Generate contract for {{ selectedPo.poNumber }}</h4>
                  <div class="form-grid">
                    <div class="field"><label>Contract template id</label><input type="number" min="1" [(ngModel)]="contract.templateId" /></div>
                    <div class="field"><label>Start date</label><input type="date" [(ngModel)]="contract.startDate" /></div>
                    <div class="field"><label>End date</label><input type="date" [(ngModel)]="contract.endDate" /></div>
                    <div class="field"><label>Country of origin</label><input type="text" [(ngModel)]="contract.countryOfOrigin" /></div>
                    <div class="field"><label>Incoterms</label><input type="text" [(ngModel)]="contract.incoterms" /></div>
                  </div>
                  <button type="button" class="btn btn-secondary" [disabled]="!contract.templateId || busy" (click)="generateContract()">Generate contract</button>
                } @else if (!selectedPo.contract.signedDocumentId) {
                  <h4>Activate {{ selectedPo.poNumber }} (signed contract + security cheque)</h4>
                  <app-document-upload label="Signed contract document" documentTypeCode="SignedContract" (uploaded)="activation.signedDocumentId = $event"></app-document-upload>
                  <div class="form-grid">
                    <div class="field"><label>Cheque #</label><input type="text" [(ngModel)]="activation.chequeNo" /></div>
                    <div class="field"><label>Cheque bank</label><input type="text" [(ngModel)]="activation.chequeBank" /></div>
                    <div class="field"><label>Cheque amount</label><input type="number" min="0" [(ngModel)]="activation.chequeAmount" /></div>
                  </div>
                  <app-document-upload label="Cheque document" documentTypeCode="SecurityCheque" (uploaded)="activation.chequeDocumentId = $event"></app-document-upload>
                  <button type="button" class="btn btn-primary" style="margin-top:8px" [disabled]="!canActivate() || busy" (click)="activate()">Activate PO</button>
                } @else {
                  <p style="color:var(--color-muted)">Contract signed and PO active.</p>
                }

                <h4 style="margin-top:16px">Amend {{ selectedPo.poNumber }} (BR-036)</h4>
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
            }
          </div>

          <div class="card">
            <h3>5. Goods receipt (GRN)</h3>
            <div class="form-grid">
              <div class="field">
                <label>PO</label>
                <select [(ngModel)]="grnPoId" (ngModelChange)="onGrnPoChanged($event)">
                  <option [ngValue]="null">-</option>
                  @for (po_ of receivablePos; track po_.id) { <option [ngValue]="po_.id">{{ po_.poNumber }} - {{ po_.vendorName }}</option> }
                </select>
              </div>
            </div>
            @if (grnLines.length > 0) {
              <div class="form-grid">
                <div class="field"><label>Delivery note #</label><input type="text" [(ngModel)]="grn.deliveryNoteNo" /></div>
                <div class="field"><label>Received on</label><input type="date" [(ngModel)]="grn.receivedOn" /></div>
              </div>
              <table class="data">
                <thead><tr><th>Item</th><th>Ordered</th><th>Outstanding</th><th>Delivered</th><th>Accepted</th><th>Rejected</th><th>Reject reason</th></tr></thead>
                <tbody>
                  @for (l of grnLines; track l.poLineId) {
                    <tr>
                      <td>{{ l.itemName }}</td>
                      <td>{{ l.orderedQty }}</td>
                      <td>{{ l.outstandingQty }}</td>
                      <td><input type="number" min="0" [max]="l.outstandingQty" step="0.01" [(ngModel)]="l.deliveredQty" style="width:90px" /></td>
                      <td><input type="number" min="0" [max]="l.deliveredQty" step="0.01" [(ngModel)]="l.acceptedQty" style="width:90px" /></td>
                      <td><input type="number" min="0" [(ngModel)]="l.rejectedQty" style="width:90px" /></td>
                      <td><input type="text" [(ngModel)]="l.rejectReason" [disabled]="!l.rejectedQty" style="width:140px" /></td>
                    </tr>
                  }
                </tbody>
              </table>
              <button type="button" class="btn btn-primary" style="margin-top:8px" [disabled]="!canRecordGrn() || busy" (click)="recordGrn()">Record GRN</button>
            } @else if (grnPoId) {
              <p class="empty-state">Every line on this PO has already been fully received.</p>
            }
          </div>
        }

        <div class="card">
          <h3>Forward a bill for payment</h3>
          <p style="color:var(--color-muted)">For the purchase-cycle route (bills on the Bill/On-Usage/As-Policy route forward automatically on Finance approval).</p>
          <div class="form-grid">
            <div class="field">
              <label>PO (optional for a bill PR)</label>
              <select [(ngModel)]="bill.poId">
                <option [ngValue]="null">-</option>
                @for (po_ of purchaseOrders; track po_.id) { <option [ngValue]="po_.id">{{ po_.poNumber }}</option> }
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

  /**
   * This same component is reused, unmodified otherwise, from an OPD-prefixed route
   * (app.routes.ts) when an Operational stage Procurement owns has escalated to OPD - see
   * features/opd/pr-detail. Route `data` is what tells it which role is actually acting, so the
   * generic action bar's calls go through as that role instead of being hardcoded to
   * Procurement, and so the back link returns to the right dashboard.
   */
  actingRoleCode = 'PROCUREMENT';
  backLink: any[] = ['/procurement/dashboard'];
  backLabel = 'Back to Procurement';
  isOpdHandoff = false;

  groups: SourcingGroupDto[] = [];
  quotation = { groupId: null as number | null, vendorId: null as number | null, quotationNo: '', quotationDate: '', taxTotal: 0, documentId: 0 };
  quotationLines: QuotationLineForm[] = [];
  selection = { groupId: null as number | null, quotationId: null as number | null, justification: '' };

  po = { advanceTypeCode: 'None', advancePct: null as number | null, advanceAmount: null as number | null, deliveryDate: '', paymentTerms: '' };
  purchaseOrders: PurchaseOrderDto[] = [];
  selectedPoId: number | null = null;
  contract = { templateId: null as number | null, startDate: '', endDate: '', countryOfOrigin: '', incoterms: '' };
  activation = { signedDocumentId: 0, chequeNo: '', chequeBank: '', chequeAmount: 0, chequeDocumentId: 0 };
  amendment = { amendmentTypeCode: 'DeliveryDate', oldValue: '', newValue: '', isEscalation: false, reason: '' };

  grnPoId: number | null = null;
  grnLines: GrnLineForm[] = [];
  grn = { deliveryNoteNo: '', receivedOn: '' };

  bill = { poId: null as number | null, vendorId: null as number | null, vendorInvoiceRef: '', invoiceDate: '', total: 0, documentId: 0 };
  lastBillId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requisitions: RequisitionsService,
    private sourcing: SourcingService,
    private purchasing: PurchasingService,
    private receiving: ReceivingService,
    private bills: BillsService,
    private vendorsService: VendorsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    const data = this.route.snapshot.data as { roleCode?: string; backLink?: string; backLabel?: string };
    if (data.roleCode) this.actingRoleCode = data.roleCode;
    if (data.backLink) this.backLink = [data.backLink, this.prId];
    if (data.backLabel) this.backLabel = data.backLabel;
    this.isOpdHandoff = this.actingRoleCode === 'OPD';
    this.load();
    this.vendorsService.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode === 'Approved')));
  }

  get selectedPo(): PurchaseOrderDto | null {
    return this.purchaseOrders.find((p) => p.id === this.selectedPoId) ?? null;
  }

  /** POs that still have at least one line with outstanding quantity to receive. */
  get receivablePos(): PurchaseOrderDto[] {
    return this.purchaseOrders.filter((p) => p.lines.some((l) => l.outstandingQty > 0));
  }

  vendorName(id: number): string {
    return this.vendors.find((v) => v.id === id)?.legalName ?? String(id);
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => {
      this.pr = pr;
      // Defends against someone navigating here by hand for a PR that was never actually
      // escalated to OPD (or whose owning role already acted): the backend's own
      // WorkflowEngine.GetAllowedActionsAsync only populates allowedActions for OPD on an
      // Operational-stage task when it is genuinely the escalation target.
      if (this.isOpdHandoff && pr.allowedActions.length === 0) {
        this.toast.error('This PR is not currently escalated to OPD at this stage.');
        this.router.navigate(['/opd/pr', this.prId]);
      }
    });
    this.sourcing.groupsForPr(this.prId).subscribe((groups) => (this.groups = groups));
    this.purchasing.ordersForPr(this.prId).subscribe((orders) => {
      this.purchaseOrders = orders;
      if (this.selectedPoId === null && orders.length) this.selectedPoId = orders[0].id;
      if (this.grnPoId) this.onGrnPoChanged(this.grnPoId);
    });
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    if (event.actionCode === 'Complete') {
      // Every Operational stage Procurement owns (accept, quotations, PO/contract, GRN, bill-
      // forward) is advanced by its own dedicated command above, which drives the workflow
      // itself - the generic act endpoint now rejects Complete outright, and even before this
      // change calling it here did none of that real work.
      this.toast.error('Use the specific action for this step above - it advances the PR for you.');
      return;
    }
    this.requisitions.act(this.prId, this.actingRoleCode, event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }

  acceptAndGroup(): void {
    this.busy = true;
    this.sourcing.acceptAndGroup(this.prId).subscribe({
      next: (groupIds) => {
        this.busy = false;
        this.toast.success(`Grouped into ${groupIds.length} sourcing group(s).`);
        this.load();
      },
      error: () => (this.busy = false),
    });
  }

  startQuotation(g: SourcingGroupDto): void {
    this.quotation = { groupId: g.id, vendorId: null, quotationNo: '', quotationDate: '', taxTotal: 0, documentId: 0 };
    this.quotationLines = g.lines.map((l) => ({ prLineId: l.id, itemName: l.itemName, include: false, qty: l.qty, unitPrice: 0, tax: 0, discount: 0 }));
  }

  cancelQuotation(): void {
    this.quotation = { groupId: null, vendorId: null, quotationNo: '', quotationDate: '', taxTotal: 0, documentId: 0 };
    this.quotationLines = [];
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
          this.toast.success(`Quotation #${quotationId} added.`);
          this.cancelQuotation();
          this.load();
        },
        error: () => (this.busy = false),
      });
  }

  startSelection(g: SourcingGroupDto): void {
    this.selection = { groupId: g.id, quotationId: g.quotations[0]?.id ?? null, justification: '' };
  }

  cancelSelection(): void {
    this.selection = { groupId: null, quotationId: null, justification: '' };
  }

  selectQuote(): void {
    if (!this.selection.groupId || !this.selection.quotationId) return;
    this.busy = true;
    this.sourcing.selectQuote(this.selection.groupId, { quotationId: this.selection.quotationId, justification: this.selection.justification.trim() || undefined }).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('Winning quote selected. Lines awarded to that vendor.');
        this.cancelSelection();
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
        this.toast.success(`Created ${poIds.length} PO(s).`);
        this.load();
      },
      error: () => (this.busy = false),
    });
  }

  generateContract(): void {
    if (!this.selectedPoId || !this.contract.templateId) return;
    this.busy = true;
    this.purchasing
      .generateContract(this.selectedPoId, this.contract.templateId, this.contract.startDate || undefined, this.contract.endDate || undefined, this.contract.countryOfOrigin.trim() || undefined, this.contract.incoterms.trim() || undefined)
      .subscribe({
        next: (contractId) => {
          this.busy = false;
          this.toast.success(`Contract #${contractId} generated.`);
          this.load();
        },
        error: () => (this.busy = false),
      });
  }

  canActivate(): boolean {
    return !!(this.selectedPoId && this.activation.signedDocumentId && this.activation.chequeNo.trim() && this.activation.chequeBank.trim() && this.activation.chequeAmount && this.activation.chequeDocumentId);
  }

  activate(): void {
    if (!this.canActivate() || !this.selectedPoId) return;
    this.busy = true;
    this.purchasing.activate(this.selectedPoId, this.activation.signedDocumentId, this.activation.chequeNo.trim(), this.activation.chequeBank.trim(), this.activation.chequeAmount, this.activation.chequeDocumentId).subscribe({
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
    if (!this.selectedPoId || !this.amendment.reason.trim()) return;
    this.busy = true;
    this.purchasing.amend(this.selectedPoId, this.amendment.amendmentTypeCode, this.amendment.oldValue.trim(), this.amendment.newValue.trim(), this.amendment.isEscalation, this.amendment.reason.trim()).subscribe({
      next: (amendmentId) => {
        this.busy = false;
        this.toast.success(`Amendment #${amendmentId} recorded.`);
        this.amendment = { amendmentTypeCode: 'DeliveryDate', oldValue: '', newValue: '', isEscalation: false, reason: '' };
      },
      error: () => (this.busy = false),
    });
  }

  onGrnPoChanged(poId: number | null): void {
    this.grnPoId = poId;
    const po = this.purchaseOrders.find((p) => p.id === poId);
    this.grnLines = (po?.lines ?? [])
      .filter((l) => l.outstandingQty > 0)
      .map((l) => ({
        poLineId: l.id,
        itemName: l.itemName,
        orderedQty: l.qty,
        outstandingQty: l.outstandingQty,
        deliveredQty: l.outstandingQty,
        acceptedQty: l.outstandingQty,
        rejectedQty: 0,
        rejectReason: '',
      }));
  }

  canRecordGrn(): boolean {
    return !!(this.grnPoId && this.grn.deliveryNoteNo.trim() && this.grn.receivedOn && this.grnLines.some((l) => l.deliveredQty > 0));
  }

  recordGrn(): void {
    if (!this.canRecordGrn() || !this.grnPoId) return;
    const lines: GrnLineInput[] = this.grnLines
      .filter((l) => l.deliveredQty > 0)
      .map((l) => ({ poLineId: l.poLineId, deliveredQty: l.deliveredQty, acceptedQty: l.acceptedQty, rejectedQty: l.rejectedQty, rejectReason: l.rejectReason.trim() || null }));
    this.busy = true;
    this.receiving.recordGrn(this.grnPoId, this.grn.deliveryNoteNo.trim(), this.grn.receivedOn, lines).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('GRN recorded.');
        this.grn = { deliveryNoteNo: '', receivedOn: '' };
        this.load();
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
