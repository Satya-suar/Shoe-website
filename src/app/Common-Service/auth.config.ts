// src/app/Common-Service/auth.config.ts
// ONE place to switch between the fake (mock) auth and your real API.
export const AUTH_CONFIG = {
  /** true  = fake auth in the browser (no backend needed)
   *  false = calls your real API below */
  useMock: true,

  /** Root of your backend, e.g. 'https://localhost:5001/api'. The interceptor only adds the token to URLs that start with this. */
  apiRoot: 'https://localhost:5001/api',

  /** Auth endpoints (relative to apiRoot) */
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },

  storageKey: 'luxekart_auth',

  /** Mock mode only: where fake registered accounts are kept in the browser */
  mockUsersKey: 'luxekart_mock_users',

  /** Shown on the login page while useMock is true */
  demo: { name: 'Demo Member', email: 'demo@luxekart.com', password: 'Luxe@123' },
};