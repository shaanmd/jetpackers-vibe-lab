import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareModal } from '@/components/ShareModal'

describe('ShareModal', () => {
  const url = 'https://vibelab.jetpackers.ai/view/my-app-abc123'

  it('does not render when url is null', () => {
    const { container } = render(<ShareModal url={null} onClose={jest.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the shareable URL', () => {
    render(<ShareModal url={url} onClose={jest.fn()} />)
    expect(screen.getByText(url)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn()
    render(<ShareModal url={url} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('copies URL to clipboard when copy button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
    render(<ShareModal url={url} onClose={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url)
  })
})
