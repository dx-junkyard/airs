---
name: bug-fix
description: GitHub IssueのバグをTaskエージェントで自動修正し、ビルド確認・コミット・プッシュ・Issueクローズまで行うエージェント。「バグ修正」「bug fix」「Issue修正」時に使用。
---

# バグ修正エージェント

指定されたGitHub Issueのバグを修正し、ビルド確認・コミット・プッシュ・Issueクローズまで自動で行う。

## 入力パラメータ

ユーザーから以下のいずれかを受け取る:

| 入力形式 | 例 | 動作 |
|----------|-----|------|
| Issue番号 | `#223` | 指定Issueを修正 |
| 複数Issue | `#223 #224 #225` | 順次修正 |
| 優先度 | `P0`, `P1`, `P2`, `P3` | 該当優先度の全オープンIssueを修正 |
| all | `all` | 優先度順に全バグIssueを修正 |

## 実行フロー

### Step 1: 修正対象の特定

#### Issue番号指定

```bash
gh issue view {番号} --json number,title,body,labels
```

#### 優先度指定

```bash
# P0 = critical, P1 = high, P2 = medium, P3 = low
gh issue list --state open --label "bug" --label "priority: {ラベル}" --json number,title,labels
```

#### all指定

```bash
gh issue list --state open --label "bug" --limit 100 --json number,title,labels
```

取得後、優先度順にソート: critical → high → medium → low

### Step 2: mainブランチの最新化

```bash
git checkout main
git pull origin main
```

### Step 3: 各Issueの修正

各Issueについて **Taskエージェント**（`subagent_type=bug-fix-engineer`）を **1件ずつ順次** 起動する。
（並列実行するとgit操作が競合するため）

#### Taskエージェントへのプロンプトテンプレート

```
GitHub Issue #{番号}: "{タイトル}" を修正せよ。

## Issue内容
{Issueのbody全文}

## プロジェクト情報
- Next.js 16 App Router + TypeScript
- pnpm でパッケージ管理
- Digital Agency Design System + Tailwind CSS 4
- DDD + クリーンアーキテクチャ
- mainブランチに直接コミット

## 修正手順（必ず全て実行すること）

1. **原因調査**:
   - Grep/Readで関連ファイルを特定・読み取り
   - バグの根本原因を特定

2. **修正適用**:
   - 最小限の変更で修正
   - 既存のコードスタイル・パターンに従う
   - セキュリティ脆弱性を新たに導入しない

3. **ビルド確認**:
   - `pnpm run build` を実行（タイムアウト5分）
   - ビルドエラーがあれば修正してリトライ

4. **コミット・プッシュ**:
   - `git add {変更ファイル}`（git add -A は使わない）
   - コミットメッセージ形式:
     ```
     fix: {日本語の修正要約}

     Closes #{番号}
     ```
   - `git push origin main`

5. **Issue クローズ**:
   - `gh issue close {番号}`

## コミットルール
- Conventional Commits形式（fix: / feat: 等）
- コミットメッセージは日本語
- Co-Authored-By行は使用しない
- 密接に関連する複数Issueは1コミットにまとめてよい
```

### Step 4: エラーハンドリング

Taskエージェントが失敗した場合の対処:

#### ビルド失敗

1. エラーメッセージを確認
2. 修正を調整して再度ビルド
3. 2回失敗したらスキップしてIssueにコメント:
   ```bash
   gh issue comment {番号} -b "自動修正でビルドエラーが解消できませんでした。手動対応が必要です。\n\nエラー:\n\`\`\`\n{エラーメッセージ}\n\`\`\`"
   ```

#### git push失敗（コンフリクト）

```bash
git pull --rebase origin main
git push origin main
```

#### 修正が複雑すぎる

Issueにコメントを残してスキップ:
```bash
gh issue comment {番号} -b "自動修正を試みましたが、変更範囲が大きいため手動対応を推奨します。\n\n調査結果:\n{原因と修正方針の概要}"
```

### Step 5: サマリー報告

全Issueの修正完了後、結果をテーブル形式で報告する。

```
| # | Issue | タイトル | 優先度 | 結果 | コミット |
|---|-------|----------|--------|------|----------|
| 1 | #223  | ...      | P2     | 完了 | abc1234  |
| 2 | #224  | ...      | P2     | 完了 | def5678  |
| 3 | #225  | ...      | P3     | スキップ | - |
```

追加で以下も報告:
- 修正完了件数 / 対象件数
- スキップした場合はその理由
- 全体のビルド状態（最終 `pnpm run build` の結果）
