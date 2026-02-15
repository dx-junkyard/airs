import { faComment } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Blockquote from '@/components/ui/Blockquote/Blockquote';
import { Card } from '@/components/ui/Card/Card';
import Ol from '@/components/ui/Ol/Ol';

export default function LinePage() {
  const qrUrl = process.env.LINE_FRIEND_QR_URL;
  const addUrl = process.env.LINE_FRIEND_ADD_URL;

  return (
    <div className="space-y-8">
      {/* ヘッダーカード */}
      <Card padding="lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faComment}
              className="size-6 shrink-0 text-blue-700"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-blue-900">
              LINE公式アカウント
            </h2>
          </div>
          <p className="text-sm text-solid-gray-600">
            LINEで獣害の目撃情報を通報できます。公式アカウントを友だち追加して、トーク画面からお知らせください。
          </p>
        </div>
      </Card>

      {/* 友だち追加方法 */}
      <Card title="友だち追加方法" padding="lg">
        <div className="space-y-6">
          {/* QRコード */}
          <div className="flex flex-col items-center gap-3">
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt="LINE公式アカウント友だち追加QRコード"
                width={200}
                height={200}
                className="rounded-md"
                unoptimized
              />
            ) : (
              <p className="text-sm text-solid-gray-500">
                QRコードは現在準備中です。自治体の広報やウェブサイトをご確認ください。
              </p>
            )}
            <p className="text-sm text-solid-gray-600">
              QRコードをスマホで読み取って追加
            </p>
          </div>

          {/* 区切り線「または」 */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-solid-gray-200" />
            <span className="text-sm text-solid-gray-500">または</span>
            <div className="h-px flex-1 bg-solid-gray-200" />
          </div>

          {/* 友だち追加リンク */}
          <div className="flex flex-col items-center gap-3">
            {addUrl ? (
              <a
                href={addUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  inline-flex items-center gap-2 rounded-lg bg-[#06C755] px-6
                  py-3 font-semibold text-white transition-opacity
                  hover:opacity-90
                `}
              >
                友だち追加リンクを開く
                <span aria-hidden="true">&rarr;</span>
              </a>
            ) : (
              <p className="text-sm text-solid-gray-500">
                友だち追加リンクは現在準備中です。自治体の広報やウェブサイトをご確認ください。
              </p>
            )}
            <p className="text-sm text-solid-gray-600">
              スマホから直接タップして追加
            </p>
          </div>
        </div>
      </Card>

      {/* 通報の流れ */}
      <Card title="通報の流れ" padding="lg">
        <Blockquote>
          LINE公式アカウントを友だち追加した後、以下の手順で通報できます。
        </Blockquote>
        <Ol className="mt-4 ml-6 space-y-2">
          <li>LINE公式アカウントを友だち追加</li>
          <li>トーク画面でメッセージを送信</li>
          <li>AIが対話形式で情報を聞き取り</li>
          <li>通報完了・システムに自動登録</li>
        </Ol>
      </Card>
    </div>
  );
}
