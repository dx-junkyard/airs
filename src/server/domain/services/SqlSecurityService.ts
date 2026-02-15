/**
 * SQL Security Service
 *
 * SQLインジェクションを防止し、安全なクエリのみを許可する
 */

/** 許可されたテーブルのリスト */
const ALLOWED_TABLES = ['reports', 'events', 'event_reports', 'staffs', 'facilities'];

/** 禁止されたSQLキーワード */
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
  'INTO',
  '--',
  '/*',
  '*/',
  ';',
  'UNION',
  'INFORMATION_SCHEMA',
  'PG_',
  'SLEEP',
  'BENCHMARK',
  'WAITFOR',
];

/** デフォルトのLIMIT値 */
const DEFAULT_LIMIT = 1000;

type SqlTokenType = 'word' | 'quotedIdentifier' | 'symbol';

interface SqlToken {
  type: SqlTokenType;
  value: string;
}

const TABLE_SOURCE_PREFIX_KEYWORDS = new Set(['ONLY', 'LATERAL']);

const NON_FUNCTION_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'CROSS',
  'WHERE',
  'ON',
  'GROUP',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION',
  'EXCEPT',
  'INTERSECT',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'EXISTS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
]);

export interface SqlValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedSql?: string;
}

class SqlSecurityService {
  /**
   * SQLクエリを検証する
   */
  validate(sql: string): SqlValidationResult {
    const upperSql = sql.toUpperCase().trim();

    // SELECT文のみ許可
    if (!upperSql.startsWith('SELECT')) {
      return {
        isValid: false,
        error: 'SELECT文のみ許可されています',
      };
    }

    // 禁止キーワードのチェック（単語境界でマッチ）
    for (const keyword of FORBIDDEN_KEYWORDS) {
      // 特殊文字（--, /*, */, ;）はそのままチェック
      if (keyword.startsWith('-') || keyword.startsWith('/') || keyword.startsWith('*') || keyword === ';') {
        if (upperSql.includes(keyword)) {
          return {
            isValid: false,
            error: `禁止されたキーワード "${keyword}" が含まれています`,
          };
        }
      } else {
        // SQLキーワードは単語境界でマッチ（deletedAtのようなカラム名を許可）
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(upperSql)) {
          return {
            isValid: false,
            error: `禁止されたキーワード "${keyword}" が含まれています`,
          };
        }
      }
    }

    // テーブル名の検証（FROM句とJOIN句両方をチェック）
    const tableNames = this.extractTableNames(sql);
    if (tableNames.length === 0) {
      return {
        isValid: false,
        error: 'FROM句が見つかりません',
      };
    }

    for (const tableName of tableNames) {
      if (!ALLOWED_TABLES.includes(tableName)) {
        return {
          isValid: false,
          error: `テーブル "${tableName}" へのアクセスは許可されていません`,
        };
      }
    }

    // LIMITを強制適用
    const sanitizedSql = this.enforceLimit(sql);

    return {
      isValid: true,
      sanitizedSql,
    };
  }

  /**
   * SQLからテーブル名を抽出する（FROM句とJOIN句）
   */
  private extractTableNames(sql: string): string[] {
    const tokens = this.tokenizeSql(sql);
    const tableNames: string[] = [];
    const functionStack: Array<string | null> = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'symbol') {
        if (token.value === '(') {
          const prevToken = tokens[i - 1];
          if (
            prevToken &&
            (prevToken.type === 'word' ||
              prevToken.type === 'quotedIdentifier') &&
            !NON_FUNCTION_KEYWORDS.has(prevToken.value.toUpperCase())
          ) {
            functionStack.push(prevToken.value.toUpperCase());
          } else {
            functionStack.push(null);
          }
        } else if (token.value === ')' && functionStack.length > 0) {
          functionStack.pop();
        }
        continue;
      }

      if (token.type !== 'word') continue;

      const keyword = token.value.toUpperCase();
      if (keyword !== 'FROM' && keyword !== 'JOIN') continue;

      // EXTRACT(field FROM expression) の FROM はテーブル参照ではない
      const currentFunction = functionStack[functionStack.length - 1];
      if (keyword === 'FROM' && currentFunction === 'EXTRACT') {
        continue;
      }

      let cursor = i + 1;
      while (
        tokens[cursor] &&
        tokens[cursor].type === 'word' &&
        TABLE_SOURCE_PREFIX_KEYWORDS.has(tokens[cursor].value.toUpperCase())
      ) {
        cursor++;
      }

      const tableReference = this.readTableReference(tokens, cursor);
      if (!tableReference) continue;

      tableNames.push(tableReference.tableName.toLowerCase());
      i = tableReference.nextIndex - 1;
    }

    return Array.from(new Set(tableNames));
  }

  private readTableReference(
    tokens: SqlToken[],
    startIndex: number
  ): { tableName: string; nextIndex: number } | null {
    const firstToken = tokens[startIndex];
    if (!firstToken) return null;

    // FROM (SELECT ...), JOIN (SELECT ...) はテーブル名なし
    if (firstToken.type === 'symbol' && firstToken.value === '(') {
      return null;
    }

    if (
      firstToken.type !== 'word' &&
      firstToken.type !== 'quotedIdentifier'
    ) {
      return null;
    }

    const parts = [firstToken.value];
    let cursor = startIndex + 1;

    // スキーマ付き識別子（public.reports, "public"."reports"）を許可
    while (
      tokens[cursor]?.type === 'symbol' &&
      tokens[cursor].value === '.' &&
      (tokens[cursor + 1]?.type === 'word' ||
        tokens[cursor + 1]?.type === 'quotedIdentifier')
    ) {
      parts.push(tokens[cursor + 1].value);
      cursor += 2;
    }

    return {
      tableName: parts[parts.length - 1],
      nextIndex: cursor,
    };
  }

  private tokenizeSql(sql: string): SqlToken[] {
    const tokens: SqlToken[] = [];
    let i = 0;

    while (i < sql.length) {
      const char = sql[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // -- コメント
      if (char === '-' && sql[i + 1] === '-') {
        i += 2;
        while (i < sql.length && sql[i] !== '\n') i++;
        continue;
      }

      // /* */ コメント
      if (char === '/' && sql[i + 1] === '*') {
        i += 2;
        while (i + 1 < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) {
          i++;
        }
        i = Math.min(i + 2, sql.length);
        continue;
      }

      // 文字列リテラル
      if (char === '\'') {
        i++;
        while (i < sql.length) {
          if (sql[i] === '\'') {
            if (sql[i + 1] === '\'') {
              i += 2;
              continue;
            }
            i++;
            break;
          }
          i++;
        }
        continue;
      }

      // "quoted identifier"
      if (char === '"') {
        i++;
        let value = '';
        while (i < sql.length) {
          if (sql[i] === '"') {
            if (sql[i + 1] === '"') {
              value += '"';
              i += 2;
              continue;
            }
            i++;
            break;
          }
          value += sql[i];
          i++;
        }
        tokens.push({ type: 'quotedIdentifier', value });
        continue;
      }

      if (/[A-Za-z_]/.test(char)) {
        const start = i;
        i++;
        while (i < sql.length && /[A-Za-z0-9_$]/.test(sql[i])) {
          i++;
        }
        tokens.push({ type: 'word', value: sql.slice(start, i) });
        continue;
      }

      if (char === '(' || char === ')' || char === '.' || char === ',') {
        tokens.push({ type: 'symbol', value: char });
        i++;
        continue;
      }

      i++;
    }

    return tokens;
  }

  /**
   * SELECT句が集計関数のみで構成されているか判定する
   * COUNT/SUM/AVG/MIN/MAX と GROUP BY カラムのみの場合 true
   */
  private isAggregateOnlyQuery(sql: string): boolean {
    const upperSql = sql.toUpperCase();

    // SELECT句を抽出（SELECT ... FROM の間）
    const selectMatch = upperSql.match(/^SELECT\s+([\s\S]+?)\s+FROM\b/i);
    if (!selectMatch) return false;

    const selectClause = selectMatch[1].trim();

    // GROUP BY句のカラム名を抽出
    const groupByColumns = this.extractGroupByColumns(upperSql);

    // SELECT句をカンマで分割（括弧の深さを考慮）
    const items = this.splitSelectItems(selectClause);

    const aggregatePattern =
      /^\s*(COUNT|SUM|AVG|MIN|MAX)\s*\([\s\S]*\)(\s+AS\s+\w+)?\s*$/i;

    for (const item of items) {
      const trimmed = item.trim();
      // 集計関数にマッチするか
      if (aggregatePattern.test(trimmed)) continue;

      // GROUP BYカラムにマッチするか（エイリアスやテーブル修飾子を除去して比較）
      const colName = trimmed
        .replace(/^.*\.\s*/, '') // テーブル修飾子を除去
        .replace(/\s+AS\s+\w+$/i, '') // AS エイリアスを除去
        .replace(/^"|"$/g, '') // ダブルクォートを除去
        .trim()
        .toUpperCase();

      if (groupByColumns.includes(colName)) continue;

      // どちらにもマッチしない項目がある場合は集計のみではない
      return false;
    }

    return true;
  }

  /**
   * 括弧の深さを考慮してSELECT句をカンマ分割する
   */
  private splitSelectItems(selectClause: string): string[] {
    const items: string[] = [];
    let depth = 0;
    let current = '';

    for (const char of selectClause) {
      if (char === '(') depth++;
      else if (char === ')') depth--;

      if (char === ',' && depth === 0) {
        items.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) items.push(current);

    return items;
  }

  /**
   * GROUP BY句からカラム名を抽出する
   */
  private extractGroupByColumns(upperSql: string): string[] {
    const groupByMatch = upperSql.match(
      /GROUP\s+BY\s+([\s\S]+?)(?:\s+HAVING\b|\s+ORDER\s+BY\b|\s+LIMIT\b|\s*$)/i
    );
    if (!groupByMatch) return [];

    return groupByMatch[1].split(',').map((col) =>
      col
        .trim()
        .replace(/^.*\.\s*/, '') // テーブル修飾子を除去
        .replace(/^"|"$/g, '') // ダブルクォートを除去
        .trim()
        .toUpperCase()
    );
  }

  /**
   * LIMITを強制適用する
   */
  private enforceLimit(sql: string): string {
    // 集計のみのクエリにはLIMITを付けない
    if (this.isAggregateOnlyQuery(sql)) {
      return sql;
    }

    const upperSql = sql.toUpperCase();

    // すでにLIMITがある場合、その値を確認
    const limitMatch = upperSql.match(/LIMIT\s+(\d+)/);
    if (limitMatch) {
      const currentLimit = parseInt(limitMatch[1], 10);
      if (currentLimit > DEFAULT_LIMIT) {
        // LIMITが上限を超えている場合、上限値に置き換え
        return sql.replace(/LIMIT\s+\d+/i, `LIMIT ${DEFAULT_LIMIT}`);
      }
      return sql;
    }

    // LIMITがない場合、追加
    // ORDER BYがある場合はその後に追加
    if (upperSql.includes('ORDER BY')) {
      return `${sql} LIMIT ${DEFAULT_LIMIT}`;
    }

    // GROUP BYがある場合はその後に追加
    if (upperSql.includes('GROUP BY')) {
      return `${sql} LIMIT ${DEFAULT_LIMIT}`;
    }

    // それ以外は末尾に追加
    return `${sql} LIMIT ${DEFAULT_LIMIT}`;
  }
}

export default SqlSecurityService;
