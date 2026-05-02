import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';

import type { PluginListenerHandle } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  Geoscan,
  type CapabilitiesResult,
  type OrientationEvent,
  type StartOptions,
} from 'capacitor-geoar';

import {
  Fov,
  Orientation,
  Poi,
  Position,
  Spot,
  toPin,
  toSpots,
} from '../util/geo-math';

const RADAR_RADIUS_METERS = 5000;

@Injectable({ providedIn: 'root' })
export class GeoscanService {
  private readonly orientation$ = new BehaviorSubject<Orientation | null>(null);
  private readonly position$ = new BehaviorSubject<Position | null>(null);
  private readonly fov$ = new BehaviorSubject<Fov | null>(null);
  private readonly pois$ = new BehaviorSubject<Poi[]>([]);

  private orientationHandle?: PluginListenerHandle;
  private positionWatchId?: string;

  readonly spots$: Observable<Spot[]> = combineLatest([
    this.pois$,
    this.position$,
    this.orientation$,
    this.fov$,
  ]).pipe(
    map(([pois, position, orientation, fov]) => {
      if (!position || !orientation || !fov || pois.length === 0) return [];
      const pins = pois.map((p) => toPin(p, position));
      return toSpots(pins, orientation, fov, RADAR_RADIUS_METERS);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  async checkCapabilities(): Promise<CapabilitiesResult> {
    return Geoscan.checkCapabilities();
  }

  async loadPois(): Promise<Poi[]> {
    const response = await fetch('assets/mock-data/poi-list.json');
    if (!response.ok) throw new Error(`Failed to load POI list: ${response.status}`);
    const data = (await response.json()) as Poi[];
    this.pois$.next(data);
    return data;
  }

  async start(options?: StartOptions): Promise<void> {
    if (this.pois$.value.length === 0) {
      await this.loadPois();
    }

    const result = await Geoscan.startSession(options ?? { orientationHz: 30 });
    this.fov$.next({
      horizontalDeg: result.horizontalFovDeg,
      verticalDeg: result.verticalFovDeg,
    });

    this.orientationHandle = await Geoscan.addListener(
      'orientation',
      (event: OrientationEvent) => {
        this.orientation$.next({ heading: event.heading, pitch: event.pitch });
      },
    );

    this.positionWatchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, maximumAge: 1000 },
      (position) => {
        if (!position) return;
        this.position$.next({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
    );
  }

  async stop(): Promise<void> {
    if (this.orientationHandle) {
      await this.orientationHandle.remove();
      this.orientationHandle = undefined;
    }
    if (this.positionWatchId) {
      await Geolocation.clearWatch({ id: this.positionWatchId });
      this.positionWatchId = undefined;
    }
    await Geoscan.stopSession();
    this.orientation$.next(null);
    this.position$.next(null);
    this.fov$.next(null);
  }
}
