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
    this.requisitions.act(this.prId, 'OPD', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }
}
