import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (limit: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}: PaginationProps) {

    // Calculate range of items shown
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                endPage = 4;
                startPage = 2;
            } else if (currentPage >= totalPages - 2) {
                startPage = totalPages - 3;
                endPage = totalPages - 1;
            }

            if (startPage > 2) {
                pages.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderTop: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--card))',
            fontSize: '0.9rem',
            color: 'hsl(var(--muted-foreground))'
        }}>
            {/* Left: Info & Limit Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span>
                    Affichage <strong>{Math.max(0, startItem)}</strong> - <strong>{Math.max(0, endItem)}</strong> sur <strong>{totalItems}</strong>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="limit-select" style={{ fontSize: '0.85rem' }}>Lignes :</label>
                    <select
                        id="limit-select"
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '0.3rem',
                            border: '1px solid hsl(var(--border))',
                            backgroundColor: 'hsl(var(--background))',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Right: Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.4rem',
                        borderRadius: '0.3rem',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: currentPage === 1 ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                        color: currentPage === 1 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    aria-label="Previous Page"
                >
                    <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', maxWidth: '100%' }}>
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={page === '...'}
                            style={{
                                minWidth: '2rem',
                                height: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.3rem',
                                border: page === currentPage
                                    ? '1px solid hsl(var(--primary))'
                                    : '1px solid transparent',
                                backgroundColor: page === currentPage
                                    ? 'hsl(var(--primary))'
                                    : 'transparent',
                                color: page === currentPage
                                    ? 'hsl(var(--primary-foreground))'
                                    : 'hsl(var(--foreground))',
                                cursor: page === '...' ? 'default' : 'pointer',
                                fontWeight: page === currentPage ? 'bold' : 'normal',
                                fontSize: '0.9rem',
                                flexShrink: 0
                            }}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.4rem',
                        borderRadius: '0.3rem',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: currentPage === totalPages || totalPages === 0 ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                        color: currentPage === totalPages || totalPages === 0 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                        cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    aria-label="Next Page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
