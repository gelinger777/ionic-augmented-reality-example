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
    await this.checkAr();

    if (!this.arAvailable) {
      await this.showArError();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Starting AR...',
      duration: 3000,
    });
    await loading.present();

    this.isArMode = true;

    // Real Vienna buildings as demo POIs
    const properties = [
      {
        id: 'staatsoper',
        lat: 48.2029,
        lng: 16.3689,
        label: 'Wiener Staatsoper',
        url: '/details/staatsoper',
        image: '',
      },
      {
        id: 'stephansdom',
        lat: 48.2082,
        lng: 16.3738,
        label: 'Stephansdom',
        url: '/details/stephansdom',
        image: '',
      },
      {
        id: 'belvedere',
        lat: 48.1915,
        lng: 16.3808,
        label: 'Schloss Belvedere',
        url: '/details/belvedere',
        image: '',
      },
      {
        id: 'rathaus',
        lat: 48.2108,
        lng: 16.3575,
        label: 'Wiener Rathaus',
        url: '/details/rathaus',
        image: '',
      },
    ];

    try {
      await this.arVrService.startSession({ pois: properties });
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
    await this.arVrService.stopSession();
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
