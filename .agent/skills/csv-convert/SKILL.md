---
name: csv-convert
description: 外部CSV/Excelデータを AIRS CSVインポート形式に変換するPythonスクリプトを生成・実行するエージェント。「CSV変換」「データ変換」「インポート用CSV作成」時に使用。
---

# CSV変換エージェント

外部の鳥獣目撃データ（CSV/Excel等）を AIRS のCSVインポート形式に変換するPythonスクリプトを生成・実行する。

## ターゲットCSVフォーマット

```
獣種,目撃日,目撃時刻,緯度,経度,住所,画像URL,説明文,電話番号
```

ヘッダーは **完全一致** が必須（順序・文字列ともに）。UTF-8エンコーディング（BOMなし）。

## 各カラムのバリデーション仕様

インポート時にサーバー側で以下のバリデーションが行われる。変換スクリプトでも同等のチェックを行い、不正行をスキップまたは修正すること。

### 獣種（必須）

カタカナラベルまたは英語コード値のいずれかで指定する。

| コード値 | ラベル | コード値 | ラベル |
|----------|--------|----------|--------|
| monkey | サル | raccoon | アライグマ |
| deer | シカ | nutria | ヌートリア |
| wild_boar | イノシシ | muntjac | キョン |
| bear | クマ | formosan_squirrel | タイワンリス |
| raccoon_dog | タヌキ | american_mink | アメリカミンク |
| fox | キツネ | mongoose | マングース |
| badger | アナグマ | siberian_weasel | シベリアイタチ |
| masked_palm_civet | ハクビシン | pheasant | キジ |
| hare | ノウサギ | crow | カラス |
| serow | カモシカ | bulbul | ヒヨドリ |
| marten | テン | starling | ムクドリ |
| weasel | イタチ | sparrow | スズメ |
| dog | イヌ | duck | カモ |
| cat | ネコ | heron | サギ |
| | | cormorant | カワウ |
| | | kite | トビ |
| | | pigeon | ハト |
| | | other | その他 |

**変換時のポイント:**
- ソースデータに獣種カラムがない場合、ファイル名や提供元情報から一律で特定する（例: bearfy → クマ）
- ソースに「熊」「くま」等の漢字/ひらがな表記がある場合はカタカナに変換する
- 該当しない動物種は `other` または `その他` にマッピングする

### 目撃日（必須）

`YYYY-MM-DD` 形式の日付文字列。

```
2024-01-15
```

**変換時のポイント:**
- `YYYY/MM/DD` → `YYYY-MM-DD`
- `YYYY年MM月DD日` → パースして `YYYY-MM-DD` に変換
- サーバー側で `目撃日` + `目撃時刻` を結合して `YYYY-MM-DDTHH:MM:00+09:00` としてパースする

### 目撃時刻（任意）

`HH:MM` 形式の時刻文字列。不明な場合は空文字。

```
10:30
```

**変換時のポイント:**
- `HH:MM:SS` → `HH:MM` に変換（秒は省略可）
- 時刻が不明な場合は空文字にする（サーバー側で `00:00:00+09:00` として扱われる）
- 24時間表記

### 緯度（必須）

- 数値（float）
- 範囲: -90 〜 90
- 日本国内データなら概ね 24〜46 の範囲

### 経度（必須）

- 数値（float）
- 範囲: -180 〜 180
- 日本国内データなら概ね 122〜154 の範囲

**変換時のポイント:**
- ソースで緯度・経度が逆になっていないか確認する（日本の場合、緯度 < 経度）
- 度分秒（DMS）表記の場合は十進法に変換する
- 空値や0の行はスキップする

### 住所（必須）

- 空でない文字列
- 都道府県名から始まることが望ましい

**変換時のポイント:**
- ソースに都道府県名が含まれない場合、データの出処（自治体名等）から推定して付与する
- 市町村名カラムと地名カラムが分かれている場合は結合する

### 画像URL（任意）

- 指定する場合は有効な HTTPS URL であること（`http://` は拒否される）
- ソースにない場合は空文字にする

### 説明文（任意）

- 自由記述
- ソースに複数の備考カラムがある場合は ` / ` 区切りで結合する
- 頭数情報、環境情報など補足的なカラムがあれば説明文に含める

### 電話番号（任意）

- ソースにない場合は空文字にする

## 変換スクリプト生成手順

### Step 1: ソースファイル分析

1. ファイルの先頭20〜30行を読み取る
2. エンコーディングを確認する（UTF-8, Shift_JIS, EUC-JP等）
3. 区切り文字を特定する（カンマ, タブ, セミコロン等）
4. 各カラムの意味を推定し、ターゲットカラムへのマッピングを決定する
5. Excel（.xls, .xlsx）の場合は `openpyxl` または `xlrd` で読み取る

**ソースカラムのマッピング推定ルール:**
- 「経度」「longitude」「lng」「lon」→ 経度
- 「緯度」「latitude」「lat」→ 緯度
- 「住所」「場所」「観察場所」「所在地」「地名」→ 住所
- 「日付」「日時」「発生日」「目撃日」「目撃年月日」→ 目撃日（＋目撃時刻）
- 「種類」「獣種」「動物」「animal」→ 獣種
- 「備考」「状況」「説明」「コメント」「description」→ 説明文
- 「電話」「連絡先」「phone」→ 電話番号
- 「画像」「写真」「URL」「image」→ 画像URL

### Step 2: Pythonスクリプト生成

`./tmp/convert_<ソースファイル名>.py` にスクリプトを生成する。

**スクリプトの必須要件:**
- 入力ファイルのエンコーディングを自動検出または明示的に指定する
- BOMを処理する（`utf-8-sig`）
- ダブルクォート内のカンマを正しく処理する
- 各行でバリデーションを行い、不正行はスキップする
- スキップ件数と理由をサマリ出力する
- 出力ファイルはUTF-8（BOMなし）で書き出す
- 出力ファイル名は `<ソースファイル名>_converted.csv` とする

**スクリプトのテンプレート構造:**

```python
import csv
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))

INPUT_FILE = Path(__file__).parent / "<ソースファイル名>"
OUTPUT_FILE = Path(__file__).parent / "<ソースファイル名>_converted.csv"

# 獣種マッピング（ソース固有の表記をAIRS形式に変換）
ANIMAL_TYPE_MAP = {
    # ソース表記: AIRSラベル
}

# 有効なAIRS獣種ラベル
VALID_LABELS = {
    "サル", "シカ", "イノシシ", "クマ", "タヌキ", "キツネ",
    "アナグマ", "ハクビシン", "ノウサギ", "カモシカ", "テン", "イタチ",
    "イヌ", "ネコ", "アライグマ", "ヌートリア", "キョン", "タイワンリス",
    "アメリカミンク", "マングース", "シベリアイタチ", "キジ", "カラス",
    "ヒヨドリ", "ムクドリ", "スズメ", "カモ", "サギ", "カワウ",
    "トビ", "ハト", "その他",
}

# 有効なAIRS獣種コード値
VALID_CODES = {
    "monkey", "deer", "wild_boar", "bear", "raccoon_dog", "fox",
    "badger", "masked_palm_civet", "hare", "serow", "marten", "weasel",
    "dog", "cat", "raccoon", "nutria", "muntjac", "formosan_squirrel",
    "american_mink", "mongoose", "siberian_weasel", "pheasant", "crow",
    "bulbul", "starling", "sparrow", "duck", "heron", "cormorant",
    "kite", "pigeon", "other",
}


def resolve_animal_type(raw: str) -> str | None:
    """獣種を解決する。解決できなければNoneを返す"""
    trimmed = raw.strip()
    if not trimmed:
        return None
    # そのまま有効な場合
    if trimmed in VALID_LABELS or trimmed in VALID_CODES:
        return trimmed
    # ソース固有マッピング
    if trimmed in ANIMAL_TYPE_MAP:
        return ANIMAL_TYPE_MAP[trimmed]
    return None


def parse_date(date_str: str) -> str:
    """日時文字列をISO 8601 JST形式に変換"""
    # ソースに合わせてフォーマットを調整
    ...


def validate_coordinates(lat_str: str, lng_str: str) -> tuple[float, float] | None:
    """緯度経度をバリデーションする"""
    try:
        lat = float(lat_str)
        lng = float(lng_str)
    except (ValueError, TypeError):
        return None
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return None
    return (lat, lng)


def main():
    skipped = 0
    converted = 0
    skip_reasons: dict[str, int] = {}

    with open(INPUT_FILE, "r", encoding="utf-8-sig") as infile, \
         open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as outfile:

        reader = csv.DictReader(infile)
        writer = csv.writer(outfile)
        writer.writerow(["獣種", "目撃日", "目撃時刻", "緯度", "経度", "住所", "画像URL", "説明文", "電話番号"])

        for row in reader:
            # カラムマッピングとバリデーションを実装
            ...

    print(f"変換完了: {converted}件")
    print(f"スキップ: {skipped}件")
    if skip_reasons:
        print("スキップ理由:")
        for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1]):
            print(f"  {reason}: {count}件")
    print(f"出力先: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
```

### Step 3: 実行と確認

1. スクリプトを実行する
2. サマリ出力（変換件数、スキップ件数、スキップ理由）を確認する
3. 出力ファイルの先頭5〜10行を表示して内容を目視確認する
4. 問題があればスクリプトを修正して再実行する

## 注意事項

- Excel（.xls）ファイルの場合、`xlrd` が必要。`pip install xlrd` を実行する
- Excel（.xlsx）ファイルの場合、`openpyxl` が必要。`pip install openpyxl` を実行する
- Shift_JISファイルの場合、`encoding="cp932"` を使用する
- 大容量ファイル（10万行超）の場合はメモリ使用量に注意する
- 変換スクリプトは `./tmp/` に配置し、変換後のCSVも `./tmp/` に出力する
