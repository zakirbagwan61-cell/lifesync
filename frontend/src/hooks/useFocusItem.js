import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Lets another page link straight to one item: "/bills?focus=<id>".
// When a page using this hook opens with ?focus=<id>, it
//   1. calls prepare(id, tab) so the page can reveal the item (right tab, filters cleared),
//   2. scrolls the item into view, moves keyboard focus to it and flashes it briefly,
//   3. removes ?focus from the address so a refresh does not repeat it.
// The item's element must carry data-item-id="<id>".
export default function useFocusItem(prepare) {
  const [params, setParams] = useSearchParams()
  const focusId = params.get('focus')
  const [pending, setPending] = useState(null)

  useEffect(() => {
    if (!focusId) return
    prepare?.(focusId, params.get('tab'))
    setPending(focusId)
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('focus')
        next.delete('tab')
        return next
      },
      { replace: true }
    )
    // Only the link changing should trigger this, not every render of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  // Runs after the page has re-rendered with the item revealed.
  useEffect(() => {
    if (!pending) return undefined
    setPending(null)
    const el = document.querySelector(`[data-item-id="${CSS.escape(pending)}"]`)
    if (!el) return undefined
    el.setAttribute('tabindex', '-1') // lets a row or card receive focus from code
    el.scrollIntoView({ block: 'center' })
    el.focus({ preventScroll: true })
    el.classList.add('flash-highlight')
    const timer = window.setTimeout(() => el.classList.remove('flash-highlight'), 2400)
    return () => window.clearTimeout(timer)
  }, [pending])
}
