'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { aiSelectedPointAtom } from '@/features/analysis/atoms/analysisAtoms';

interface MarkdownTableProps {
  children: React.ReactNode;
}

export const MarkdownTable: React.FC<MarkdownTableProps> = ({ children }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const setAiSelectedPoint = useSetAtom(aiSelectedPointAtom);

  const handleDownloadCsv = useCallback(() => {
    if (!tableRef.current) return;

    const parseLatLngFromUrl = (rawUrl: string | null) => {
      if (!rawUrl) return null;
      try {
        const url = new URL(rawUrl, window.location.origin);
        const latParam = url.searchParams.get('lat');
        const lngParam = url.searchParams.get('lng');
        if (latParam && lngParam) {
          const lat = parseFloat(latParam);
          const lng = parseFloat(lngParam);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            return { lat, lng };
          }
        }

        const centerParam = url.searchParams.get('center');
        if (centerParam) {
          const [latText, lngText] = centerParam.split(',');
          const lat = parseFloat(latText);
          const lng = parseFloat(lngText);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            return { lat, lng };
          }
        }
      } catch (error) {
        return null;
      }
      return null;
    };

    const extractCoordsFromRow = (row: Element) => {
      // Try finding links first
      const links = Array.from(row.querySelectorAll('a'));
      for (const link of links) {
        const coords = parseLatLngFromUrl(link.getAttribute('href'));
        if (coords) return coords;
      }
      // Then check cell text (if full URL is in text)
      const cells = Array.from(row.querySelectorAll('th, td'));
      for (const cell of cells) {
        const text = (cell.textContent || '').trim();
        if (!text) continue;
        const coords = parseLatLngFromUrl(text);
        if (coords) return coords;
      }
      return null;
    };

    const rows = tableRef.current.querySelectorAll('tr');
    const csvRows: string[] = [];
    let hasExtractedCoords = false;

    // Pre-check if any row has extractable coordinates to decide if we add headers
    const bodyRows = tableRef.current.querySelectorAll('tbody tr');
    for (const row of Array.from(bodyRows)) {
      if (extractCoordsFromRow(row)) {
        hasExtractedCoords = true;
        break;
      }
    }

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('th, td');
      const rowData: string[] = [];
      const isHeader = rowIndex === 0 || row.closest('thead') !== null;

      cells.forEach((cell) => {
        // セルのテキストを取得し、CSVエスケープ
        let cellText = cell.textContent || '';
        // ダブルクォートをエスケープ
        cellText = cellText.replace(/"/g, '""');
        // カンマや改行を含む場合はダブルクォートで囲む
        if (
          cellText.includes(',') ||
          cellText.includes('\n') ||
          cellText.includes('"')
        ) {
          cellText = `"${cellText}"`;
        }
        rowData.push(cellText);
      });

      if (hasExtractedCoords) {
        if (isHeader) {
          rowData.push('"latitude"');
          rowData.push('"longitude"');
        } else {
          const coords = extractCoordsFromRow(row);
          rowData.push(coords ? String(coords.lat) : '');
          rowData.push(coords ? String(coords.lng) : '');
        }
      }

      csvRows.push(rowData.join(','));
    });

    const csvContent = csvRows.join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_data_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // テーブル行クリックで選択地点を設定する（よりシンプルな動作）
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const normalize = (s: string) =>
      (s || '').toLowerCase().replace(/[^0-9a-zA-Z\u4e00-\u9fff]+/g, '');

    const getHeaders = () => {
      const headerCells = table.querySelectorAll('thead th');
      if (headerCells && headerCells.length > 0) {
        return Array.from(headerCells).map((h) => (h.textContent || '').trim());
      }
      const firstRow = table.querySelector('tr');
      if (!firstRow) return [];
      return Array.from(firstRow.querySelectorAll('th, td')).map((h) =>
        (h.textContent || '').trim()
      );
    };

    const parseLatLngFromUrl = (rawUrl: string | null) => {
      if (!rawUrl) return null;
      try {
        const url = new URL(rawUrl, window.location.origin);
        const latParam = url.searchParams.get('lat');
        const lngParam = url.searchParams.get('lng');
        if (latParam && lngParam) {
          const lat = parseFloat(latParam);
          const lng = parseFloat(lngParam);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            return { lat, lng };
          }
        }

        const centerParam = url.searchParams.get('center');
        if (centerParam) {
          const [latText, lngText] = centerParam.split(',');
          const lat = parseFloat(latText);
          const lng = parseFloat(lngText);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            return { lat, lng };
          }
        }
      } catch (error) {
        return null;
      }
      return null;
    };

    const findLatLngInRow = (row: HTMLElement) => {
      const links = Array.from(row.querySelectorAll('a'));
      for (const link of links) {
        const coords = parseLatLngFromUrl(link.getAttribute('href'));
        if (coords) return coords;
      }

      const cells = Array.from(row.querySelectorAll('th, td'));
      for (const cell of cells) {
        const text = (cell.textContent || '').trim();
        if (!text) continue;
        const coords = parseLatLngFromUrl(text);
        if (coords) return coords;
      }

      return null;
    };

    const baseHeaders = getHeaders();
    const normalizedHeaders = baseHeaders.map((h) => normalize(h));
    const linkHeaderIndex = normalizedHeaders.findIndex((h) =>
      [
        'map',
        'link',
        'permalink',
        'geo',
        'location',
        '地図',
        '位置',
        '場所',
      ].includes(h)
    );

    if (linkHeaderIndex !== -1) {
      const rows = table.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('th, td');
        const cell = cells[linkHeaderIndex];
        if (cell) cell.classList.add('hidden');
      });
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tr = target.closest('tr');
      if (!tr) return;

      const headers = baseHeaders.length
        ? baseHeaders
        : Array.from(tr.querySelectorAll('th, td')).map((h) =>
            (h.textContent || '').trim()
          );

      const cells = Array.from(tr.querySelectorAll('th, td')).map((c) =>
        (c.textContent || '').trim()
      );

      // 1. Try to find coordinates in any URL within the row (highest priority)
      const urlCoords = findLatLngInRow(tr as HTMLElement);
      if (urlCoords) {
        const props: Record<string, any> = {};
        headers.forEach((h, i) => (props[h] = cells[i] ?? null));
        setAiSelectedPoint({
          lat: urlCoords.lat,
          lng: urlCoords.lng,
          properties: props,
        });
        return;
      }

      // 2. Fallback: find numeric candidates within this row
      const numeric = cells
        .map((v, i) => ({ v: parseFloat(v), i }))
        .filter((x) => !Number.isNaN(x.v) && isFinite(x.v));
      const latCandidate = numeric.find((n) => n.v >= -90 && n.v <= 90);
      const lngCandidate = numeric.find(
        (n) =>
          n.v >= -180 && n.v <= 180 && (!latCandidate || n.i !== latCandidate.i)
      );

      if (latCandidate && lngCandidate) {
        const lat = latCandidate.v;
        const lng = lngCandidate.v;
        const props: Record<string, any> = {};
        headers.forEach((h, i) => (props[h] = cells[i] ?? null));
        setAiSelectedPoint({ lat, lng, properties: props });
      }
    };

    table.addEventListener('click', onClick);
    return () => table.removeEventListener('click', onClick);
  }, [setAiSelectedPoint]);

  return (
    <div
      className={`
        mb-2
        last:mb-0
      `}
    >
      <div className="mb-1 flex justify-end">
        <button
          type="button"
          onClick={handleDownloadCsv}
          className={`
            flex items-center gap-1 rounded bg-solid-gray-100 px-2 py-1 text-xs
            text-solid-gray-600 transition-colors
            hover:bg-solid-gray-200
          `}
        >
          <FontAwesomeIcon icon={faDownload} className="size-3" />
          CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table
          ref={tableRef}
          className="min-w-full border-collapse border border-solid-gray-300"
        >
          {children}
        </table>
      </div>
    </div>
  );
};

export default MarkdownTable;
