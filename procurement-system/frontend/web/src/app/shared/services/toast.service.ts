import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(text: string, kind: ToastMessage['kind'] = 'info'): void {
    const id = nextId++;
    this.toasts.update((list) => [...list, { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 6000);
  }

  error(text: string): void {
    this.show(text, 'error');
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
