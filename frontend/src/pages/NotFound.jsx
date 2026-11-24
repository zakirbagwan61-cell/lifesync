import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'

// Shown for any address that is not one of the app's pages.
export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="That address does not match a page in LifeSync." />
      <EmptyState
        icon={Compass}
        title="Nothing here"
        message="The link may be old or mistyped. Use the menu, or go back to the Dashboard."
        action={
          <Link to="/" className="btn-primary">
            Go to Dashboard
          </Link>
        }
      />
    </>
  )
}
