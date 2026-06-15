'use client';

interface Props {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const pageSizes = [10, 25, 50];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Items per page:</span>
        {pageSizes.map((size) => (
          <button
            key={size}
            onClick={() => onPageSizeChange(size)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: pageSize === size ? 'var(--primary)' : 'var(--bg-light)',
              color: pageSize === size ? '#fff' : 'var(--text)',
              border: `1px solid ${pageSize === size ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: pageSize === size ? 500 : 400,
            }}
          >
            {size}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            backgroundColor: 'var(--bg-light)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          ◀
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              backgroundColor:
                currentPage === page ? 'var(--primary)' : page === '...' ? 'transparent' : 'var(--bg-light)',
              color: currentPage === page ? '#fff' : 'var(--text)',
              border: currentPage === page ? `1px solid var(--primary)` : `1px solid var(--border)`,
              borderRadius: '4px',
              cursor: page === '...' ? 'default' : 'pointer',
              fontWeight: currentPage === page ? 500 : 400,
              minWidth: page === '...' ? 'auto' : '32px',
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            backgroundColor: 'var(--bg-light)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
        >
          ▶
        </button>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Showing page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
