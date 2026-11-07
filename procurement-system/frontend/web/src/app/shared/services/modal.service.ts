import { ComponentRef, Injectable, Type, ViewContainerRef, signal } from '@angular/core';
import type { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

export interface ModalHandle<TResult = unknown> {
  close(result: TResult | undefined): void;
}

interface ActiveModal {
  componentRef: ComponentRef<unknown>;
}

/**
 * The one dialog host every screen uses - a plain confirm/reason prompt, or any arbitrary
 * standalone component pushed in with inputs set directly on its instance and a `modalClose`
 * callback it can call with a result. ModalHostComponent (mounted once in AppComponent) owns
 * the ViewContainerRef this renders into, so there is exactly one dialog surface in the app.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private host: ViewContainerRef | null = null;
  readonly isOpen = signal(false);
  private active: ActiveModal | null = null;

  registerHost(host: ViewContainerRef): void {
    this.host = host;
  }

  /** Simple confirm/cancel, optionally with a required free-text reason. */
  confirm(options: { title: string; message?: string; requireReason?: boolean; reasonLabel?: string; confirmLabel?: string }): Promise<string | true | undefined> {
    return new Promise((resolve) => {
      import('../components/confirm-dialog/confirm-dialog.component').then(({ ConfirmDialogComponent }) => {
        this.open<ConfirmDialogComponent, string | true>(ConfirmDialogComponent, {
          title: options.title,
          message: options.message ?? '',
          requireReason: options.requireReason ?? false,
          reasonLabel: options.reasonLabel ?? 'Reason',
          confirmLabel: options.confirmLabel ?? 'Confirm',
        }).then(resolve);
      });
    });
  }

  open<TComponent, TResult = unknown>(component: Type<TComponent>, inputs?: Partial<TComponent>): Promise<TResult | undefined> {
    return new Promise((resolve) => {
      if (!this.host) {
        resolve(undefined);
        return;
      }
      this.host.clear();
      const componentRef = this.host.createComponent(component);
      if (inputs) Object.assign(componentRef.instance as object, inputs);
      (componentRef.instance as unknown as { modalClose?: (r?: TResult) => void }).modalClose = (result?: TResult) => {
        this.close();
        resolve(result);
      };
      this.active = { componentRef };
      this.isOpen.set(true);
    });
  }

  close(): void {
    this.active?.componentRef.destroy();
    this.active = null;
    this.isOpen.set(false);
    this.host?.clear();
  }
}
