import { create } from 'zustand';
import { authService } from '../services/auth';

type Status = 'connected' | 'checking' | 'error';

interface ConnectionState {
  status: Status;
  check: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'checking',
  async check() {
    set({ status: 'checking' });
    const result = await authService.pingDb();
    set({ status: result });
  },
}));
