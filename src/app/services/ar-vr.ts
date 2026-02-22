import { Injectable } from '@angular/core';

import { registerPlugin } from '@capacitor/core';
import { Router } from '@angular/router';
import type { ArVrPluginPlugin, ArVrSessionOptions, ArAvailabilityResult } from 'capacitor-ar-vr-plugin';

const ArVrPlugin = registerPlugin<ArVrPluginPlugin>('ArVrPlugin');

@Injectable({
  providedIn: 'root',
})
export class ArVrService {
  constructor(private router: Router) {
    this.initListeners();
  }

  private async initListeners() {
    await ArVrPlugin.addListener('onObjectSelected', (data: any) => {
      console.log('Property selected:', data);
      if (data.url) {
        this.router.navigateByUrl(data.url);
      }
    });
  }

  async checkAvailability(): Promise<ArAvailabilityResult> {
    return ArVrPlugin.checkAvailability();
  }

  async startSession(options: ArVrSessionOptions) {
    await ArVrPlugin.startSession(options);
  }

  async stopSession() {
    await ArVrPlugin.stopSession();
  }
}
