import { Component, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  template: `
    @if (modal.isOpen()) {
      <div class="modal-backdrop" (click)="modal.close()"></div>
    }
    <div class="modal-slot" #slot></div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        z-index: 1000;
      }
      .modal-slot {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 8vh;
        pointer-events: none;
        z-index: 1001;
      }
      .modal-slot:empty {
        display: none;
      }
      .modal-slot > * {
        pointer-events: auto;
      }
    `,
  ],
})
export class ModalHostComponent implements AfterViewInit {
  @ViewChild('slot', { read: ViewContainerRef }) slot!: ViewContainerRef;

  constructor(public modal: ModalService) {}

  ngAfterViewInit(): void {
    this.modal.registerHost(this.slot);
  }
}
