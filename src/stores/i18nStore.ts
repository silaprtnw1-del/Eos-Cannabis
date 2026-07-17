import { create } from 'zustand';

interface I18nState {
  isTh: boolean;
  toggle: () => void;
  setLanguage: (isTh: boolean) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  isTh: true,
  toggle: () => set((s) => ({ isTh: !s.isTh })),
  setLanguage: (isTh) => set({ isTh }),
}));

export const useIsTh = () => useI18nStore((s) => s.isTh);
