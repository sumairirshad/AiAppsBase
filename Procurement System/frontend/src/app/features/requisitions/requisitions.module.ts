import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RequisitionsRoutingModule } from './requisitions-routing.module';
import { RequisitionListComponent } from './requisition-list/requisition-list.component';
import { RequisitionCreateComponent } from './requisition-create/requisition-create.component';
import { RequisitionDetailComponent } from './requisition-detail/requisition-detail.component';
import { FinanceApproveDialogComponent } from './requisition-detail/finance-approve-dialog.component';
import { SourcingTabComponent } from './requisition-detail/tabs/sourcing-tab.component';
import { AddQuotationDialogComponent } from './requisition-detail/tabs/add-quotation-dialog.component';
import { PurchasingTabComponent } from './requisition-detail/tabs/purchasing-tab.component';
import { CreatePoDialogComponent } from './requisition-detail/tabs/create-po-dialog.component';
import { ReceivingTabComponent } from './requisition-detail/tabs/receiving-tab.component';
import { RecordGrnDialogComponent } from './requisition-detail/tabs/record-grn-dialog.component';
import { BillsTabComponent } from './requisition-detail/tabs/bills-tab.component';
import { UploadBillDialogComponent } from './requisition-detail/tabs/upload-bill-dialog.component';
import { AuditTabComponent } from './requisition-detail/tabs/audit-tab.component';

@NgModule({
  declarations: [
    RequisitionListComponent,
    RequisitionCreateComponent,
    RequisitionDetailComponent,
    FinanceApproveDialogComponent,
    SourcingTabComponent,
    AddQuotationDialogComponent,
    PurchasingTabComponent,
    CreatePoDialogComponent,
    ReceivingTabComponent,
    RecordGrnDialogComponent,
    BillsTabComponent,
    UploadBillDialogComponent,
    AuditTabComponent,
  ],
  imports: [SharedModule, RequisitionsRoutingModule],
})
export class RequisitionsModule {}
