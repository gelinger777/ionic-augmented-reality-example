import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { ArVrService } from '../services/ar-vr';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isArMode = false;
  isVrMode = false;
  arAvailable = false;
  arStatus = '';
  arMessage = '';
  arChecked = false;

  constructor(
    private arVrService: ArVrService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    await this.checkAr();
  }

  async checkAr() {
    try {
      const result = await this.arVrService.checkAvailability();
      this.arAvailable = result.available;
      this.arStatus = result.status;
      this.arMessage = result.message;
      this.arChecked = true;
    } catch (e) {
      this.arAvailable = false;
      this.arStatus = 'unknown';
      this.arMessage = 'Could not check AR availability.';
      this.arChecked = true;
    }
  }

  async startAR() {
    // Re-check availability before starting
    await this.checkAr();

    if (!this.arAvailable) {
      await this.showArError();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Starting AR session...',
      duration: 3000,
    });
    await loading.present();

    this.isArMode = true;
    const mockPois = [
      {
        id: 'shop1',
        lat: 0.0005,
        lng: 0.0003,
        label: 'Shopping center',
        url: '/details/shop1',
        icon: '🛒',
        rating: 5,
        votes: 2741
      },
      {
        id: 'cafe1',
        lat: 0.0003,
        lng: -0.0004,
        label: 'Coffee shop',
        url: '/details/cafe1',
        icon: '☕',
        rating: 4,
        votes: 210
      },
      {
        id: 'fashion1',
        lat: -0.0002,
        lng: 0.0006,
        label: 'Fashion shop',
        url: '/details/fashion1',
        icon: '👗',
        rating: 4,
        votes: 881
      }
    ];
    try {
      await this.arVrService.startSession({ pois: mockPois });
      await loading.dismiss();
    } catch (e: any) {
      await loading.dismiss();
      this.isArMode = false;
      const errorMessage = e?.message || e?.errorMessage || 'An unknown error occurred while starting AR.';
      const alert = await this.alertController.create({
        header: '⚠️ AR Session Failed',
        message: `<p>${errorMessage}</p>`,
        cssClass: 'ar-error-alert',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  async stopAR() {
    this.isArMode = false;
    this.isVrMode = false;
    await this.arVrService.stopSession();
  }

  async toggleVR() {
    this.isVrMode = !this.isVrMode;
    await this.arVrService.toggleVRMode(this.isVrMode);
  }

  private async showArError() {
    const statusIcons: Record<string, string> = {
      not_installed: '📦',
      unsupported_device: '📱',
      outdated: '🔄',
      unknown: '❓',
    };
    const icon = statusIcons[this.arStatus] || '❓';

    const tips: Record<string, string> = {
      not_installed:
        'Open the Google Play Store and search for "Google Play Services for AR", then install it.',
      unsupported_device:
        'Unfortunately, this device\'s hardware does not support AR. ' +
        'You will need an ARCore-compatible device (most modern phones support it).',
      outdated:
        'Open the Google Play Store and update "Google Play Services for AR" to the latest version.',
      unknown:
        'Try restarting the app. If the problem persists, check that your device supports ARCore.',
    };
    const tip = tips[this.arStatus] || tips['unknown'];

    const alert = await this.alertController.create({
      header: `${icon} AR Not Available`,
      subHeader: this.arMessage,
      message: `<strong>How to fix:</strong><br><br>${tip}`,
      cssClass: 'ar-error-alert',
      buttons: [
        {
          text: 'Retry',
          role: 'cancel',
          handler: () => {
            this.checkAr();
          },
        },
        {
          text: 'OK',
          role: 'confirm',
        },
      ],
    });
    await alert.present();
  }
}
