'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  /** Markdownテキスト */
  content: string;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * Markdownテキストをスタイル付きでレンダリングするコンポーネント
 *
 * GitHub Flavored Markdown (GFM) をサポート:
 * - 見出し (h1-h3)
 * - 段落、強調 (bold, italic)
 * - リスト (箇条書き、番号付き)
 * - コード (インライン、ブロック)
 * - リンク、引用、水平線
 * - テーブル
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = '',
}) => {
  return (
    <div
      className={`
        markdown-content
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 見出し
          h1: ({ children }) => (
            <h1 className="mb-2 text-lg font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 text-base font-bold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 text-sm font-bold">{children}</h3>
          ),
          // 段落
          p: ({ children }) => (
            <p
              className={`
                mb-2
                last:mb-0
              `}
            >
              {children}
            </p>
          ),
          // リスト
          ul: ({ children }) => (
            <ul
              className={`
                mb-2 list-disc pl-4
                last:mb-0
              `}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`
                mb-2 list-decimal pl-4
                last:mb-0
              `}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          // コードブロック
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-solid-gray-200 px-1 py-0.5 text-xs">
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`
                  block overflow-x-auto rounded bg-solid-gray-800 p-2 text-xs
                  text-white
                `}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              className={`
                mb-2
                last:mb-0
              `}
            >
              {children}
            </pre>
          ),
          // 強調
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          // リンク
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                text-blue-700 underline
                hover:text-blue-600
              `}
            >
              {children}
            </a>
          ),
          // 水平線
          hr: () => <hr className="my-2 border-solid-gray-300" />,
          // 引用
          blockquote: ({ children }) => (
            <blockquote
              className={`
                mb-2 border-l-4 border-solid-gray-300 pl-3 italic
                last:mb-0
              `}
            >
              {children}
            </blockquote>
          ),
          // テーブル
          table: ({ children }) => (
            <div
              className={`
                mb-2 overflow-x-auto
                last:mb-0
              `}
            >
              <table
                className={`
                  min-w-full border-collapse border border-solid-gray-300
                `}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-solid-gray-100">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-solid-gray-200">{children}</tr>
          ),
          th: ({ children }) => (
            <th
              className={`
                border border-solid-gray-300 px-3 py-2 text-left text-xs
                font-semibold
              `}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-solid-gray-300 px-3 py-2 text-xs">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
