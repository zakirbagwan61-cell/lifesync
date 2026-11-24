import { daysUntil } from './helpers'

// How many subscriptions renew within the next `days` days, counting today.
// Renewals whose date has already passed are not "coming up", so they are not counted here
// (the Subscriptions table still flags them in red). This is the same 0 to 7 day rule
// that Smart Insights uses for its renewal recommendation.
export function renewingSoonCount(subscriptions, days = 7) {
  return subscriptions.filter((s) => {
    const left = daysUntil(s.nextRenewal)
    return left >= 0 && left <= days
  }).length
}
