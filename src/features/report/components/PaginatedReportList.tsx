import SearchResultCount from '@/components/ui/Search/SearchResultCount';
import Pagination from '@/components/ui/Pagination/Pagination';
import PaginationFirst from '@/components/ui/Pagination/PaginationFirst';
import PaginationPrev from '@/components/ui/Pagination/PaginationPrev';
import PaginationNext from '@/components/ui/Pagination/PaginationNext';
import PaginationLast from '@/components/ui/Pagination/PaginationLast';
import PaginationCurrent from '@/components/ui/Pagination/PaginationCurrent';
import ReportList from './ReportList';
import type { ReportDto } from '@/server/application/dtos/ReportDto';

interface PaginatedReportListProps {
  reports: ReportDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  /** SearchResultCountのプレフィックス（デフォルト: "検索結果:"） */
  countPrefix?: string;
}

export default function PaginatedReportList({
  reports,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  countPrefix,
}: PaginatedReportListProps) {
  return (
    <div className="space-y-6">
      <SearchResultCount count={totalCount} prefix={countPrefix} />
      <ReportList reports={reports} />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationFirst
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            />
            <PaginationPrev
              onClick={() => {
                onPageChange(currentPage - 1);
              }}
              disabled={currentPage === 1}
            />
            <PaginationCurrent current={currentPage} max={totalPages} onPageChange={onPageChange} />
            <PaginationNext
              onClick={() => {
                onPageChange(currentPage + 1);
              }}
              disabled={currentPage === totalPages}
            />
            <PaginationLast
              onClick={() => {
                onPageChange(totalPages);
              }}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
}
