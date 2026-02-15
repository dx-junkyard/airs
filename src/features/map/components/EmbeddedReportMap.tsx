'use client';

import type { ReportDto } from '@/server/application/dtos/ReportDto';
import FullscreenReportMap from './FullscreenReportMap';

interface EmbeddedReportMapProps {
  reports: ReportDto[];
  height?: string;
  mapMode?: 'default' | 'timeline';
  interactionMode?: 'popup' | 'none';
  showClusterLayer?: boolean;
  showHeatmapLayer?: boolean;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  selectedReport?: ReportDto | null;
  onMarkerClick?: (report: ReportDto) => void;
  showLegend?: boolean;
  isPanelOpen?: boolean;
}

const EmbeddedReportMap = ({
  reports,
  height,
  mapMode = 'default',
  interactionMode = 'popup',
  showClusterLayer = true,
  showHeatmapLayer = true,
  initialCenter,
  initialZoom,
  selectedReport,
  onMarkerClick,
  showLegend = false,
  isPanelOpen = false,
}: EmbeddedReportMapProps) => {
  return (
    <FullscreenReportMap
      reports={reports}
      mapMode={mapMode}
      interactionMode={interactionMode}
      isIframe={true}
      height={height}
      showClusterLayer={showClusterLayer}
      showHeatmapLayer={showHeatmapLayer}
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      selectedReport={selectedReport}
      onMarkerClick={onMarkerClick}
      showLegend={showLegend}
      // allow caller to control panel open state (default: false)
      isPanelOpen={isPanelOpen}
    />
  );
};

export default EmbeddedReportMap;
