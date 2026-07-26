import { describe, expect, it } from 'vitest';
import {
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_OFFER_NAME,
  FREE_DEMO_PRICE,
  FREE_DEMO_SESSION_COUNT,
  STANDARD_ONE_TO_ONE_PER_CLASS_PRICE,
  STANDARD_PRICING_SUMMARY,
  STANDARD_SMALL_GROUP_MAX_PER_CLASS,
  STANDARD_SMALL_GROUP_MIN_PER_CLASS,
} from '../../config/publicOffer';

describe('public offer configuration', () => {
  it('keeps the approved standard pricing facts', () => {
    expect(STANDARD_ONE_TO_ONE_PER_CLASS_PRICE).toBe(400);
    expect(STANDARD_SMALL_GROUP_MIN_PER_CLASS).toBe(180);
    expect(STANDARD_SMALL_GROUP_MAX_PER_CLASS).toBe(300);
    expect(STANDARD_PRICING_SUMMARY).toBe(
      'Standard 1:1: ₹400 per class • Small groups: ₹180–₹300 per child per class'
    );
  });

  it('keeps the approved free demo facts', () => {
    expect(FREE_DEMO_SESSION_COUNT).toBe(1);
    expect(FREE_DEMO_DURATION_MINUTES).toBe(35);
    expect(FREE_DEMO_PRICE).toBe(0);
    expect(FREE_DEMO_OFFER_NAME).toBe(
      'One Free 35-Minute Demo Assessment Class'
    );
  });
});
