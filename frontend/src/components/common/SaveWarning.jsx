import { useState, useSyncExternalStore } from 'react'
import { AlertTriangle } from 'lucide-react'
import { saveStatus } from '../../utils/storage'

// Shown when the browser refuses to save (storage full, or blocked by privacy settings).
// The app still works, but changes made now would be lost on reload, so the user is told.
// It disappears by itself as soon as a save works again, and can be dismissed.
export default function SaveWarning() {
  const { failed, reason, version } = useSyncExternalStore(saveStatus.subscribe, saveStatus.getSnapshot)
  const [dismissedVersion, setDismissedVersion] = useState(0)

  if (failed.length === 0 || version === dismissedVersion) return null

  return (
    <div className="alert-banner save-warning" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <p>
        <strong>Your latest changes are not being saved.</strong>{' '}
        {reason === 'full'
          ? 'Your browser storage is full. Free up some space for this site, then make a change to try again.'
          : 'Your browser is blocking saved data for this site (for example in private browsing). Allow site data, then make a change to try again.'}{' '}
        Until then, changes will be lost if you reload or close this tab.
      </p>
      <button type="button" className="btn-secondary btn-small" onClick={() => setDismissedVersion(version)}>
        Dismiss
      </button>
    </div>
  )
}
