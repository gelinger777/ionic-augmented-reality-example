import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import type { CapabilitiesResult } from 'capacitor-geoar';

import { GeoscanService } from '../services/geoscan.service';
import type { Spot } from '../util/geo-math';
import {
  buildCapabilityGroups,
  rowStatusIcon,
  type CapabilityGroup,
  type CapabilityRow,
} from '../util/capability-rows';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  arMode = false;
  caps?: CapabilitiesResult;
  capsChecked = false;
  capabilityGroups: CapabilityGroup[] = [];

  readonly spots$ = this.geoscan.spots$;
  readonly statusIcon = rowStatusIcon;

  constructor(
    private readonly geoscan: GeoscanService,
    private readonly alert: AlertController,
    private readonly loading: LoadingController,
    private readonly toast: ToastController,
  ) {}

  async ngOnInit() {
    await this.refreshCapabilities();
  }

  async ngOnDestroy() {
    if (this.arMode) {
      await this.geoscan.stop();
    }
  }

  async refreshCapabilities() {
    try {
      this.caps = await this.geoscan.checkCapabilities();
      this.capabilityGroups = buildCapabilityGroups(this.caps);
    } catch {
      this.caps = undefined;
      this.capabilityGroups = [];
    }
    this.capsChecked = true;
  }

  trackByRow(_i: number, row: CapabilityRow) {
    return row.id;
  }

  trackByGroup(_i: number, group: CapabilityGroup) {
    return group.name;
  }

  async startAr() {
    await this.refreshCapabilities();
    if (!this.caps?.ready) {
      await this.showCapsBlockedAlert();
      return;
    }

    const loader = await this.loading.create({
      message: 'Starting AR…',
      duration: 4000,
    });
    await loader.present();

    try {
      await this.geoscan.start({ orientationHz: 30 });
      this.arMode = true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error starting AR.';
      const alert = await this.alert.create({
        header: 'AR session failed',
        message,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      await loader.dismiss();
    }
  }

  async stopAr() {
    this.arMode = false;
    await this.geoscan.stop();
  }

  async onSpotTap(spot: Spot) {
    const t = await this.toast.create({
      message: `${spot.label} · ${spot.price ?? ''} · ${formatDistance(spot.distanceMeters)}`,
      duration: 2200,
      position: 'bottom',
      buttons: [{ text: 'Close', role: 'cancel' }],
    });
    await t.present();
  }

  formatDistance(meters: number): string {
    return formatDistance(meters);
  }

  trackBySpot(_index: number, spot: Spot) {
    return spot.id;
  }

  private async showCapsBlockedAlert() {
    const reason = this.caps?.reason ?? 'unknown';
    const messages: Record<string, string> = {
      no_camera: 'This device has no camera.',
      no_gps: 'This device has no GPS hardware.',
      gps_disabled: 'Location services are turned off.',
      no_accelerometer: 'This device has no accelerometer.',
      no_gyroscope: 'This device has no gyroscope.',
      no_magnetometer:
        'This device has no compass. AR property finder needs a magnetometer to work.',
      no_fused_orientation: 'This device cannot provide fused orientation.',
      permission_denied: 'Camera or location permission was denied.',
      web_unsupported: 'AR mode is only available on a device.',
      unknown: 'AR is not available on this device right now.',
    };
    const alert = await this.alert.create({
      header: 'AR not available',
      message: messages[reason] ?? messages['unknown'],
      buttons: [
        { text: 'Retry', handler: () => this.refreshCapabilities() },
        { text: 'OK', role: 'cancel' },
      ],
    });
    await alert.present();
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
