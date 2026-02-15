import { faBullhorn } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Blockquote from '@/components/ui/Blockquote/Blockquote';
import { Card } from '@/components/ui/Card/Card';
import Disclosure from '@/components/ui/Disclosure/Disclosure';
import DisclosureSummary from '@/components/ui/Disclosure/DisclosureSummary';
import Divider from '@/components/ui/Divider/Divider';
import { FAQSection } from '@/components/ui/FAQSection/FAQSection';
import Ol from '@/components/ui/Ol/Ol';
import Ul from '@/components/ui/Ul/Ul';
import { isAdminMode } from '@/config/admin-mode';
import { isDemoMode } from '@/config/demo-mode';
import HelpChatbotSidebar from '@/features/help-chatbot/components/HelpChatbotSidebar';

export default function HelpPage() {
  return (
    <div className="space-y-8">
      {/* 対象ユーザーの説明 */}
      <Card padding="lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faBullhorn}
              className="size-6 shrink-0 text-blue-700"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-blue-900">
              一般利用者向けヘルプ
            </h2>
          </div>
          <p className="text-sm text-solid-gray-600">
            このページでは、住民の方がLINEから野生動物の目撃情報を通報する方法についてご案内します。
            {isAdminMode && (
              <>
                管理者向けの操作方法は
                <a
                  href="/admin/help"
                  className="text-blue-600 underline underline-offset-2"
                >
                  管理者用ヘルプ
                </a>
                をご覧ください。
              </>
            )}
          </p>
        </div>
      </Card>

      {/* LINEで通報する方法 */}
      <Card title="LINEで獣害を通報する" padding="lg">
        <div className="space-y-6">
          <Blockquote>
            野生動物（サル・シカ・イノシシ・クマなど）を目撃した際は、LINEから簡単に通報できます。AIが対話形式で必要な情報を聞き取り、自動で通報が登録されます。
          </Blockquote>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              1. LINE公式アカウントを友だち追加
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>
                お住まいの自治体が案内するLINE公式アカウントを友だち追加します
              </li>
              <li>
                QRコードやリンクから追加できます（自治体の広報やウェブサイトをご確認ください）
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              2. トーク画面から通報する
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>トーク画面で目撃情報をメッセージとして送信します</li>
              <li>AIが自動で聞き取りを行い、必要な項目を整理します</li>
              <li>
                質問に答える形式で、動物の種類・目撃場所・状況などを伝えてください
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              3. 写真や位置情報を送信する（任意）
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>
                写真を送信すると、AIが動物の種類を自動判定します（写真のファイルサイズは5MB以下）
              </li>
              <li>
                位置情報を共有すると、住所と周辺のランドマークが自動取得されます
              </li>
              <li>
                写真や位置情報がなくても通報は可能ですが、より正確な通報のためにご協力ください
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              4. 通報完了
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>AIが通報内容を整理し、システムに自動登録します</li>
              <li>担当者が通報内容を確認し、対応を進めます</li>
            </Ol>
          </div>
        </div>
      </Card>

      <Divider />

      {/* FAQSection */}
      <FAQSection
        title="よくある質問（FAQ）"
        items={[
          {
            question: '対応している動物の種類は何ですか？',
            answer:
              'システム設定で有効化された獣種に対応しています。お住まいの地域で設定されている獣種はLINE通報フローの選択肢でご確認いただけます。代表的な獣種には、サル・シカ・イノシシ・クマなどがあります。',
          },
          {
            question: 'LINEからどのように通報しますか？',
            answer:
              'LINE公式アカウントを友だち追加後、トーク画面でメッセージを送信してください。AIが自動で目撃情報を聞き取り、必要な項目を整理します。写真を送信するとAIが動物の種類を自動判定します。また、位置情報を共有すると住所と周辺のランドマークが自動取得されます。',
          },
          {
            question: '写真をアップロードする際の注意点はありますか？',
            answer:
              '写真のファイルサイズは5MB以下に制限されています。アップロードされた写真はAIが自動分析し、動物の種類の判定に使用されます。複数枚の写真を登録できます。',
          },
          {
            question: '住所はどのように取得されますか？',
            answer:
              '位置情報（緯度・経度）からYahoo!リバースジオコーダAPIを使って住所を自動取得しています。取得できる住所の粒度は地点やデータ整備状況によって異なります。',
          },
          {
            question: '周辺のランドマーク情報はどこから取得していますか？',
            answer:
              '周辺のランドマーク（公園、学校、駅など）はOpenStreetMap（OSM）のデータを使用しています。通報地点の周囲を自動検索し、近くの施設名を表示します。',
          },
          {
            question: '通報した後はどうなりますか？',
            answer:
              '通報は自治体の担当者に届きます。担当者が内容を確認し、必要に応じて現地調査や対策を行います。通報のステータスは「確認待ち」から「確認完了」へと更新されます。',
          },
          {
            question: 'エラーが発生した場合はどうすればよいですか？',
            answer:
              'LINEでの通報中にエラーが発生した場合は、しばらく時間をおいてから再度メッセージを送信してください。それでも解決しない場合は、お住まいの自治体の担当窓口にお問い合わせください。',
          },
        ]}
      />

      <Divider />

      {/* 追加情報 */}
      <Card title="追加情報" padding="lg">
        <Disclosure>
          <DisclosureSummary>LINE通報に必要なもの</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <Ul className="ml-6">
              <li>LINEアプリ（スマートフォン）</li>
              <li>位置情報の送信（任意・住所自動取得に使用）</li>
              <li>
                カメラまたは写真ライブラリへのアクセス（任意・写真送信に使用）
              </li>
            </Ul>
          </div>
        </Disclosure>

        <Disclosure>
          <DisclosureSummary>推奨ブラウザ</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <Ul className="ml-6">
              <li>Google Chrome（最新版）</li>
              <li>Mozilla Firefox（最新版）</li>
              <li>Microsoft Edge（最新版）</li>
              <li>Safari（最新版）</li>
            </Ul>
          </div>
        </Disclosure>

        <Disclosure>
          <DisclosureSummary>利用しているサービス</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <Ul className="ml-6">
              <li>
                デザインシステム:{' '}
                <a
                  href="https://www.digital.go.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  デジタル庁
                </a>
              </li>
              <li>
                住所データ:{' '}
                <a
                  href="https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/reversegeocoder.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Yahoo!リバースジオコーダAPI
                </a>
              </li>
              <li>
                周辺施設データ:{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  OpenStreetMap
                </a>
              </li>
              <li>
                分析AI:{' '}
                <a
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Google Gemini
                </a>
              </li>
              <li>
                通報受付:{' '}
                <a
                  href="https://developers.line.biz/ja/services/messaging-api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  LINE Messaging API
                </a>
              </li>
              {isDemoMode && (
                <li>
                  クマ目撃情報データ（京都府）:{' '}
                  <a
                    href="https://odm.bodik.jp/tr/dataset/260002_bear"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    ODM by BODIK
                  </a>
                  {' / '}
                  ライセンス:{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    CC BY 4.0
                  </a>
                  {' / '}
                  当サイトで表示用に加工
                </li>
              )}
            </Ul>
          </div>
        </Disclosure>

        <Disclosure>
          <DisclosureSummary>お問い合わせ</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              システムに関するお問い合わせは、お住まいの自治体の担当窓口までご連絡ください。
            </p>
          </div>
        </Disclosure>
      </Card>

      <HelpChatbotSidebar />
    </div>
  );
}
