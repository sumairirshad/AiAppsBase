import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemDto, UnitDto } from '../../../core/models/catalog.models';
import { PrLineInput } from '../../../core/models/requisition.models';
import { VendorsService } from '../../../core/services/vendors.service';
import { VendorSuggestionDto } from '../../../core/models/vendor.models';

export interface EditableLine extends PrLineInput {
  suggestions?: VendorSuggestionDto[];
}

/**
 * Bulk line entry for a PR: add/remove rows, pick an item (its category immediately pulls
 * approved-vendor suggestions ranked by score, BR-025), quantity and estimated unit price.
 * Market-guidance/last-paid/warning only exist once the PR is created (they're computed
 * server-side onto the saved line), so they show on the PR detail screen, not here.
 */
@Component({
  selector: 'app-pr-lines-grid',
  standalone: true,
  imports: [FormsModule],
  template: `
    <table class="data">
      <thead>
        <tr>
          <th style="width:28%">Item</th>
          <th style="width:10%">Qty</th>
          <th style="width:12%">Unit</th>
          <th style="width:14%">Est. unit price</th>
          <th style="width:20%">Description</th>
          <th style="width:16%">Suggested vendor</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (line of lines; track $index) {
          <tr>
            <td>
              <select [(ngModel)]="line.itemId" (ngModelChange)="onItemChange(line, $event)">
                <option [ngValue]="0" disabled>Select item...</option>
                @for (item of items; track item.id) {
                  <option [ngValue]="item.id">{{ item.name }}</option>
                }
              </select>
            </td>
            <td><input type="number" min="0.001" step="0.001" [(ngModel)]="line.qty" /></td>
            <td>
              <select [(ngModel)]="line.unitId">
                @for (unit of units; track unit.id) {
                  <option [ngValue]="unit.id">{{ unit.code }}</option>
                }
              </select>
            </td>
            <td><input type="number" min="0" step="0.01" [(ngModel)]="line.estUnitPrice" /></td>
            <td><input type="text" [(ngModel)]="line.description" /></td>
            <td>
              @if (line.suggestions?.length) {
                <select [(ngModel)]="line.suggestedVendorId">
                  <option [ngValue]="null">(none)</option>
                  @for (s of line.suggestions; track s.vendorId) {
                    <option [ngValue]="s.vendorId">{{ s.legalName }}{{ s.isStarVendor ? ' ★' : '' }}</option>
                  }
                </select>
              } @else {
                <span class="warning-badge">no approved vendor yet</span>
              }
            </td>
            <td><button type="button" class="btn btn-secondary btn-sm" (click)="removeLine($index)">Remove</button></td>
          </tr>
        }
      </tbody>
    </table>
    <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px" (click)="addLine()">+ Add line</button>
  `,
})
export class PrLinesGridComponent {
  @Input() lines: EditableLine[] = [];
  @Input() items: ItemDto[] = [];
  @Input() units: UnitDto[] = [];

  constructor(private vendors: VendorsService) {}

  addLine(): void {
    this.lines.push({ itemId: 0, qty: 1, unitId: this.units[0]?.id ?? 0, estUnitPrice: 0, description: '', suggestedVendorId: null });
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
  }

  onItemChange(line: EditableLine, itemId: number): void {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return;
    line.unitId = item.unitId;
    this.vendors.suggest(item.categoryId).subscribe((suggestions) => {
      line.suggestions = suggestions;
      line.suggestedVendorId = suggestions[0]?.vendorId ?? null;
    });
  }
}
