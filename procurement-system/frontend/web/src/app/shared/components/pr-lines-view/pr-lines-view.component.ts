import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PrLineDto } from '../../../core/models/requisition.models';

/** Read-only PR line table with the market-guidance/last-paid/warning badge (BR-051). */
@Component({
  selector: 'app-pr-lines-view',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <table class="data">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Est. unit price</th>
          <th>Market guidance</th>
          <th>Last paid</th>
          <th>Line total</th>
          <th>Vendor</th>
        </tr>
      </thead>
      <tbody>
        @for (line of lines; track line.id) {
          <tr>
            <td>{{ line.itemName }}</td>
            <td>{{ line.qty }}</td>
            <td>{{ line.unitCode }}</td>
            <td>
              {{ line.estUnitPrice | number: '1.0-2' }}
              @if (line.priceWarningPct) {
                <div class="warning-badge">{{ line.priceWarningPct | number: '1.0-1' }}% above market</div>
              }
            </td>
            <td>{{ line.marketPriceAtRequest != null ? (line.marketPriceAtRequest | number: '1.0-2') : '—' }}</td>
            <td>{{ line.lastPaidPriceAtRequest != null ? (line.lastPaidPriceAtRequest | number: '1.0-2') : '—' }}</td>
            <td>{{ line.lineTotal | number: '1.0-2' }}</td>
            <td>
              @if (line.awardedVendorId) {
                Vendor #{{ line.awardedVendorId }}
                @if (line.overrideReason) {
                  <div class="warning-badge">overridden: {{ line.overrideReason }}</div>
                }
              } @else if (line.suggestedVendorId) {
                Suggested: #{{ line.suggestedVendorId }}
              } @else {
                —
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PrLinesViewComponent {
  @Input() lines: PrLineDto[] = [];
}
