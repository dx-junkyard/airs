import SqlSecurityService from './SqlSecurityService';

describe('SqlSecurityService', () => {
  const service = new SqlSecurityService();

  describe('validate', () => {
    it('許可されたテーブルへの通常クエリを許可する', () => {
      const result = service.validate(
        'SELECT id, "createdAt" FROM reports WHERE "deletedAt" IS NULL'
      );

      expect(result.isValid).toBe(true);
      expect(result.sanitizedSql).toContain('LIMIT 1000');
    });

    it('EXTRACT(... FROM "createdAt") をテーブル名として誤検知しない', () => {
      const result = service.validate(
        'SELECT EXTRACT(EPOCH FROM "createdAt") AS epoch FROM reports WHERE "deletedAt" IS NULL'
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('未許可テーブルを直接参照した場合は拒否する', () => {
      const result = service.validate('SELECT * FROM secrets');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('secrets');
    });

    it('サブクエリ内の未許可テーブル参照も拒否する', () => {
      const result = service.validate(
        'SELECT id FROM reports WHERE EXISTS (SELECT 1 FROM secrets)'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('secrets');
    });

    it('スキーマ修飾の許可テーブル参照を許可する', () => {
      const result = service.validate(
        'SELECT * FROM "public"."reports" WHERE "deletedAt" IS NULL'
      );

      expect(result.isValid).toBe(true);
    });
  });
});
