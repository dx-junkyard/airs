import PasswordService from './PasswordService';

describe('PasswordService', () => {
  const service = new PasswordService();

  describe('generate', () => {
    it('4文字のパスワードを生成する', () => {
      const password = service.generate();
      expect(password).toHaveLength(4);
    });

    it('英大文字と数字のみで構成される', () => {
      for (let i = 0; i < 50; i++) {
        const password = service.generate();
        expect(password).toMatch(/^[A-Z0-9]{4}$/);
      }
    });

    it('毎回異なるパスワードを生成する（確率的テスト）', () => {
      const passwords = new Set(
        Array.from({ length: 20 }, () => service.generate())
      );
      // 20回生成して全て同じになる確率は実質0
      expect(passwords.size).toBeGreaterThan(1);
    });
  });

  describe('hash', () => {
    it('SHA-256のhex文字列（64文字）を返す', () => {
      const hash = service.hash('TEST');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('同じ入力に対して同じハッシュを返す', () => {
      const hash1 = service.hash('AB12');
      const hash2 = service.hash('AB12');
      expect(hash1).toBe(hash2);
    });

    it('異なる入力に対して異なるハッシュを返す', () => {
      const hash1 = service.hash('AB12');
      const hash2 = service.hash('CD34');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('正しいパスワードで true を返す', () => {
      const password = 'AB12';
      const hashed = service.hash(password);
      expect(service.verify(password, hashed)).toBe(true);
    });

    it('間違ったパスワードで false を返す', () => {
      const hashed = service.hash('AB12');
      expect(service.verify('XY99', hashed)).toBe(false);
    });

    it('generate→hash→verify の一連のフローが機能する', () => {
      const password = service.generate();
      const hashed = service.hash(password);
      expect(service.verify(password, hashed)).toBe(true);
      expect(service.verify('ZZZZ', hashed)).toBe(false);
    });

    it('不正なハッシュ長で false を返す', () => {
      expect(service.verify('AB12', 'shorthash')).toBe(false);
    });
  });
});
