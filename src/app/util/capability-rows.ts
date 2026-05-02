import type { PermissionState } from '@capacitor/core';
import type { CapabilitiesResult } from 'capacitor-geoar';

export type RowStatus = 'ok' | 'blocker' | 'attention' | 'info';

export interface CapabilityRow {
  id: string;
  group: 'Camera' | 'Location' | 'Sensors';
  icon: string;
  label: string;
  status: RowStatus;
  detail: string;
}

export interface CapabilityGroup {
  name: 'Camera' | 'Location' | 'Sensors';
  rows: CapabilityRow[];
}

export function buildCapabilityGroups(caps: CapabilitiesResult): CapabilityGroup[] {
  return [
    {
      name: 'Camera',
      rows: [
        {
          id: 'camera-hw',
          group: 'Camera',
          icon: 'camera-outline',
          label: 'Camera hardware',
          status: caps.camera.hardware ? 'ok' : 'blocker',
          detail: caps.camera.hardware ? 'Detected' : 'No camera on this device',
        },
        {
          id: 'camera-perm',
          group: 'Camera',
          icon: 'lock-closed-outline',
          label: 'Camera permission',
          ...permissionRow(caps.camera.permission),
        },
      ],
    },
    {
      name: 'Location',
      rows: [
        {
          id: 'gps-hw',
          group: 'Location',
          icon: 'location-outline',
          label: 'GPS hardware',
          status: caps.location.hardware ? 'ok' : 'blocker',
          detail: caps.location.hardware ? 'Detected' : 'No GPS on this device',
        },
        {
          id: 'gps-svc',
          group: 'Location',
          icon: 'navigate-outline',
          label: 'Location services',
          status: caps.location.serviceEnabled ? 'ok' : 'attention',
          detail: caps.location.serviceEnabled
            ? 'Enabled'
            : 'Turned off in system settings',
        },
        {
          id: 'gps-perm',
          group: 'Location',
          icon: 'lock-closed-outline',
          label: 'Location permission',
          ...permissionRow(caps.location.permission),
        },
      ],
    },
    {
      name: 'Sensors',
      rows: [
        {
          id: 'accel',
          group: 'Sensors',
          icon: 'speedometer-outline',
          label: 'Accelerometer',
          status: caps.accelerometer ? 'ok' : 'blocker',
          detail: caps.accelerometer ? 'Present' : 'Missing — needed for tilt',
        },
        {
          id: 'gyro',
          group: 'Sensors',
          icon: 'sync-outline',
          label: 'Gyroscope',
          status: caps.gyroscope ? 'ok' : 'blocker',
          detail: caps.gyroscope ? 'Present' : 'Missing — needed for stable rotation',
        },
        {
          id: 'mag',
          group: 'Sensors',
          icon: 'compass-outline',
          label: 'Magnetometer',
          status: caps.magnetometer ? 'ok' : 'blocker',
          detail: caps.magnetometer
            ? 'Present'
            : 'Missing — required for compass heading',
        },
        {
          id: 'fused',
          group: 'Sensors',
          icon: 'analytics-outline',
          label: 'Fused orientation',
          status: caps.fusedOrientation ? 'ok' : 'blocker',
          detail: caps.fusedOrientation
            ? 'Native sensor fusion available'
            : 'Device cannot provide stable orientation',
        },
        {
          id: 'true-heading',
          group: 'Sensors',
          icon: 'navigate-circle-outline',
          label: 'True north heading',
          status: caps.trueHeading ? 'ok' : 'info',
          detail: caps.trueHeading
            ? 'Corrected to true north'
            : 'Heading uses magnetic north on this device',
        },
      ],
    },
  ];
}

function permissionRow(state: PermissionState): { status: RowStatus; detail: string } {
  switch (state) {
    case 'granted':
      return { status: 'ok', detail: 'Granted' };
    case 'denied':
      return { status: 'blocker', detail: 'Denied — open system settings to allow' };
    case 'prompt':
    case 'prompt-with-rationale':
      return { status: 'attention', detail: 'Will prompt when AR is started' };
    default:
      return { status: 'attention', detail: 'Status unknown' };
  }
}

export function rowStatusIcon(status: RowStatus): string {
  switch (status) {
    case 'ok':
      return 'checkmark-circle';
    case 'blocker':
      return 'close-circle';
    case 'attention':
      return 'alert-circle';
    case 'info':
      return 'information-circle';
  }
}
