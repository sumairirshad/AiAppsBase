import { describe, expect, it } from 'vitest'
import { normalizeImageSrc } from './image-src'

describe('normalizeImageSrc', () => {
  it('keeps correct root-relative upload paths unchanged', () => {
    expect(normalizeImageSrc('/Uploads/123-shot.png')).toBe('/Uploads/123-shot.png')
  })
  it('makes relative paths root-relative so they work from nested routes like /product/<slug>', () => {
    expect(normalizeImageSrc('Uploads/123-shot.png')).toBe('/Uploads/123-shot.png')
    expect(normalizeImageSrc('./Uploads/123-shot.png')).toBe('/Uploads/123-shot.png')
  })
  it('strips a public/ prefix (files in public/ are served from the site root)', () => {
    expect(normalizeImageSrc('public/Uploads/123-shot.png')).toBe('/Uploads/123-shot.png')
    expect(normalizeImageSrc('/public/Uploads/123-shot.png')).toBe('/Uploads/123-shot.png')
  })
  it('converts Windows backslashes', () => {
    expect(normalizeImageSrc('\\Uploads\\123-shot.png')).toBe('/Uploads/123-shot.png')
    expect(normalizeImageSrc('public\\Uploads\\123-shot.png')).toBe('/Uploads/123-shot.png')
  })
  it('leaves absolute, protocol-relative, data and blob URLs alone', () => {
    expect(normalizeImageSrc('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(normalizeImageSrc('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png')
    expect(normalizeImageSrc('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })
  it('treats empty values as "no image" so the fallback shows', () => {
    expect(normalizeImageSrc('')).toBeNull()
    expect(normalizeImageSrc('   ')).toBeNull()
    expect(normalizeImageSrc(null)).toBeNull()
    expect(normalizeImageSrc(undefined)).toBeNull()
  })
})
