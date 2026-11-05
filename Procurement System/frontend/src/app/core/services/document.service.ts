import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentUploadResult {
  id: number;
  fileName: string;
  sizeBytes: number;
}

const base = `${environment.apiUrl}/documents`;

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private http: HttpClient) {}

  upload(file: File, documentTypeCode: string): Observable<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeCode', documentTypeCode);
    return this.http.post<DocumentUploadResult>(base, formData);
  }

  downloadUrl(documentId: number): string {
    return `${base}/${documentId}`;
  }
}
