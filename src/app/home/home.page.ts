import { Component } from '@angular/core';
import { ArVrService } from '../services/ar-vr';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  isArMode = false;
  isVrMode = false;

  constructor(private arVrService: ArVrService) { }

  async startAR() {
    this.isArMode = true;
    const mockPois = [
      { id: 'b1', lat: 0.1, lng: 0.1, label: 'Building A', url: '/details/b1' },
      { id: 'b2', lat: -0.1, lng: 0.2, label: 'Building B', url: '/details/b2' }
    ];
    await this.arVrService.startSession({ pois: mockPois });
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
}
