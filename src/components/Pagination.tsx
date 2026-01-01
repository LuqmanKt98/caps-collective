'use client';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = '',
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Don't show pagination if there's only one page or no items
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex items-center justify-between ${className}`}>
            {/* Results info */}
            <div className="text-sm text-[#00245D]/60">
                Showing <span className="font-semibold text-[#00245D]">{startItem}</span> to{' '}
                <span className="font-semibold text-[#00245D]">{endItem}</span> of{' '}
                <span className="font-semibold text-[#00245D]">{totalItems}</span> results
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl disabled:hover:bg-white/95"
                >
                    ← Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                        if (page === '...') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-3 py-2 text-[#00245D]/60"
                                >
                                    ...
                                </span>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page as number)}
                                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${currentPage === page
                                        ? 'bg-[#00245D] text-white shadow-xl'
                                        : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl disabled:hover:bg-white/95"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
