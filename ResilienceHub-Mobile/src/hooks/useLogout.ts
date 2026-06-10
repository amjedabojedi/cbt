import { useAuth } from '../context/AuthContext';

/**
 * Returns a logout handler that clears the session (server + persisted creds +
 * in-memory auth state via AuthContext) and routes back to the Login screen.
 * Centralizes what was previously duplicated in every drawer navigator.
 */
export function useLogout(navigation: any) {
  const { signOut } = useAuth();
  return async () => {
    await signOut();
    navigation.replace('Login');
  };
}
