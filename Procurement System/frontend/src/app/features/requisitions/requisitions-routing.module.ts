import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequisitionListComponent } from './requisition-list/requisition-list.component';
import { RequisitionCreateComponent } from './requisition-create/requisition-create.component';
import { RequisitionDetailComponent } from './requisition-detail/requisition-detail.component';

const routes: Routes = [
  { path: 'mine', component: RequisitionListComponent, data: { mode: 'mine' } },
  { path: 'inbox', component: RequisitionListComponent, data: { mode: 'inbox' } },
  { path: 'new', component: RequisitionCreateComponent },
  { path: ':id', component: RequisitionDetailComponent },
  { path: '', redirectTo: 'mine', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequisitionsRoutingModule {}
