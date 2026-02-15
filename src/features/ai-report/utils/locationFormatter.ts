interface LocationLike {
  address: string;
  landmarkName?: string;
}

/**
 * 住所文字列は保持したまま、表示・説明用にランドマーク情報を付与する。
 */
export function formatLocationWithLandmark(
  location: LocationLike | null | undefined
): string {
  if (!location?.address) return '';
  const { address, landmarkName } = location;
  if (!landmarkName) return address;
  if (address.includes(`${landmarkName}付近`)) return address;
  return `${address}（${landmarkName}付近）`;
}
