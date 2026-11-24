// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IndianRupee } from 'lucide-react'
import StatCard from './StatCard'
import { formatCurrency } from '../../utils/helpers'

// The screen-reader copy of the number is always the final value, so tests read that.
const valueOf = () => document.querySelector('.stat-value')

describe('StatCard', () => {
  it('shows a label, the number and an optional line under the label', () => {
    render(<StatCard label="Pending bills" value={4} icon={IndianRupee} sub="₹18,248 outstanding" />)
    expect(screen.getByText('Pending bills')).toBeInTheDocument()
    expect(valueOf().querySelector('.sr-only')).toHaveTextContent('4')
    expect(screen.getByText('₹18,248 outstanding')).toBeInTheDocument()
  })

  it('formats the number with the given formatter, including paise', () => {
    render(<StatCard label="Amount pending" value={1234.5} format={formatCurrency} />)
    expect(valueOf().querySelector('.sr-only')).toHaveTextContent('₹1,234.50')
  })

  it.each([
    [0, '₹0', false],
    [1850, '₹1,850', false],
    [123456, '₹1,23,456', false], // 9 characters: the largest figure that keeps the normal size
    [1234567, '₹12,34,567', true],
    [10000000, '₹1,00,00,000', true],
    [123456789.5, '₹12,34,56,789.50', true],
  ])('amount %s shows as %s and uses the smaller size: %s', (value, shown, long) => {
    render(<StatCard label="Amount pending" value={value} format={formatCurrency} />)
    expect(valueOf().querySelector('.sr-only')).toHaveTextContent(shown)
    expect(valueOf().classList.contains('is-long')).toBe(long)
  })

  it('also shrinks long text values', () => {
    render(<StatCard label="Status" value="Everything is up to date" />)
    expect(valueOf()).toHaveClass('is-long')
  })

  it('keeps the tone and icon', () => {
    const { container } = render(<StatCard label="Overdue" value={2} icon={IndianRupee} tone="danger" />)
    expect(container.querySelector('.stat-icon')).toHaveClass('tone-danger')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
