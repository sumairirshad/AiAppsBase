import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private base = `${environment.apiBaseUrl}/documents`;

  constructor(private http: HttpClient) {}

  upload(file: File, documentTypeCode: string): Observable<number> {
    const form = new FormData();
    form.append('file', file);
    form.append('documentTypeCode', documentTypeCode);
    return this.http.post<number>(`${this.base}/upload`, form);
  }

  downloadUrl(id: number): string {
    return `${this.base}/${id}`;
  }
}
