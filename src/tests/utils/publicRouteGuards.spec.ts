import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isAuthEntryRoute,
  isProtectedAppRoute,
  shouldShowPublicSupportWidgets,
} from '../../utils/publicRouteGuards';

describe(
  'school protected route classification',
  () => {
    it(
      'treats school workspace as protected',
      () => {
        expect(
          isProtectedAppRoute(
            '/school',
          ),
        ).toBe(true);

        expect(
          isProtectedAppRoute(
            '/school/classes',
          ),
        ).toBe(true);
      },
    );

    it('treats founder workspace and login as private auth surfaces', () => {
      expect(isProtectedAppRoute('/founder')).toBe(true);
      expect(isProtectedAppRoute('/founder/reviews')).toBe(true);
      expect(isAuthEntryRoute('/founder/login')).toBe(true);
      expect(shouldShowPublicSupportWidgets('/founder')).toBe(false);
    });

    it(
      'treats school login as an auth entry route',
      () => {
        expect(
          isAuthEntryRoute(
            '/school/login',
          ),
        ).toBe(true);
      },
    );

    it(
      'does not show public widgets inside the School Portal',
      () => {
        expect(
          shouldShowPublicSupportWidgets(
            '/school',
          ),
        ).toBe(false);
      },
    );

    it(
      'does not confuse the public for-schools page with the protected school portal',
      () => {
        expect(
          isProtectedAppRoute(
            '/for-schools',
          ),
        ).toBe(false);
      },
    );
  },
);
