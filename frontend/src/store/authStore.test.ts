import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '@/types/api';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('updates state on successful login', () => {
    const mockUser: User = { id: '1', name: 'Test Farmer' } as any;
    const mockToken = 'jwt-token-123';

    useAuthStore.getState().setSession(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('1');
    expect(state.accessToken).toBe(mockToken);
  });

  it('clears state on logout', () => {
    const mockUser: User = { id: '1', name: 'Test Farmer' } as any;
    useAuthStore.getState().setSession(mockUser, 'token');
    
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
