import AnimalTypeLabelResolver from './AnimalTypeLabelResolver';

describe('AnimalTypeLabelResolver', () => {
  const resolver = new AnimalTypeLabelResolver();

  describe('resolve - カタカナラベルからコード値', () => {
    it.each([
      ['サル', 'monkey'],
      ['シカ', 'deer'],
      ['イノシシ', 'wild_boar'],
      ['クマ', 'bear'],
      ['タヌキ', 'raccoon_dog'],
      ['キツネ', 'fox'],
      ['アナグマ', 'badger'],
      ['ハクビシン', 'masked_palm_civet'],
      ['ノウサギ', 'hare'],
      ['カモシカ', 'serow'],
      ['アライグマ', 'raccoon'],
      ['カラス', 'crow'],
      ['その他', 'other'],
    ])('"%s" → "%s"', (label, expectedCode) => {
      expect(resolver.resolve(label)).toBe(expectedCode);
    });
  });

  describe('resolve - コード値をそのまま返す', () => {
    it.each(['monkey', 'deer', 'wild_boar', 'bear', 'other'])(
      'コード値 "%s" はそのまま返る',
      (code) => {
        expect(resolver.resolve(code)).toBe(code);
      }
    );
  });

  describe('resolve - 無効な入力', () => {
    it('空文字列で undefined を返す', () => {
      expect(resolver.resolve('')).toBeUndefined();
    });

    it('空白のみで undefined を返す', () => {
      expect(resolver.resolve('   ')).toBeUndefined();
    });

    it('存在しないラベルで undefined を返す', () => {
      expect(resolver.resolve('ドラゴン')).toBeUndefined();
    });

    it('存在しないコード値で undefined を返す', () => {
      expect(resolver.resolve('dragon')).toBeUndefined();
    });
  });

  describe('resolve - 前後空白のトリミング', () => {
    it('前後に空白があるラベルを正しく解決する', () => {
      expect(resolver.resolve('  サル  ')).toBe('monkey');
    });

    it('前後に空白があるコード値を正しく解決する', () => {
      expect(resolver.resolve('  monkey  ')).toBe('monkey');
    });
  });
});
