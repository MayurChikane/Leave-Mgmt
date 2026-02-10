import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'nexuspulse';
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'nexuspulse-frontend';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const getOidcConfig = () => ({
  authority: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
  client_id: CLIENT_ID,
  redirect_uri: `${APP_URL}/auth/callback`,
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: APP_URL,
  userStore: typeof window !== 'undefined' ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
});

let _userManager: UserManager | null = null;
const getUserManager = () => {
  if (!_userManager && typeof window !== 'undefined') {
    _userManager = new UserManager(getOidcConfig());
  }
  return _userManager!;
};

export const keycloakAuth = {
  login: async () => {
    await getUserManager().signinRedirect();
  },

  handleCallback: async () => {
    const user = await getUserManager().signinRedirectCallback();
    return user;
  },

  logout: async () => {
    await getUserManager().signoutRedirect();
  },

  getUser: async () => {
    return await getUserManager().getUser();
  },
};
