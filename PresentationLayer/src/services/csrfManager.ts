const API_URL = import.meta.env.VITE_API_URL || '/api';

class CsrfManager {
  private token: string | null = null;
  private pendingFetch: Promise<string> | null = null;

  /**
   * Sets the CSRF token in memory (e.g. from login response or token endpoint).
   */
  public setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Clears the current CSRF token from memory (e.g. upon logout or session expiry).
   */
  public clearToken(): void {
    this.token = null;
    this.pendingFetch = null;
  }

  /**
   * Retrieves the active CSRF token.
   * If not already cached, retrieves it from /api/v1/auth/csrf-token.
   * Deduplicates concurrent fetch calls to avoid redundant network round-trips.
   */
  public async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    if (this.pendingFetch) {
      return this.pendingFetch;
    }

    this.pendingFetch = (async () => {
      try {
        const response = await fetch(`${API_URL}/v1/auth/csrf-token`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: HTTP ${response.status}`);
        }

        const data = await response.json();
        const token = data.csrf_token;
        if (!token) {
          throw new Error('CSRF token not present in response');
        }

        this.token = token;
        return token;
      } catch (error) {
        this.token = null;
        throw error;
      } finally {
        this.pendingFetch = null;
      }
    })();

    return this.pendingFetch;
  }

  /**
   * Refreshes the CSRF token by invalidating cache and fetching a new one.
   */
  public async refreshToken(): Promise<string> {
    this.clearToken();
    return this.getToken();
  }
}

export const csrfManager = new CsrfManager();
export default csrfManager;

