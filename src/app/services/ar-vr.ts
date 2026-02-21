import { Injectable } from '@angular/core';

import { registerPlugin } from '@capacitor/core';
import { Router } from '@angular/router';
import type { ArVrPluginPlugin, ArVrSessionOptions } from 'capacitor-ar-vr-plugin';

const ArVrPlugin = registerPlugin<ArVrPluginPlugin>('ArVrPlugin');

@Injectable({
  providedIn: 'root',
})
export class ArVrService {
  constructor(private router: Router) {
    this.initListeners();
  }

  private async initListeners() {
    await ArVrPlugin.addListener('onObjectSelected', (data) => {
      console.log('Object selected:', data);
      if (data.url) {
        this.router.navigateByUrl(data.url);
      }
    });
  }

  async startSession(options: ArVrSessionOptions) {
    await ArVrPlugin.startSession(options);
  }

  async stopSession() {
    await ArVrPlugin.stopSession();
  }

  async toggleVRMode(enable: boolean) {
    await ArVrPlugin.toggleVRMode({ enable });
  }
}
