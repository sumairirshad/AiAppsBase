import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-document-upload',
  template: `
    <div class="uploader">
      <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="uploading">
        <mat-icon>upload_file</mat-icon>
        {{ fileName || label }}
      </button>
      <mat-progress-spinner *ngIf="uploading" diameter="20" mode="indeterminate"></mat-progress-spinner>
      <mat-icon *ngIf="documentId && !uploading" class="success-icon" matTooltip="Uploaded">check_circle</mat-icon>
      <input hidden type="file" #fileInput (change)="onFileSelected($event)" />
    </div>
  `,
  styles: [`
    .uploader { display: flex; align-items: center; gap: 8px; }
    .success-icon { color: #1e7a34; }
  `],
})
export class DocumentUploadComponent {
  @Input() label = 'Upload document';
  @Input() documentTypeCode = 'SupportingDoc';
  @Output() uploaded = new EventEmitter<number>();

  uploading = false;
  fileName: string | null = null;
  documentId: number | null = null;

  constructor(private documentService: DocumentService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.fileName = file.name;
    this.documentService.upload(file, this.documentTypeCode).subscribe({
      next: (result) => {
        this.uploading = false;
        this.documentId = result.id;
        this.uploaded.emit(result.id);
      },
      error: () => {
        this.uploading = false;
        this.fileName = null;
      },
    });
  }
}
