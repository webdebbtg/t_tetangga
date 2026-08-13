'use client'

import React from 'react'

interface PaginationProps {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    
    // Always show first page
    pages.push(1)
    
    // Calculate range around current page
    let start = Math.max(2, currentPage - 1)
    let end = Math.min(lastPage - 1, currentPage + 1)
    
    // Adjust range if at the edges
    if (currentPage === 1) {
      end = Math.min(lastPage - 1, 3)
    } else if (currentPage === lastPage) {
      start = Math.max(2, lastPage - 2)
    }
    
    if (start > 2) {
      pages.push('...')
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < lastPage - 1) {
      pages.push('...')
    }
    
    // Always show last page
    if (lastPage > 1) {
      pages.push(lastPage)
    }
    
    return pages
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid var(--gray-200)',
          background: 'white',
          color: currentPage === 1 ? 'var(--gray-400)' : 'var(--gray-700)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        Prev
      </button>

      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return <span key={`dots-${index}`} style={{ padding: '0 0.5rem', color: 'var(--gray-500)' }}>...</span>
        }

        const isCurrent = page === currentPage

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--gray-200)',
              background: isCurrent ? 'var(--primary-subtle)' : 'white',
              color: isCurrent ? 'var(--primary-dark)' : 'var(--gray-700)',
              fontWeight: isCurrent ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {page}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid var(--gray-200)',
          background: 'white',
          color: currentPage === lastPage ? 'var(--gray-400)' : 'var(--gray-700)',
          cursor: currentPage === lastPage ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem'
        }}
      >
        Next
      </button>
    </div>
  )
}
