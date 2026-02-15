/**
 * CSVパース結果の1行分のデータ
 */
export interface CsvReportRow {
  animalType: string;
  sightingDate: string;
  sightingTime: string;
  hasOnlyDate: boolean;
  latitude: string;
  longitude: string;
  address: string;
  imageUrl: string;
  description: string;
  phoneNumber: string;
}

/**
 * 期待するCSVヘッダー
 */
const EXPECTED_HEADERS = [
  '獣種',
  '目撃日',
  '目撃時刻',
  '緯度',
  '経度',
  '住所',
  '画像URL',
  '説明文',
  '電話番号',
];

/**
 * CSVフィールドをパースする（ダブルクォート対応）
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // エスケープされたダブルクォート
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * CsvReportParser
 *
 * CSV文字列をパースしてCsvReportRow配列を返す。
 * BOM対応、ダブルクォート対応。
 */
class CsvReportParser {
  /**
   * CSV文字列をパースする
   * @throws ヘッダーが不正な場合
   */
  parse(csvText: string): CsvReportRow[] {
    // BOM除去
    const text = csvText.replace(/^\uFEFF/, '');

    const lines = text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error('CSVファイルが空です');
    }

    // ヘッダー検証
    const headers = parseCSVLine(lines[0]);
    this.validateHeaders(headers);

    // データ行パース
    const rows: CsvReportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const sightingTime = (fields[2] ?? '').trim();
      rows.push({
        animalType: fields[0] ?? '',
        sightingDate: fields[1] ?? '',
        sightingTime,
        hasOnlyDate: sightingTime === '',
        latitude: fields[3] ?? '',
        longitude: fields[4] ?? '',
        address: fields[5] ?? '',
        imageUrl: fields[6] ?? '',
        description: fields[7] ?? '',
        phoneNumber: fields[8] ?? '',
      });
    }

    return rows;
  }

  private validateHeaders(headers: string[]): void {
    const missingHeaders = EXPECTED_HEADERS.filter(
      (expected, index) => headers[index] !== expected
    );

    if (missingHeaders.length > 0) {
      throw new Error(
        `CSVヘッダーが不正です。期待: ${EXPECTED_HEADERS.join(',')}。取得: ${headers.join(',')}`
      );
    }
  }
}

export default CsvReportParser;
