---
name: bug-hunt
description: コードベースを体系的に探索してバグを発見し、GitHub Issueとして起票するエージェント。「バグ探し」「バグ発見」「bug hunt」時に使用。
---

# バグ発見エージェント

指定された対象範囲でバグを体系的に探索し、発見したバグをGitHub Issueとして起票する。

## 入力パラメータ

ユーザーから以下の情報を受け取る（未指定の場合はデフォルト値を使用）:

| パラメータ | デフォルト | 例 |
|-----------|-----------|-----|
| 対象エリア | 全画面 | `dashboard`, `map`, `report detail`, `help` |
| 目標件数 | 10件 | `5`, `20` |
| 探索観点 | 全観点 | `security`, `ui`, `logic`, `a11y`, `docs` |

## 実行フロー

### Step 1: 対象ファイルの特定

対象エリアに応じて探索すべきディレクトリを決定する。

| エリア | 主なディレクトリ |
|--------|-----------------|
| dashboard | `src/features/dashboard/`, `src/app/admin/` (ルートページ) |
| report | `src/features/report/`, `src/app/admin/report/`, `src/app/report/` |
| map | `src/features/map/`, `src/app/map/` |
| staff | `src/features/staff/`, `src/app/admin/staff/` |
| help | `src/app/admin/help/`, `src/app/help/` |
| settings | `src/app/admin/settings/`, `src/features/system-setting/` |
| analysis | `src/features/analysis/`, `src/app/api/analysis/` |
| common | `src/components/`, `src/hooks/`, `src/server/` |
| all | 上記すべて |

### Step 2: 並列コード探索

Taskエージェント（`subagent_type=Explore`）を **2〜3個並列** で起動する。
各エージェントには異なるエリアまたは異なる探索観点を割り当てて効率化する。

#### 探索観点チェックリスト

**ロジックバグ**:
- 境界値の未処理（0, null, undefined, 空配列, 空文字列）
- truthyチェックで0やfalseが意図せずフィルタされる（`value` → `value != null`）
- `Math.max(...[])` が `-Infinity` を返す
- 非同期処理のエラーハンドリング欠落
- useEffectの依存配列の不足・過剰
- 日付やタイムゾーンの処理ミス

**セキュリティ**:
- `$queryRawUnsafe` や文字列補間によるSQLインジェクション
- URLパラメータの未バリデーション（page, zoom等）
- XSS（dangerouslySetInnerHTML の不適切な使用）

**UI / UX**:
- 無効なCSSクラス（存在しないデザイントークン）
- ResponsiveContainerの負値問題
- ハードコードされた年・件数・ラベル
- 表示とデータの不整合（件数表示 vs 実データ）

**アクセシビリティ**:
- aria-label の欠落
- 空の alt 属性
- フォーカス管理の不備
- ラベルのない入力フィールド

**ドキュメント整合性**:
- ヘルプページの記載と実装の乖離
- コメントと実際の処理の不一致
- 存在しない画面・機能への参照

**コード品質**:
- Dead code（未使用の関数・変数・import）
- 本番コードに残った console.log
- 誤解を招くコメント

#### Exploreエージェントへのプロンプトテンプレート

```
以下のディレクトリを探索し、バグを発見して報告せよ。

対象: {ディレクトリリスト}
探索観点: {チェックリストから該当するもの}

各バグについて以下の形式で報告:

### バグ {N}
- **ファイル**: 相対パス:行番号
- **確信度**: high / medium / low
- **種類**: ロジック / セキュリティ / UI / アクセシビリティ / ドキュメント / コード品質
- **概要**: 1行要約
- **詳細**: 問題の説明と影響
- **再現方法**: 再現手順または該当コードの説明
- **修正ヒント**: 推奨する修正方法

注意:
- 確実なバグのみ報告する（推測や好みの問題は含めない）
- コードを実際に読んで確認してから報告する
- 同じファイルの同じ問題を重複報告しない
```

### Step 3: 結果の検証とフィルタリング

Exploreエージェントの結果を受け取ったら:

1. **確信度 high** → 即採用
2. **確信度 medium** → `Read` ツールで該当コードを確認して判断
3. **確信度 low** → 原則破棄（明らかなバグの場合のみ確認）
4. **重複チェック** → 既存のオープンIssueと重複していないか `gh issue list` で確認

### Step 4: GitHub Issue起票

検証済みの各バグについて Issue を作成する。

```bash
gh issue create --title "{タイトル}" --label "bug" --body "$(cat <<'EOF'
## 概要
{1行要約}

## 該当箇所
- `{ファイルパス}:{行番号}`

## 再現手順
1. {手順}

## 期待される動作
{期待}

## 実際の動作
{実際}

## 原因
{原因の説明}

## 修正方針
{推奨する修正方法}
EOF
)"
```

### Step 5: 優先度ラベル付与

各Issueに優先度ラベルを付与する。ラベルが存在しない場合は先に作成する。

| ラベル | 条件 |
|--------|------|
| `priority: critical` | セキュリティ脆弱性、データ損失、サーバークラッシュ |
| `priority: high` | 主要機能の不具合、データ不整合、ユーザー影響大 |
| `priority: medium` | UI不具合、アクセシビリティ、ドキュメント不一致 |
| `priority: low` | コメント修正、Dead code、軽微な改善 |

```bash
gh issue edit {番号} --add-label "priority: {レベル}"
```

### Step 6: サマリー報告

発見したバグの一覧をテーブル形式でユーザーに報告する。

```
| # | Issue | 優先度 | 種類 | 概要 |
|---|-------|--------|------|------|
| 1 | #XXX  | critical | セキュリティ | ... |
| 2 | #YYY  | high     | ロジック     | ... |
```

追加で以下も報告:
- 探索した対象エリア
- 確認したファイル数（概算）
- 破棄したバグ候補の数と主な理由
