import { generateSlug } from '@/lib/slug'

describe('generateSlug', () => {
  it('returns a non-empty string without a title', () => {
    const slug = generateSlug()
    expect(typeof slug).toBe('string')
    expect(slug.length).toBeGreaterThan(0)
  })

  it('includes a sanitised version of the title', () => {
    const slug = generateSlug('My Meal Planner!')
    expect(slug).toMatch(/^my-meal-planner-/)
  })

  it('strips special characters from the title', () => {
    const slug = generateSlug('Hello @World #2024')
    expect(slug).toMatch(/^hello-world-2024-/)
  })

  it('trims the title portion to 30 characters', () => {
    const longTitle = 'a'.repeat(50)
    const slug = generateSlug(longTitle)
    const titlePart = slug.split('-').slice(0, -1).join('-')
    expect(titlePart.length).toBeLessThanOrEqual(30)
  })

  it('generates unique slugs for the same title', () => {
    const a = generateSlug('my app')
    const b = generateSlug('my app')
    expect(a).not.toBe(b)
  })

  it('contains only URL-safe characters', () => {
    const slug = generateSlug('Meal Planner & More!')
    expect(slug).toMatch(/^[a-z0-9-]+$/)
  })
})
