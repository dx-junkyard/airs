import CsvReportParser from './CsvReportParser';

describe('CsvReportParser', () => {
  const parser = new CsvReportParser();

  const validHeader = '獣種,目撃日,目撃時刻,緯度,経度,住所,画像URL,説明文,電話番号';

  describe('parse - 正常系', () => {
    it('基本的なCSVを正しくパースできる', () => {
      const csv = [
        validHeader,
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,目撃情報,090-1234-5678',
      ].join('\n');

      const rows = parser.parse(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        animalType: 'サル',
        sightingDate: '2024-01-15',
        sightingTime: '10:30',
        hasOnlyDate: false,
        latitude: '35.6762',
        longitude: '139.6503',
        address: '東京都新宿区',
        imageUrl: '',
        description: '目撃情報',
        phoneNumber: '090-1234-5678',
      });
    });

    it('複数行をパースできる', () => {
      const csv = [
        validHeader,
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,',
        'シカ,2024-01-16,14:00,35.0116,135.7681,京都府京都市,,,',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].animalType).toBe('サル');
      expect(rows[1].animalType).toBe('シカ');
    });

    it('目撃時刻が空の場合 hasOnlyDate が true になる', () => {
      const csv = [
        validHeader,
        'クマ,2024-01-15,,35.6762,139.6503,東京都新宿区,,,',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows[0].hasOnlyDate).toBe(true);
      expect(rows[0].sightingTime).toBe('');
    });

    it('目撃時刻がある場合 hasOnlyDate が false になる', () => {
      const csv = [
        validHeader,
        'クマ,2024-01-15,09:00,35.6762,139.6503,東京都新宿区,,,',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows[0].hasOnlyDate).toBe(false);
      expect(rows[0].sightingTime).toBe('09:00');
    });

    it('BOM付きCSVを正しくパースできる', () => {
      const csv = '\uFEFF' + [
        validHeader,
        'イノシシ,2024-01-15,08:00,35.6762,139.6503,東京都新宿区,,,',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].animalType).toBe('イノシシ');
    });

    it('CR+LF改行を正しく処理できる', () => {
      const csv = [
        validHeader,
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,',
        'シカ,2024-01-16,14:00,35.0116,135.7681,京都府京都市,,,',
      ].join('\r\n');

      const rows = parser.parse(csv);
      expect(rows).toHaveLength(2);
    });

    it('ダブルクォートで囲まれたフィールドを正しくパースできる', () => {
      const csv = [
        validHeader,
        'サル,2024-01-15,10:30,35.6762,139.6503,"東京都新宿区,西新宿1-1",,,',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows[0].address).toBe('東京都新宿区,西新宿1-1');
    });

    it('ダブルクォート内のエスケープされたダブルクォートを処理できる', () => {
      const csv = [
        validHeader,
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都,,"""大きなサル""を目撃",',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows[0].description).toBe('"大きなサル"を目撃');
    });

    it('末尾の空行を無視する', () => {
      const csv = [
        validHeader,
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,',
        '',
        '',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows).toHaveLength(1);
    });

    it('フィールドの前後空白がトリムされる', () => {
      const csv = [
        validHeader,
        ' サル , 2024-01-15 , 10:30 , 35.6762 , 139.6503 , 東京都新宿区 , , , ',
      ].join('\n');

      const rows = parser.parse(csv);
      expect(rows[0].animalType).toBe('サル');
      expect(rows[0].sightingDate).toBe('2024-01-15');
      expect(rows[0].latitude).toBe('35.6762');
    });
  });

  describe('parse - 異常系', () => {
    it('空のCSVでエラーをスローする', () => {
      expect(() => parser.parse('')).toThrow('CSVファイルが空です');
    });

    it('空白のみのCSVでエラーをスローする', () => {
      expect(() => parser.parse('   \n  \n  ')).toThrow('CSVファイルが空です');
    });

    it('ヘッダーが不正な場合エラーをスローする', () => {
      const csv = '名前,日付,時刻,緯度,経度,住所,画像URL,説明文,電話番号\nデータ行';

      expect(() => parser.parse(csv)).toThrow('CSVヘッダーが不正です');
    });

    it('ヘッダーのみでデータ行がない場合、空配列を返す', () => {
      const rows = parser.parse(validHeader);
      expect(rows).toHaveLength(0);
    });

    it('フィールド数が少ない行でも欠損部分を空文字として処理する', () => {
      const csv = [validHeader, 'サル,2024-01-15'].join('\n');

      const rows = parser.parse(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].latitude).toBe('');
      expect(rows[0].address).toBe('');
    });
  });
});
