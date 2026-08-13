'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle, isDark } = useTheme()

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      style={{
        width: 38, height: 38,
        border: '1.5px solid var(--gray-200)',
        borderRadius: 10,
        background: isDark ? '#334155' : 'white',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.125rem',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
