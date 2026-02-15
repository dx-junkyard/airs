# アクセシビリティ実装パターン

## 基本原則（必須対応）

### 1. 文字情報との併用

画像のみに頼らず、必ず文字で内容を明記する。

### 2. 代替テキスト必須

すべての画像に`alt`属性を設定し、スクリーンリーダー利用者に内容が伝わるようにする。

### 3. 色だけで判断させない

状態やアクションを色のみで表現せず、形状やラベルも活用する。

## 代替テキストの書き方

### 不適切な例

```tsx
// ❌ 汎用的すぎる
<img src="illustration.svg" alt="イラスト" />

// ❌ 空のalt
<img src="illustration.svg" alt="" />

// ❌ 省略
<img src="illustration.svg" />
```

### 適切な例

```tsx
// ✅ 具体的な説明
<img
  src="illustration.svg"
  alt="スマートフォンで電子申請を行っている男性のイラスト"
/>

// ✅ 状況を説明
<img
  src="illustration.svg"
  alt="複数の人が協力してプロジェクトを進めているイラスト"
/>

// ✅ 装飾的な画像（意味がない場合のみ）
<img src="decoration.svg" alt="" aria-hidden="true" />
```

## アイコン実装パターン

### アイコン + ラベル（推奨）

```tsx
export function NavigationButton() {
  return (
    <button className="nav-button">
      <SearchIcon className="icon" aria-hidden="true" />
      <span>検索</span>
    </button>
  );
}
```

### アイコンのみ（必要な場合）

```tsx
export function IconOnlyButton() {
  return (
    <button
      className="icon-button"
      aria-label="検索"
      title="検索"
    >
      <SearchIcon aria-hidden="true" />
    </button>
  );
}
```

## 状態表現のアクセシビリティ

### 色だけでなく形状でも表現

```tsx
export function TabButton({
  isActive,
  label
}: {
  isActive: boolean;
  label: string;
}) {
  return (
    <button
      className={cn(
        "tab-button",
        isActive && "tab-button-active"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && <CheckIcon className="indicator" aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
```

## Next.js Image コンポーネントでの実装

### 基本パターン

```tsx
import Image from 'next/image';

export function ServiceIllustration() {
  return (
    <div className="illustration-container">
      <Image
        src="/illustration/service-overview.svg"
        alt="女性が役所のカウンターでマイナンバーカードを受け取っているイラスト"
        width={600}
        height={400}
        priority
      />
      <p className="description">
        マイナンバーカードは市区町村の窓口で受け取ることができます
      </p>
    </div>
  );
}
```

### 装飾的な画像

```tsx
export function DecorativeIllustration() {
  return (
    <div className="background-decoration">
      <Image
        src="/illustration/pattern.svg"
        alt=""
        aria-hidden="true"
        width={400}
        height={300}
      />
    </div>
  );
}
```

## チェックリスト

実装時に確認すべき項目:

- [ ] すべての意味のある画像に適切な`alt`属性を設定した
- [ ] 装飾的な画像には`alt=""`と`aria-hidden="true"`を設定した
- [ ] 画像だけでなく文字情報も併記した
- [ ] アイコンにはラベルを併用した（可能な限り）
- [ ] 色だけで状態を判断させていない
- [ ] キーボードのみで操作できる
- [ ] スクリーンリーダーで読み上げて内容が伝わる
