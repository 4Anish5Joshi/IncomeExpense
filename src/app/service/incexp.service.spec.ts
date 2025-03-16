import { TestBed } from '@angular/core/testing';

import { IncexpService } from './incexp.service';

describe('IncexpService', () => {
  let service: IncexpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IncexpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
