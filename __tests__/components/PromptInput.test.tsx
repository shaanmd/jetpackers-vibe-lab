import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptInput } from '@/components/PromptInput'

describe('PromptInput', () => {
  it('renders placeholder text in textarea', () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    expect(screen.getByPlaceholderText(/describe your app/i)).toBeInTheDocument()
  })

  it('calls onSubmit with the typed prompt when button is clicked', async () => {
    const onSubmit = jest.fn()
    render(<PromptInput onSubmit={onSubmit} isDisabled={false} label="Build it" />)
    await userEvent.type(
      screen.getByPlaceholderText(/describe your app/i),
      'a meal planner'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))
    expect(onSubmit).toHaveBeenCalledWith('a meal planner')
  })

  it('clears textarea after submit', async () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={false} label="Build it" />)
    const textarea = screen.getByPlaceholderText(/describe your app/i)
    await userEvent.type(textarea, 'a meal planner')
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))
    expect(textarea).toHaveValue('')
  })

  it('disables button and textarea when isDisabled is true', () => {
    render(<PromptInput onSubmit={jest.fn()} isDisabled={true} label="Building…" />)
    expect(screen.getByRole('button', { name: 'Building…' })).toBeDisabled()
    expect(screen.getByPlaceholderText(/describe your app/i)).toBeDisabled()
  })

  it('does not call onSubmit when prompt is empty', async () => {
    const onSubmit = jest.fn()
    render(<PromptInput onSubmit={onSubmit} isDisabled={false} label="Build it" />)
    await userEvent.click(screen.getByRole('button', { name: 'Build it' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
