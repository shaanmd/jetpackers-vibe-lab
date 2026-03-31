import { render, screen } from '@testing-library/react'
import { Preview } from '@/components/Preview'

describe('Preview', () => {
  it('shows loading skeleton when isLoading is true', () => {
    render(<Preview html="" isLoading={true} />)
    expect(screen.getByTestId('preview-loading')).toBeInTheDocument()
  })

  it('shows empty state when html is empty and not loading', () => {
    render(<Preview html="" isLoading={false} />)
    expect(screen.getByTestId('preview-empty')).toBeInTheDocument()
  })

  it('renders iframe when html is provided', () => {
    render(<Preview html="<!DOCTYPE html><html><body>Hello</body></html>" isLoading={false} />)
    const iframe = screen.getByTitle('App preview')
    expect(iframe).toBeInTheDocument()
  })

  it('iframe has sandbox attribute for security', () => {
    render(<Preview html="<html></html>" isLoading={false} />)
    const iframe = screen.getByTitle('App preview')
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-forms')
  })
})
