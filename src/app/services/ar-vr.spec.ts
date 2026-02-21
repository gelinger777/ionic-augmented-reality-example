import { TestBed } from '@angular/core/testing';

import { ArVr } from './ar-vr';

describe('ArVr', () => {
  let service: ArVr;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArVr);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
