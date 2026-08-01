import { describe, it, expect } from 'vitest'
import { safeFileName, isAllowedImageUpload, isAllowedDeliverableUpload } from './upload-safety'

describe('safeFileName', () => {
  it('strips directory traversal segments', () => {
    expect(safeFileName('../../etc/passwd')).not.toContain('..')
    expect(safeFileName('../../etc/passwd')).not.toContain('/')
  })

  it('strips an absolute path down to the basename', () => {
    expect(safeFileName('/var/www/secret.txt')).toBe('secret.txt')
  })

  it('preserves a safe extension', () => {
    expect(safeFileName('My Cool Screenshot.PNG')).toMatch(/\.png$/)
  })

  it('never returns an empty stem', () => {
    expect(safeFileName('....png')).not.toBe('.png')
    expect(safeFileName('....png').length).toBeGreaterThan(4)
  })

  it('drops characters outside the safe set', () => {
    const result = safeFileName('a<script>alert(1)</script>.png')
    expect(result).not.toMatch(/[<>()]/)
  })
})

describe('isAllowedImageUpload', () => {
  it('accepts common image extensions', () => {
    expect(isAllowedImageUpload('photo.png')).toBe(true)
    expect(isAllowedImageUpload('photo.jpg')).toBe(true)
    expect(isAllowedImageUpload('photo.webp')).toBe(true)
  })

  it('rejects executable/markup extensions', () => {
    expect(isAllowedImageUpload('payload.svg')).toBe(false)
    expect(isAllowedImageUpload('payload.html')).toBe(false)
    expect(isAllowedImageUpload('payload.php')).toBe(false)
  })

  it('rejects a mismatched MIME type even with an allowed extension', () => {
    expect(isAllowedImageUpload('photo.png', 'text/html')).toBe(false)
  })
})

describe('isAllowedDeliverableUpload', () => {
  it('accepts zip and rar archives', () => {
    expect(isAllowedDeliverableUpload('project.zip')).toBe(true)
    expect(isAllowedDeliverableUpload('project.rar')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isAllowedDeliverableUpload('project.exe')).toBe(false)
    expect(isAllowedDeliverableUpload('project.sh')).toBe(false)
  })
})
