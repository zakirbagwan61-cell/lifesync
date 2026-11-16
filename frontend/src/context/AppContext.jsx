import { createContext, useContext } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'

// Context = one shared store that every page can read from, so we don't have to
// pass data down through props. Later phases add the real data and actions here:
//   bills, documents, subscriptions, tasks, appointments, activity.
const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Phase 1 only needs a tiny piece of state to prove the setup works.
  // Real collections (bills, tasks, ...) are added phase by phase.
  const [userName, setUserName] = useLocalStorage('lifesync_user', 'Friend')

  const value = { userName, setUserName }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook so pages can write: const { userName } = useApp()
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}
