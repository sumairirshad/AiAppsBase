import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DocumentsService } from '../../../core/services/documents.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  template: `
    <div class="field">
      @if (label) {
        <span class="label">{{ label }}</span>
      }
      <input type="file" (change)="onFileSelected($event)" [disabled]="uploading" />
      @if (uploading) {
        <small>Uploading...</small>
      }
      @if (uploadedId) {
        <small>Uploaded (document #{{ uploadedId }})</small>
      }
    </div>
  `,
})
export class DocumentUploadComponent {
  @Input() label = '';
  @Input() documentTypeCode = 'SupportingDoc';
  @Output() uploaded = new EventEmitter<number>();

  uploading = false;
  uploadedId: number | null = null;

  constructor(private documents: DocumentsService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.documents.upload(file, this.documentTypeCode).subscribe({
      next: (id) => {
        this.uploading = false;
        this.uploadedId = id;
        this.uploaded.emit(id);
      },
      error: () => {
        this.uploading = false;
      },
    });
  }
}
