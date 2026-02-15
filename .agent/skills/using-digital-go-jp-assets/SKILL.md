---
name: using-digital-go-jp-assets
description: Guide for using Digital Agency Japan's illustration and icon assets with proper accessibility and licensing. Use when implementing illustrations/icons from digital.go.jp design system, ensuring proper alt text, screen reader support, and attribution. Covers (1) Implementing illustrations (large/medium/small), (2) Using service/system icons with labels, (3) Ensuring accessibility (alt text, ARIA), (4) Following license requirements (attribution for edited assets).
---

# デジタル庁アセット活用ガイド

デジタル庁が提供するイラスト・アイコン素材を適切に活用するためのガイド。

## アセットの場所

このプロジェクトでは、デジタル庁のアセットファイルは以下の場所に配置されています:

- **アイコン**: `public/icon/` - デジタル庁のアイコンファイル（SVG）
- **イラスト**: `public/illustration/` - デジタル庁のイラストファイル（SVG）

実装時は、これらのディレクトリ内のファイルを参照してください。

## 必須原則（すべての実装で守る）

### 1. アクセシビリティは必須

- すべての意味のある画像に`alt`属性を設定
- 画像だけでなく文字情報も併記
- 色だけで判断させず、形状やラベルも活用

### 2. そのまま使用は自由、編集時は出典明記

- **そのまま使用**: 出典不要、商用・非商用問わず自由
- **編集・加工**: 出典と編集内容を明記

### 3. ベクターデータ（SVG）推奨

- 縦横比を保持
- 視認性を確保

## イラストレーション実装

### 基本パターン

```tsx
import Image from 'next/image';

// ヒーローセクション（イラスト大）
export function HeroSection() {
  return (
    <section>
      <div>
        <h1>オンライン申請サービス</h1>
        <p>自宅から簡単に行政手続きができます</p>
      </div>
      <Image
        src="/illustration/online-service.svg"
        alt="パソコンとスマートフォンを使ってオンライン申請を行う人々のイラスト"
        width={800}
        height={600}
        priority
      />
    </section>
  );
}

// 手順説明（イラスト中）
export function StepGuide() {
  return (
    <div className="step">
      <Image
        src="/illustration/step-1.svg"
        alt="フォームに情報を入力している人のイラスト"
        width={400}
        height={300}
      />
      <h3>Step 1: アカウント作成</h3>
      <p>メールアドレスを登録してアカウントを作成します</p>
    </div>
  );
}

// 装飾的な画像
export function DecorativePattern() {
  return (
    <Image
      src="/illustration/pattern.svg"
      alt=""
      aria-hidden="true"
      width={400}
      height={300}
    />
  );
}
```

### 禁止事項

- 縦横比の変更（歪んで見える）
- 判読できないほど小さい表示

## アイコン実装

### アイコン + ラベル（推奨）

```tsx
// ナビゲーション
export function ServiceNav() {
  return (
    <nav>
      <Link href="/apply">
        <DocumentIcon aria-hidden="true" />
        <span>申請</span>
      </Link>
      <Link href="/inquiry">
        <SearchIcon aria-hidden="true" />
        <span>照会</span>
      </Link>
    </nav>
  );
}

// ボタン
export function SearchButton() {
  return (
    <button>
      <SearchIcon aria-hidden="true" />
      <span>検索</span>
    </button>
  );
}
```

### アイコンのみ（必要な場合）

```tsx
export function IconButton() {
  return (
    <button
      aria-label="検索"
      title="検索"
    >
      <SearchIcon aria-hidden="true" />
    </button>
  );
}
```

### 状態表現（色 + 形状）

```tsx
export function TabButton({ isActive, label }: Props) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={isActive ? "active" : ""}
    >
      {isActive && <CheckIcon aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
```

## ライセンスと出典表記

### そのまま使用（出典不要）

```tsx
<Image
  src="/icon/search.svg"
  alt="検索"
  width={24}
  height={24}
/>
```

### 編集・加工した場合（出典必須）

```tsx
export function CustomIllustration() {
  return (
    <div>
      <Image
        src="/custom/modified-illustration.svg"
        alt="カスタマイズされたサービス説明イラスト"
        width={600}
        height={400}
      />
      <p className="text-xs text-gray-500">
        「イラストレーション・アイコン素材」（デジタル庁）
        （https://www.digital.go.jp/policies/servicedesign/designsystem/）を元に、
        当社サービスに合わせて独自に編集して提供しています
      </p>
    </div>
  );
}
```

## 推奨外部アイコンソース

デジタル庁アイコンで不足する場合:

- **Web/Android**: Material Symbols (Weight 300推奨)
- **iOS**: SF Symbols

## 詳細リファレンス

必要に応じて以下を参照:

- **ガイドライン詳細**: [references/guidelines.md](references/guidelines.md) - イラスト種類、アイコン種類、実装上の注意
- **ライセンス詳細**: [references/license.md](references/license.md) - 著作権、出典記載ルール、テンプレート
- **アクセシビリティ詳細**: [references/accessibility.md](references/accessibility.md) - 代替テキストパターン、実装チェックリスト
