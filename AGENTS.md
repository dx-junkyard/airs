# AIRS - 野生動物目撃通報AI管理システム アーキテクチャガイド

## プロジェクト概要

野生動物（サル、シカ、イノシシ、クマなど）の目撃・通報をAIで効率的に管理する統合プラットフォーム。LINEからの通報に対応し、DDD（ドメイン駆動設計）とクリーンアーキテクチャに基づいたNext.js 16アプリケーション。政府デジタル庁のデザインシステムを採用し、エンタープライズグレードのWebアプリケーション開発をサポートします。

## 技術スタック

### コア技術

- **Next.js 16** - App Router、Server Actions、React 19
- **TypeScript 5** - 型安全性
- **TanStack Query v5** - データ同期とサーバーミューテーション
- **Vercel AI SDK** - ストリーミングチャット、ツール使用
- **Google Gemini** - 分析AI機能（自然言語→SQL変換）
- **React Hot Toast** - トースト通知

### UI/スタイリング

- **Tailwind CSS 4** - ユーティリティファーストCSS
- **Digital Agency Design System** - 政府標準アクセシブルコンポーネント
- **HeroUI (NextUI)** - UIコンポーネントライブラリ
- **Framer Motion** - アニメーション
- **Font Awesome** - アイコン
- **Leaflet / React Leaflet** - GIS地図表示（詳細は [GIS.md](GIS.md) 参照）
- **Recharts** - チャート・グラフ
- **React Markdown** - Markdown表示（AI応答用）

### 状態管理/データフェッチ

- **TanStack Query** - サーバー状態管理（データフェッチ、ミューテーション）
- **Jotai** - クライアント状態管理（グローバルUI状態、フォーム状態）
- **nuqs** - URL クエリ状態管理

### データベース/ストレージ

- **Prisma** - ORM（PostgreSQL）
- **Vercel Blob** - 画像ストレージ

### 開発ツール

- **Storybook 10** - コンポーネント開発環境
- **ESLint 9** - 静的解析
- **Prettier** - コードフォーマッター
- **Stylelint** - スタイル検証
- **Husky + lint-staged** - Git フック

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (src/app, src/features, src/hooks)     │
├─────────────────────────────────────────┤
│       Application Layer                 │
│  (src/server/application)               │
├─────────────────────────────────────────┤
│         Domain Layer                    │
│  (src/server/domain)                    │
├─────────────────────────────────────────┤
│      Infrastructure Layer               │
│  (src/server/infrastructure)            │
└─────────────────────────────────────────┘
```

### 1. Presentation Layer（プレゼンテーション層）

#### `src/app/` - Next.js App Router

- ページルーティング
- レイアウト定義
- Server Components
- Client Components（'use client'）

#### `src/features/` - 機能モジュール

各機能ごとにディレクトリを分割：

- `actions.ts` - Server Actions（create, update, delete, get等）
- `components/` - 機能固有のUIコンポーネント
- `forms/` - Jotaiベースのフォーム定義
- `atoms/` - Jotai atom定義（機能固有）
- `hooks/` - 機能固有のカスタムフック
- `types/` - 機能固有の型定義
- `utils/` - 機能固有のユーティリティ

**例：**

```
src/features/report/
├── actions.ts              # Server Actions
├── components/
│   ├── ReportDashboard.tsx
│   ├── MapLegend.tsx       # 地図凡例（共通）
│   └── timeline/               # タイムライン関連
│       ├── TimelineLayer.tsx   # Leaflet.timelineレイヤー
│       └── index.ts
├── constants/              # animalMarkerConfig等
├── types/
│   └── timeline.ts         # タイムライン用型定義
├── utils/
│   ├── geoJsonConverter.ts # ReportDto→GeoJSON変換
│   └── clusterIconUtils.ts # マーカークラスター用
└── forms/
    └── reportFormAtoms.ts

src/features/map/           # GIS地図機能（詳細は GIS.md 参照）
├── components/
│   ├── FullscreenReportMap.tsx  # 統合地図コンポーネント
│   ├── MapPage.tsx              # 地図ページ（iframe対応）
│   └── MapLayerPanel.tsx        # レイヤーフィルターパネル

src/features/line-verify/
├── actions.ts              # AI獣害通報用Server Actions
├── atoms/                  # チャット状態管理
├── components/
│   └── chat/               # チャットUI
├── hooks/                  # シミュレーター用フック
├── types/                  # 型定義
└── utils/                  # ユーティリティ

src/features/analysis/      # AIデータ分析機能
├── atoms/                  # analysisAtoms.ts（チャット状態）
├── components/
│   ├── chat/               # AnalysisChatContainer, AnalysisChatMessageList等
│   │   ├── messages/       # BotTextBubble, BotTableBubble, UserQueryBubble
│   │   └── shared/         # BotAvatar, TypingIndicator
│   └── results/            # DataTable.tsx（SQLクエリ結果表示）
├── hooks/                  # useAnalysisChat.ts
├── types/                  # AnalysisMessage, SqlQueryResult, ToolInvocation
└── utils/                  # dataDictionary.ts（システムプロンプト）

src/features/dashboard/
└── components/
    ├── StatisticsDashboard.tsx
    ├── BarChart.tsx
    ├── TrendChart.tsx
    └── StatCard.tsx
```

**注**: GIS（地図）機能の詳細は [GIS.md](GIS.md) を参照してください。

#### `src/hooks/` - カスタムフック

- `mutations/` - TanStack Query Mutationフック
  - `useCreateReport.ts` - 通報作成
  - `useUpdateReport.ts` - 通報更新
  - `useDeleteReport.ts` - 通報削除
  - `useLineVerifyReport.ts` - LINE検証通報
  - `useReverseGeocode.ts` - 逆ジオコーディング
- `forms/` - Jotaiベースのフォーム管理フック

#### `src/components/` - 共通UIコンポーネント

- `ui/` - Digital Agency Design System コンポーネント
- `ui/Chat/` - 統合チャットUIコンポーネント
  - `BotAvatar/` - ボットアバター表示
  - `ChatBubble/` - メッセージバブル（ボット/ユーザー）
  - `ChatContainer/` - チャットコンテナ
  - `ChatMessageList/` - メッセージリスト（自動スクロール）
  - `TypingIndicator/` - タイピングインジケーター
  - `ScrollToBottomButton/` - 最下部スクロールボタン
  - `styles.ts` - 共有スタイル定義
- `layout/` - レイアウトコンポーネント（AppLayout, Sidebar, SidebarNavItem）

### 2. Application Layer（アプリケーション層）

#### `src/server/application/`

**use-cases/report/** - ユースケース実装
ビジネスロジックのオーケストレーション：

```typescript
// CreateReportUseCase.ts
class CreateReportUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(dto: CreateReportDto): Promise<ReportDto> {
    const report = ReportMapper.fromCreateDto(dto);
    const saved = await this.repository.save(report);
    return ReportMapper.toDto(saved);
  }
}

export default CreateReportUseCase;
```

**実装済みユースケース:**

- `CreateReportUseCase.ts` - 通報作成
- `UpdateReportUseCase.ts` - 通報更新
- `DeleteReportUseCase.ts` - 通報削除
- `GetReportUseCase.ts` - 通報取得
- `GetReportsUseCase.ts` - 通報一覧取得
- `SearchReportsUseCase.ts` - 通報検索
- `FilterReportsByStatusUseCase.ts` - ステータスでフィルタ
- `FilterReportsByAnimalTypeUseCase.ts` - 動物種別でフィルタ
- `GetReportStatisticsUseCase.ts` - 統計情報取得

**dtos/** - Data Transfer Objects
レイヤー間のデータ転送用：

- `ReportDto.ts` - 読み取り用DTO
- `CreateReportDto.ts` - 作成用DTO
- `UpdateReportDto.ts` - 更新用DTO
- `ReportStatisticsDto.ts` - 統計用DTO

### 3. Domain Layer（ドメイン層）

#### `src/server/domain/`

**models/** - エンティティ
ビジネスロジックとルールを保持：

```typescript
class Report {
  private constructor(private props: ReportProps) {
    this.validate();
  }

  static createNew(params: CreateParams): Report {
    // ビジネスルール検証
    if (!params.animalType) {
      throw new Error('動物種別は必須です');
    }
    return new Report({...});
  }
}

export default Report;
```

**実装済みモデル:**

- `Report.ts` - 通報エンティティ
- `ReportId.ts` - 通報ID値オブジェクト

**value-objects/** - 値オブジェクト
不変の値とバリデーション：

- `Address.ts` - 住所
- `AnimalType.ts` - 動物種別（monkey, deer, wild_boar, bear, other）
- `DateRange.ts` - 日付範囲
- `Email.ts` - メールアドレス検証
- `ImageUrl.ts` - 画像URL
- `ImageUrls.ts` - 画像URL配列
- `Location.ts` - 緯度経度
- `PhoneNumber.ts` - 電話番号検証
- `ReportStatus.ts` - ステータス（waiting, in_progress, completed）
- `Tag.ts` - タグ

**repositories/** - リポジトリインターフェース
データアクセスの抽象化：

```typescript
export interface IReportRepository {
  save(report: Report): Promise<Report>;
  findById(id: ReportId): Promise<Report | null>;
  findAll(): Promise<Report[]>;
  delete(id: ReportId): Promise<void>;
  search(query: string): Promise<Report[]>;
  findByStatus(status: ReportStatus): Promise<Report[]>;
  findByAnimalType(animalType: AnimalType): Promise<Report[]>;
}
```

**services/** - ドメインサービス
複数エンティティにまたがるロジック：

- `SqlSecurityService.ts` - SQLインジェクション防止
- `StatisticsService.ts` - 統計計算

**constants/** - ドメイン定数

- `animalTypes.ts` - 動物種別の定義（ラベル、色、マーカー設定）

### 4. Infrastructure Layer（インフラ層）

#### `src/server/infrastructure/`

**repositories/** - リポジトリ実装

```typescript
// PrismaReportRepository.ts
class PrismaReportRepository implements IReportRepository {
  async save(report: Report): Promise<Report> {
    const data = ReportMapper.toPersistence(report);
    const saved = await prisma.report.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
    return ReportMapper.toDomain(saved);
  }
}

export default PrismaReportRepository;
```

**実装済みリポジトリ:**

- `PrismaReportRepository.ts` - PostgreSQL経由のReport永続化
- `VercelBlobImageRepository.ts` - Vercel Blobへの画像アップロード
- `SqlQueryExecutor.ts` - 分析機能用SQLクエリ実行

**database/** - データベース設定

- `prisma.ts` - Prismaクライアントインスタンス

**mappers/** - データ変換

- `ReportMapper.ts` - ドメインモデル ↔ DTO ↔ Prismaモデル

**di/** - 依存性注入

```typescript
class DIContainer {
  static getReportRepository(): IReportRepository {
    return new PrismaReportRepository();
  }
}

export default DIContainer;
```

**cache/** - キャッシュ管理

- `query-keys.ts` - TanStack Query キーの型安全定義

**ai/** - AI統合

- `config/geminiConfig.ts` - Google Geminiモデル設定
- `tools/runSqlTool.ts` - SQL実行ツール（分析AI用）

### 5. 共通機能

#### `src/features/common/`

- `notifications/toast.ts` - トースト通知ヘルパー

## データベーススキーマ

```prisma
// prisma/schema.prisma
model Report {
  id                 String    @id @default(cuid())
  animalType         String    // enum: monkey, deer, wild_boar, bear, other
  latitude           Float
  longitude          Float
  address            String
  normalizedAddress  Json?     // 正規化住所 { prefecture, city, oaza, aza, detail, full, areaKey }
  phoneNumber        String?
  imageUrls          String[]  // PostgreSQL array type
  description        String?
  status             String    // enum: waiting, in_progress, completed
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?

  @@index([deletedAt])
  @@index([status])
  @@index([animalType])
  @@map("reports")
}
```

## データフロー

### 作成フロー（Create）

```
1. User Input
   ↓
2. Form Component (src/app/report/new/page.tsx)
   - FormData作成
   - useCreateReport() フック呼び出し
   ↓
3. Mutation Hook (src/hooks/mutations/useCreateReport.ts)
   - useMutation でラップ
   - Server Action呼び出し
   ↓
4. Server Action (src/features/report/actions.ts)
   - FormData → CreateReportDto 変換
   - Use Case実行
   - revalidatePath() でキャッシュ無効化
   ↓
5. Use Case (src/server/application/use-cases/report/CreateReportUseCase.ts)
   - DTO → Domain Model 変換（Mapper経由）
   - Repository呼び出し
   ↓
6. Repository (src/server/infrastructure/repositories/PrismaReportRepository.ts)
   - Prisma経由でPostgreSQLに永続化
   ↓
7. Response
   - Domain Model → DTO 変換
   - クライアントへ返却
   ↓
8. Mutation Hook Success Handler
   - キャッシュ無効化（queryClient.invalidateQueries）
   - 成功トースト表示
   - ページ遷移
```

## TanStack Query 統合

### Mutation フック構造

```typescript
// src/hooks/mutations/useCreateReport.ts
export function useCreateReport() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await createReport(formData);
    },
    onSuccess: (data: ReportDto) => {
      // キャッシュ無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });

      // 成功通知
      showSuccessToast('通報を登録しました');

      // ページ遷移
      router.push(`/report/${data.id}`);
    },
    onError: (error: Error) => {
      showErrorToast(error.message);
    },
  });
}
```

### キャッシュキー管理

```typescript
// src/server/infrastructure/cache/query-keys.ts
export const queryKeys = {
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.reports.all, 'search', query] as const,
    filterByStatus: (status: string) =>
      [...queryKeys.reports.all, 'status', status] as const,
    filterByAnimalType: (animalType: string) =>
      [...queryKeys.reports.all, 'animalType', animalType] as const,
    statistics: () => [...queryKeys.reports.all, 'statistics'] as const,
  },
} as const;
```

## Jotai フォーム管理

Jotaiを使用したフォーム状態管理システム。フィールド単位のatomで再レンダリングを最適化し、リアルタイムバリデーションを提供。

### ファイル構成

```
src/
├── hooks/forms/
│   ├── core/
│   │   ├── types.ts           # 型定義
│   │   ├── validation.ts      # バリデーションユーティリティ
│   │   └── createFormAtoms.ts # atomファクトリ
│   ├── useJotaiForm.ts        # フォーム全体フック
│   └── useJotaiFormField.ts   # フィールド単位フック
└── features/
    └── [feature]/forms/
        └── [feature]FormAtoms.ts  # フォーム定義
```

### フォーム定義の作成

```typescript
// src/features/report/forms/reportFormAtoms.ts
import { createFormAtoms } from '@/hooks/forms/core/createFormAtoms';
import type { FormSchema, FormValues } from '@/hooks/forms/core/types';
import { rules } from '@/hooks/forms/core/validation';

// 1. フォーム値の型定義（FormValuesを継承）
export interface ReportFormValues extends FormValues {
  animalType: string;
  latitude: number;
  longitude: number;
  address: string;
  phoneNumber: string;
  description: string;
}

// 2. スキーマ定義
const reportFormSchema: FormSchema<ReportFormValues> = {
  animalType: {
    name: 'animalType',
    defaultValue: '',
    rules: [rules.required('動物種別は必須です')],
  },
  // ...
};

// 3. atom群を生成（型パラメータを明示的に指定）
export const reportFormAtoms =
  createFormAtoms<ReportFormValues>(reportFormSchema);

// 4. バリデーションルールをエクスポート
export const reportValidationRules = {
  animalType: reportFormSchema.animalType.rules ?? [],
  // ...
};
```

### バリデーションルール

```typescript
import { rules } from '@/hooks/forms/core/validation';

// 組み込みルール
rules.required('必須項目です');
rules.email('有効なメールアドレスを入力してください');
rules.minLength(5, '5文字以上で入力してください');
rules.maxLength(100, '100文字以内で入力してください');
rules.pattern(/^\d+$/, '数字のみ入力してください');

// カスタムルール
rules.custom((value) => value > 0, '0より大きい値を入力してください');
```

### フォームページでの使用

```typescript
'use client';

import {
  reportFormAtoms,
  reportValidationRules,
  type ReportFormValues,
} from '@/features/report/forms/reportFormAtoms';
import useJotaiForm from '@/hooks/forms/useJotaiForm';
import useJotaiFormField from '@/hooks/forms/useJotaiFormField';

// フィールドコンポーネント（再レンダリング最適化）
function AnimalTypeField() {
  // 型パラメータを明示的に指定
  const { value, error, onChange } = useJotaiFormField<string>({
    fieldAtoms: reportFormAtoms.fields.animalType,
    rules: reportValidationRules.animalType,
    defaultValue: reportFormAtoms.initialValues.animalType,
  });

  return (
    <Select
      id="animalType"
      label="動物種別"
      value={value}
      onChange={onChange}
      error={error ?? undefined}
      required
    >
      <option value="monkey">サル</option>
      <option value="deer">シカ</option>
      <option value="wild_boar">イノシシ</option>
      <option value="bear">クマ</option>
      <option value="other">その他</option>
    </Select>
  );
}

// フォームコンポーネント
export default function NewReportPage() {
  const { mutate } = useCreateReport();

  // 型パラメータを明示的に指定
  const { errors, isValid, validateAll, getFormData } =
    useJotaiForm<ReportFormValues>(reportFormAtoms);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    mutate(getFormData()); // Server Actionsと互換
  };

  return (
    <form onSubmit={handleSubmit}>
      <AnimalTypeField />
      {/* 他のフィールド */}
      <button type="submit" disabled={!isValid}>送信</button>
    </form>
  );
}
```

### useJotaiFormField の返却値

| プロパティ | 型                   | 説明                                             |
| ---------- | -------------------- | ------------------------------------------------ |
| `value`    | `T`                  | 現在の値                                         |
| `error`    | `string \| null`     | エラーメッセージ                                 |
| `touched`  | `boolean`            | フィールドがタッチされたか                       |
| `onChange` | `(value: T) => void` | 値変更ハンドラ（リアルタイムバリデーション付き） |
| `onBlur`   | `() => void`         | フォーカス離脱ハンドラ                           |
| `validate` | `() => boolean`      | 手動バリデーション                               |
| `reset`    | `() => void`         | 初期値にリセット                                 |

### useJotaiForm の返却値

| プロパティ      | 型                                         | 説明                         |
| --------------- | ------------------------------------------ | ---------------------------- |
| `values`        | `T`                                        | 全フィールドの値             |
| `errors`        | `Partial<Record<keyof T, string \| null>>` | 全エラー                     |
| `isValid`       | `boolean`                                  | フォーム全体が有効か         |
| `isDirty`       | `boolean`                                  | 初期値から変更があるか       |
| `reset`         | `() => void`                               | フォーム全体をリセット       |
| `validateAll`   | `() => boolean`                            | 全フィールドをバリデーション |
| `getFormData`   | `() => FormData`                           | Server Actions用FormData生成 |
| `setFieldValue` | `(field, value) => void`                   | 個別フィールドの値設定       |

### 編集フォームでのバリデーション使用

既存データを編集するページでは、フォーム値をローカルstateで管理しつつ、バリデーションユーティリティを直接使用：

```typescript
import { rules, validateField } from '@/hooks/forms/core/validation';

const [formData, setFormData] = useState({ animalType: '', description: '' });
const [errors, setErrors] = useState<Record<string, string | undefined>>({});

const validationRules = {
  animalType: [rules.required('動物種別は必須です')],
  description: [rules.maxLength(1000, '1000文字以内で入力してください')],
};

const validate = () => {
  const newErrors: Record<string, string | undefined> = {};
  const animalError = validateField(
    formData.animalType,
    validationRules.animalType
  );
  const descError = validateField(
    formData.description,
    validationRules.description
  );
  if (animalError) newErrors.animalType = animalError;
  if (descError) newErrors.description = descError;
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## パッケージ管理

### パッケージマネージャー

- **pnpm** を使用
- `pnpm install` で依存関係をインストール

### 主要な依存関係

**プロダクション:**

- `next@16.1.1`
- `react@19.0.0`
- `@tanstack/react-query@^5.90.16`
- `jotai@^2.16.1` - クライアント状態管理
- `ai@^6.0.39` - Vercel AI SDK
- `@ai-sdk/google@^3.0.10` - Google Gemini統合
- `@ai-sdk/react@^3.0.41` - AIフック
- `@prisma/client@^6.19.1` - データベースORM
- `@vercel/blob@^2.0.0` - 画像ストレージ
- `react-hot-toast@^2.6.0`
- `@heroui/react@^2.4.6`
- `@digital-go-jp/design-tokens@^1.1.2`
- `leaflet@^1.9.4` / `react-leaflet@^5.0.0` - 地図表示
- `leaflet.heat@^0.2.0` - ヒートマップ
- `leaflet.timeline@^1.6.0` - 時系列タイムライン表示
- `recharts@^3.6.0` - チャート
- `nuqs@^2.8.6` - URL状態管理
- `react-markdown@^10.1.0` - Markdown表示
- `zod@^4.3.5` - スキーマバリデーション

**開発:**

- `typescript@^5`
- `eslint@^9`
- `prettier@^3.1.1`
- `storybook@^10.0.2`
- `prisma@^6.19.1` - Prisma CLI

## 開発ガイドライン

### 開発コマンド

**開発サーバー:**

```bash
pnpm run dev        # Next.js開発サーバー起動 (localhost:3000)
pnpm run build      # プロダクションビルド
pnpm run start      # ビルド済みアプリをローカルで起動
```

**コード品質:**

```bash
pnpm run lint       # ESLint実行 (--max-warnings=0)
npx prettier --write "src/**/*.{js,jsx,ts,tsx,json}"  # フォーマット
npx stylelint "src/**/*.{css,scss,sass}"              # スタイル検証
```

**Storybook:**

```bash
pnpm run storybook        # Storybook起動 (localhost:6006)
pnpm run build-storybook  # 静的Storybookビルド
```

**データベース:**

```bash
pnpm run db:generate  # Prismaクライアント生成
pnpm run db:push      # スキーマをDBにプッシュ
pnpm run db:studio    # Prisma Studio起動
```

### 新機能の追加手順

**1. ドメイン層から実装開始**

- `src/server/domain/models/` にエンティティ作成
- `src/server/domain/value-objects/` に値オブジェクト作成
- `src/server/domain/repositories/` にリポジトリインターフェース定義

**2. インフラ層の実装**

- `prisma/schema.prisma` にモデル定義追加
- `pnpm run db:generate` でクライアント更新
- `src/server/infrastructure/repositories/` にPrismaリポジトリ実装
- `src/server/infrastructure/mappers/` にMapper作成

**3. アプリケーション層**

- `src/server/application/dtos/` にDTO作成
- `src/server/application/use-cases/[feature]/` にUse Case実装

**4. プレゼンテーション層**

- `src/features/[feature]/actions.ts` にServer Actions作成
- `src/hooks/mutations/use[Feature]Mutations.ts` にMutationフック作成
- `src/app/[feature]/` にページ作成
- `src/features/[feature]/components/` にコンポーネント作成

### React Hooks 使用ガイドライン

**原則: 最小限のhooks使用**

不要なuseState/useEffect/useRefはコードの複雑性を増し、バグの原因になる。以下のガイドラインに従って最小限に抑える。

#### useState を使わないパターン

```typescript
// ❌ 悪い例: TanStack Queryの状態を別途管理
const [isSaving, setIsSaving] = useState(false);
const mutation = useUpdateReport();
// setIsSaving(true) → mutation.mutate() → setIsSaving(false)

// ✅ 良い例: mutation.isPendingを直接使用
const mutation = useUpdateReport();
<Button disabled={mutation.isPending}>
  {mutation.isPending ? '保存中...' : '保存'}
</Button>
```

```typescript
// ❌ 悪い例: URLに永続化すべき状態をuseStateで管理
const [isFilterOpen, setIsFilterOpen] = useState(false);
const [sortOrder, setSortOrder] = useState('asc');

// ✅ 良い例: nuqsでURL状態管理（ブックマーク可能）
const [params, setParams] = useQueryStates({
  filter: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(['asc', 'desc']).withDefault('asc'),
});
```

```typescript
// ❌ 悪い例: 他の状態から計算可能な派生状態
const [messages, setMessages] = useState([]);
const [isChatStarted, setIsChatStarted] = useState(false);
// messagesが変わるたびにisChatStartedも更新が必要

// ✅ 良い例: 派生値として直接計算
const isChatStarted = messages.length > 0;
```

#### useEffect を使わないパターン

```typescript
// ❌ 悪い例: 状態同期のためのuseEffect
useEffect(() => {
  if (messages.length > 0) {
    setIsChatStarted(true);
  }
}, [messages.length]);

// ✅ 良い例: 派生値として計算（useEffect不要）
const isChatStarted = messages.length > 0;
```

#### useRef を使わないパターン

```typescript
// ❌ 悪い例: 外側クリック検出にuseRef + useEffect
const menuRef = useRef(null);
useEffect(() => {
  const handleClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClick);
  return () => document.removeEventListener('mousedown', handleClick);
}, []);

// ✅ 良い例: 透明オーバーレイでクリック検出
{isOpen && (
  <>
    <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
    <Menu />
  </>
)}
```

#### 正当なuseRef/useEffectの使用例

以下の場合はuseRef/useEffectが必要：

- **ファイル入力のクリック呼び出し**: `inputRef.current.click()`
- **ダイアログ制御**: `dialogRef.current.showModal()` / `.close()`
- **外部ライブラリ統合**: Leaflet, Chart.js等のインスタンス管理
- **スクロール制御**: `element.scrollIntoView()`
- **フォーカス管理**: キーボードナビゲーション

#### 状態管理の選択基準

| 状態の種類           | 推奨ツール                      |
| -------------------- | ------------------------------- |
| サーバーデータ       | TanStack Query                  |
| ミューテーション状態 | `mutation.isPending` を直接参照 |
| URL永続化が必要      | nuqs                            |
| コンポーネント間共有 | Jotai atom                      |
| ローカルUI状態のみ   | useState（最終手段）            |

#### フォーム状態管理（Jotai atoms）

編集フォームの状態は `useState` ではなく **Jotai atoms** で管理する。これにより初期値の問題（useStateは初回マウント時のみ評価）を回避し、一貫した状態管理が可能になる。

**atomファイルの配置:**

```
src/features/[feature]/atoms/[feature]EditAtoms.ts
```

**atom定義の例:**

```typescript
// src/features/report/atoms/reportEditAtoms.ts
import { atom } from 'jotai';
import type { ReportDto } from '@/server/application/dtos/ReportDto';

// 各フィールドを個別のatomで管理
export const editingReportIdAtom = atom<string | null>(null);
export const animalTypeAtom = atom<string>('');
export const addressAtom = atom<string>('');
export const statusAtom = atom<string>('waiting');
// ... 他のフィールド

// アクションatom: データからフォームを初期化
export const initFormFromReportAtom = atom(
  null,
  (get, set, report: ReportDto) => {
    set(editingReportIdAtom, report.id);
    set(animalTypeAtom, report.animalType);
    set(addressAtom, report.address);
    set(statusAtom, report.status);
    // ... 他のフィールド
  }
);

// アクションatom: フォームをリセット
export const resetFormAtom = atom(null, (get, set) => {
  set(editingReportIdAtom, null);
  set(animalTypeAtom, '');
  set(addressAtom, '');
  set(statusAtom, 'waiting');
  // ... 他のフィールド
});
```

**コンポーネントでの使用:**

```typescript
// 各フィールドをuseAtomで取得
const [animalType, setAnimalType] = useAtom(animalTypeAtom);
const [status, setStatus] = useAtom(statusAtom);
const initFormFromReport = useSetAtom(initFormFromReportAtom);
const resetForm = useSetAtom(resetFormAtom);

// 編集ボタンクリック時: 最新データでatomを初期化
<Button onClick={() => {
  initFormFromReport(report);  // ← SSRで取得した最新データ
  setIsEditing(true);
}}>
  編集
</Button>

// キャンセル時: atomをリセット
<Button onClick={() => {
  resetForm();
  setIsEditing(false);
}}>
  キャンセル
</Button>
```

**利点:**

- `useState` の初期値問題を回避（useStateは初回マウント時のみ評価される）
- 編集ボタンクリック時に最新のpropsでフォームを初期化できる
- ステータス変更など他の操作と一貫した状態管理
- フィールド単位の再レンダリング最適化

### コーディング規約

**命名規則:**

- **ファイル名**:
  - コンポーネント/クラス: PascalCase (`Button.tsx`, `UserService.ts`)
  - 設定ファイル: kebab-case (`tailwind.config.ts`)
  - Storybookストーリー: `Component.stories.ts`
  - テストファイル: `Component.test.tsx`
- **変数/関数**: camelCase
- **クラス/型**: PascalCase
- **定数**: UPPER_SNAKE_CASE

**インポート順序** (eslint-plugin-simple-import-sort):

1. React/Next.js
2. 外部ライブラリ
3. 内部モジュール（@/...）
4. 相対パス

**インポートルール:**

- **バレルエクスポート（index.ts）は使用禁止** - 直接パスインポートを使用する
- **クラス**: default exportを使用
- **型/インターフェース**: named exportを使用
- **ユーティリティ関数/定数**: named exportを使用

```typescript
// ✅ 正しいインポート
import Button from '@/components/ui/Button/Button';
import CreateReportUseCase from '@/server/application/use-cases/report/CreateReportUseCase';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { buttonBaseStyle } from '@/components/ui/Button/Button';

// ❌ 禁止: バレルインポート
import { Button, Input } from '@/components/ui';
import { CreateReportUseCase } from '@/server/application/use-cases/report';
import type { ReportDto } from '@/server/application/dtos';
```

**エクスポートパターン:**

```typescript
// クラス（UseCase, Repository, Mapper, Model, ValueObject）
class CreateReportUseCase {
  // ...
}
export default CreateReportUseCase;

// 型/インターフェース（DTO等）
export interface ReportDto {
  // ...
}

// ユーティリティ（同ファイル内でnamed export）
export const buttonBaseStyle = '...';
const Button = forwardRef<...>(...);
export default Button;
```

**型定義:**

- `interface` を優先（拡張性のため）
- `type` はUnion/Intersectionで使用

**コンポーネント構成:**

```
src/components/ui/Button/
├── Button.tsx           # 実装
├── Button.module.scss   # スタイル (SCSS modules)
└── Button.stories.ts    # Storybook
```

**スタイリング:**

- Tailwind CSSを優先
- 複雑なスタイルはSCSS modulesを使用
- グローバルスタイルは `src/app/globals.css`
- `.editorconfig` で2スペースインデント、LF改行を強制

### 検索条件UIガイドライン

通報一覧ページ（`/report`）の検索条件UIは、現在のレイアウトを維持すること。

**メインフィルターバー（常時表示）:**

- キーワード検索
- ステータスフィルター
- 獣種フィルター
- 詳細ボタン
- 表示形式切り替え（リスト/地図）

**詳細フィルター（展開式）:**

- 期間（DateRangePicker）
- 並び順
- タイムライン表示トグル（地図モード時のみ）
- 推定表示期間（タイムラインオン時のみ）

**新しい検索条件を追加する場合:**

- メインフィルターバーには追加しない（現在のレイアウトを維持）
- 詳細フィルター内に追加する
- 特定のviewModeでのみ必要な設定は、そのモード時のみ表示する

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 検索] [ステータス ▼] [獣種 ▼] [詳細 ▼] [リスト|地図]       │  ← 固定
├─────────────────────────────────────────────────────────────────┤
│ 期間: [DateRangePicker]          並び順: [▼]                    │  ← 詳細内
│ タイムライン表示: [○ オフ]       推定表示期間: [7日間 ▼]        │  ← 詳細内（地図時）
└─────────────────────────────────────────────────────────────────┘
```

### テスト戦略

**現状:**

- 自動テストは未実装
- Storybookストーリーと手動確認で品質担保

**将来の実装計画:**

- **単体テスト**: Domain Models, Value Objects, Use Cases
  - ファイル配置: `Component.test.tsx`（コンポーネントと同じディレクトリ）
  - ツール: React Testing Library
- **統合テスト**: Server Actions, Repository
- **E2Eテスト**: ユーザーフロー

**テスト実行前のチェック:**

```bash
npx lint-staged  # Huskyフックを手動実行
pnpm run build   # ビルド成功を確認
```

**動作確認**
localhost:3000で手動確認(既に3000ポートが使用されている場合はそれを流用)
playwright-mcpで動作確認する。画像は.playwright-mcpフォルダに保存する。
※動作確認時は `pnpm run build` によるビルド確認は不要（開発サーバーでの確認で十分）

### Git ワークフロー

**コミットメッセージ** (Conventional Commits):

```
feat: 新機能追加
fix: バグ修正
chore(deps): 依存関係更新
refactor: リファクタリング
docs: ドキュメント更新
style: コードフォーマット
test: テスト追加/修正
```

**例:**

```
feat: Add report statistics dashboard
fix: Resolve map marker display issue
chore(deps): Update @tanstack/react-query to v5.90.16
```

**重要:** Co-Authored-By行は使用しない。コミットメッセージはシンプルに保つこと。

**Pull Request ガイドライン:**

1. 関連する変更を1つのPRにまとめる
2. 簡潔な説明とスクリーンショット/動画を添付（UI変更時）
3. PRマージ前に以下を確認:
   - `pnpm run lint` が成功
   - `pnpm run build` が成功
   - Storybookで動作確認

**Huskyフック:**

- `pre-commit`: lint-staged実行（ESLint、Stylelint、Prettier）
- バイパスは避ける（CI失敗の原因になる）

**CI/CD要件:**

- Node.js 24.11.0 (`.node-version` 参照)
- ローカル環境もバージョン統一（nvm/fnm使用推奨）
- Renovateで依存関係自動更新（大規模アップグレードは慎重に）

## よくある質問

### Q: src/lib ディレクトリは？

A: 廃止されました。代わりに以下を使用：

- キャッシュ管理 → `src/server/infrastructure/cache/`
- 通知機能 → `src/features/common/notifications/`

### Q: InMemoryRepositoryはどこに？

A: Prismaリポジトリに置き換えられました。`src/server/infrastructure/repositories/PrismaReportRepository.ts` を使用。

### Q: Server Actions と API Routes の使い分けは？

A: Server Actions を優先。外部APIやWebhook受信には API Routes を使用。

### Q: Jotai と TanStack Query の使い分けは？

A:

- Jotai: クライアント状態（モーダル開閉、フィルター状態、テーマ等のUI状態、フォーム状態）
- TanStack Query: サーバー状態（データ取得、ミューテーション、キャッシュ管理）

### Q: 画像のアップロード先は？

A: Vercel Blobを使用。`VercelBlobImageRepository` で管理。

### Q: 地図コンポーネントの使い方は？

A: GIS（地図）機能の詳細は **[GIS.md](GIS.md)** を参照してください。

**概要:**

- 統合地図コンポーネント `FullscreenReportMap` を使用
- 表示モード: fullscreen / embedded
- 地図モード: default（通常） / timeline（タイムライン）
- インタラクション: popup / click / none
- iframe埋め込み対応（`/map/embed`）

**クイックスタート:**

```tsx
<FullscreenReportMap
  reports={reports}
  displayMode="embedded"
  mapMode="default"
  interactionMode="click"
  showLegend={true}
/>
```

詳細な使用例、パラメータ、設定については [GIS.md](GIS.md) をご覧ください。

### Q: 分析AI機能の仕組みは？

A: Vercel AI SDK + Google Gemini を使用。ユーザーの自然言語クエリをSQLに変換し、データベースを検索して結果を返します。

- チャットUI: `src/features/analysis/components/chat/`
- AIツール: `src/server/infrastructure/ai/tools/runSqlTool.ts`
- APIエンドポイント: `src/app/api/analysis/chat/route.ts`

### Q: チャットUIの共有コンポーネントは？

A: `src/components/ui/Chat/` に統合されています。line-verify と analysis で共通利用。

## リソース

- [Next.js 16 Docs](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Prisma Docs](https://www.prisma.io/docs)
- [Digital Agency Design System](https://www.digital.go.jp/policies/servicedesign/designsystem)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Google Gemini](https://ai.google.dev/docs)
- [DDD参考資料](https://github.com/domain-driven-design)
- **[GIS機能ガイド](GIS.md)** - 地図機能の詳細ドキュメント
