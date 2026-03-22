import { create } from 'zustand'

export const useStore = create((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),

  projects: [],
  setProjects: (projects) =>
    set(typeof projects === 'function'
      ? (s) => ({ projects: projects(s.projects) })
      : { projects }),

  requests: [],
  setRequests: (requests) =>
    set(typeof requests === 'function'
      ? (s) => ({ requests: requests(s.requests) })
      : { requests }),

  notifications: [],
  setNotifications: (notifications) =>
    set(typeof notifications === 'function'
      ? (s) => ({ notifications: notifications(s.notifications) })
      : { notifications }),

  matchCache: {},
  setMatchScore: (projectId, result) =>
    set((s) => ({ matchCache: { ...s.matchCache, [projectId]: result } })),

  notifSettings: { newMatch: true, chat: true, applications: true },
  toggleNotifSetting: (key) =>
    set((s) => ({ notifSettings: { ...s.notifSettings, [key]: !s.notifSettings[key] } })),

  privacy: { publicProfile: true, showOnline: true },
  togglePrivacy: (key) =>
    set((s) => ({ privacy: { ...s.privacy, [key]: !s.privacy[key] } })),

  darkMode: false,
  setDarkMode: (val) => set({ darkMode: val }),
}))