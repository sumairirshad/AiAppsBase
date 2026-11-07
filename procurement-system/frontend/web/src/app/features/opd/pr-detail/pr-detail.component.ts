import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-opd-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/opd/dashboard">&larr; Back to OPD queue</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()"></app-pr-detail-core>
    </div>
  `,
})
export class OpdPrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  private prId = 0;

  constructor(private route: ActivatedRoute, private requisitions: RequisitionsService, private toast: ToastService) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => (this.pr = pr));
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    if (event.actionCode === 'Complete') {
      // Every Operational stage that escalates to OPD (sourcing accept, quotations, PO/
      // contract, GRN, bill-forward, acknowledgement) is driven by its own dedicated endpoint
      // in the Procurement workbench, Receiving, or the Requestor's acknowledge screen - the
      // generic act endpoint now rejects Complete outright, and even before this change it
      // never ran any of that work. OPD's own tools for an escalated PR are force-revert/void
      // below, or picking the task up in the owning role's screen.
      this.toast.error('This stage needs its own screen (Procurement\'s workbench, Receiving, or the Requestor\'s acknowledge page) - use force-revert/void below if it is stuck.');
      return;
    }
    this.requisitions.act(this.prId, 'OPD', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }
}
