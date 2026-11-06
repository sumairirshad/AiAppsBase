import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="stars" role="radiogroup" aria-label="Quality rating">
      @for (star of [1, 2, 3, 4, 5]; track star) {
        <button type="button" class="star" [class.filled]="star <= value" (click)="select(star)" [attr.aria-checked]="star === value">
          &#9733;
        </button>
      }
    </div>
  `,
  styles: [
    `
      .stars {
        display: flex;
        gap: 2px;
      }
      .star {
        background: none;
        border: none;
        font-size: 24px;
        color: #d1d5db;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      .star.filled {
        color: #f0b400;
      }
    `,
  ],
})
export class StarRatingComponent {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();

  select(star: number): void {
    this.value = star;
    this.valueChange.emit(star);
  }
}
