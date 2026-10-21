import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';

export type ToastKind = 'info' | 'success' | 'error';

export interface ConfirmOptions {
  header: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
}

/** Thay alert / confirm / prompt của trình duyệt (README §6.7). */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  async toast(message: string, kind: ToastKind = 'info'): Promise<void> {
    const color = { info: '#1e293b', success: '#166534', error: '#b91c1c' }[kind];
    const toast = await this.toastCtrl.create({
      message,
      duration: 2600,
      position: 'top',
      cssClass: 'vp-toast',
      style: { '--background': color, '--color': '#fff' } as any,
    } as any);
    await toast.present();
  }

  async confirm(opts: ConfirmOptions): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: opts.header,
      message: opts.message,
      cssClass: 'vp-alert',
      buttons: [
        { text: opts.cancelText ?? 'Cancel', role: 'cancel' },
        { text: opts.okText ?? 'Confirm', role: 'confirm', cssClass: opts.danger ? 'vp-alert-danger' : 'vp-alert-confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  /** Trả về chuỗi người dùng nhập, hoặc null nếu hủy. */
  async prompt(opts: ConfirmOptions & { placeholder?: string }): Promise<string | null> {
    const alert = await this.alertCtrl.create({
      header: opts.header,
      message: opts.message,
      cssClass: 'vp-alert',
      inputs: [{ name: 'value', type: 'textarea', placeholder: opts.placeholder }],
      buttons: [
        { text: opts.cancelText ?? 'Cancel', role: 'cancel' },
        { text: opts.okText ?? 'OK', role: 'confirm', cssClass: opts.danger ? 'vp-alert-danger' : 'vp-alert-confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    return role === 'confirm' ? (data?.values?.value ?? '') : null;
  }
}
