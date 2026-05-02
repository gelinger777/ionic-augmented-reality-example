export interface Poi {
  id: string;
  lat: number;
  lng: number;
  label: string;
  subtitle?: string;
  price?: string;
  url?: string;
}

export interface Position {
  lat: number;
  lng: number;
}

export interface Pin extends Poi {
  bearing: number;
  distanceMeters: number;
}

export interface Spot extends Pin {
  screenX: number;
  screenY: number;
  size: number;
}

const DEG2RAD = Math.PI / 180;
const EARTH_RADIUS_METERS = 6_371_000;

export function distanceMeters(a: Position, b: Position): number {
  const dLat = (b.lat - a.lat) * DEG2RAD;
  const dLng = (b.lng - a.lng) * DEG2RAD;
  const lat1 = a.lat * DEG2RAD;
  const lat2 = b.lat * DEG2RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function bearingDeg(from: Position, to: Position): number {
  const lat1 = from.lat * DEG2RAD;
  const lat2 = to.lat * DEG2RAD;
  const dLng = (to.lng - from.lng) * DEG2RAD;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let deg = Math.atan2(y, x) / DEG2RAD;
  if (deg < 0) deg += 360;
  return deg;
}

export function toPin(poi: Poi, user: Position): Pin {
  return {
    ...poi,
    bearing: bearingDeg(user, poi),
    distanceMeters: distanceMeters(user, poi),
  };
}

export interface Fov {
  horizontalDeg: number;
  verticalDeg: number;
}

export interface Orientation {
  /** Compass heading 0=N, 90=E. */
  heading: number;
  /** 0=horizontal, +up, -down. */
  pitch: number;
}

/**
 * Project pins inside the camera FOV onto screen-relative coordinates [0..100].
 * Pins outside the FOV are dropped.
 */
export function toSpots(
  pins: Pin[],
  orientation: Orientation,
  fov: Fov,
  radarRadiusMeters: number,
): Spot[] {
  const halfH = fov.horizontalDeg / 2;
  const halfV = fov.verticalDeg / 2;

  // POIs are assumed to be at user-eye-level (no elevation data), so when the camera
  // is pitched far enough that the horizon leaves the frame, no marker can be visible.
  if (Math.abs(orientation.pitch) > halfV) return [];

  const out: Spot[] = [];

  for (const pin of pins) {
    if (pin.distanceMeters > radarRadiusMeters) continue;

    let pinBearing = pin.bearing;
    let userHeading = orientation.heading;

    if (userHeading <= halfH && 360 - pinBearing < halfH - userHeading) pinBearing -= 360;
    if (pinBearing <= halfH && 360 - userHeading < halfH - pinBearing) userHeading -= 360;

    const angle = pinBearing - userHeading;
    if (Math.abs(angle) > halfH) continue;

    const screenX = ((angle + halfH) / fov.horizontalDeg) * 100;
    const screenY = pitchToScreenY(orientation.pitch, fov.verticalDeg);
    const size = 85 * (1 - pin.distanceMeters / radarRadiusMeters) + 15;

    out.push({ ...pin, screenX, screenY, size });
  }
  return out;
}

function pitchToScreenY(pitchDeg: number, verticalFovDeg: number): number {
  const ratio = pitchDeg / Math.max(verticalFovDeg, 10);
  const y = 50 + ratio * 100;
  return Math.max(5, Math.min(95, y));
}
