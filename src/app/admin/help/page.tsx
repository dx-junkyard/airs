import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Blockquote from '@/components/ui/Blockquote/Blockquote';
import { Card } from '@/components/ui/Card/Card';
import Disclosure from '@/components/ui/Disclosure/Disclosure';
import DisclosureSummary from '@/components/ui/Disclosure/DisclosureSummary';
import Divider from '@/components/ui/Divider/Divider';
import { FAQSection } from '@/components/ui/FAQSection/FAQSection';
import Ol from '@/components/ui/Ol/Ol';
import Ul from '@/components/ui/Ul/Ul';
import AdminChatbotSidebar from '@/features/admin-chatbot/components/AdminChatbotSidebar';

/** セクションナビゲーション定義 */
const HELP_SECTIONS = [
  { id: 'quickstart', label: 'クイックスタートガイド' },
  { id: 'faq', label: 'よくある質問（FAQ）' },
  { id: 'additional', label: '追加情報' },
] as const;

export default function AdminHelpPage() {
  return (
    <div className="space-y-8">
      {/* 対象ユーザーの説明 */}
      <Card padding="lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faScrewdriverWrench}
              className="size-6 shrink-0 text-blue-700"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-blue-900">
              管理者向けヘルプ
            </h2>
          </div>
          <p className="text-sm text-solid-gray-600">
            このページでは、管理者が通報管理・職員管理・データ分析・システム設定などの管理機能を操作する方法についてご案内します。LINEでの通報方法など一般利用者向けの情報は
            <a
              href="/help"
              className="text-blue-600 underline underline-offset-2"
            >
              一般利用者向けヘルプ
            </a>
            をご覧ください。
          </p>
        </div>
      </Card>

      {/* セクションナビゲーション（目次） */}
      <nav
        aria-label="ヘルプセクション"
        className={`
          rounded-lg border border-solid-gray-200 bg-solid-gray-50 px-6 py-4
        `}
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {HELP_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`
                  text-sm text-blue-900 underline-offset-2
                  hover:underline
                `}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* クイックスタートガイド */}
      <Card
        id="quickstart"
        title="管理者向けクイックスタートガイド"
        padding="lg"
        className="scroll-mt-28"
      >
        <div className="space-y-6">
          <Blockquote>
            管理者向けの操作ガイドです。通報の管理・編集、職員管理、データ分析、ダッシュボード、システム設定など、管理機能の使い方を説明します。右下のヘルプアシスタントからチャットで質問することもできます。
          </Blockquote>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              1. 通報を管理する
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>サイドメニューの「通報管理」をクリックして通報一覧を表示</li>
              <li>
                キーワード検索、ステータスフィルター（確認待ち・確認完了）、獣種フィルター、担当職員フィルターで通報を絞り込み
              </li>
              <li>
                詳細フィルターを展開すると、期間指定や並び順の変更ができます
              </li>
              <li>リスト表示と地図表示を切り替えて通報を確認できます</li>
              <li>
                通報をクリックして詳細画面を開き、内容の確認・編集を行います
              </li>
              <li>
                ステータスを「確認待ち」→「確認完了」に更新して進捗を管理
              </li>
              <li>担当職員を割り当てて対応者を明確にします</li>
              <li>
                「新規作成」ボタンから管理者として通報を手動で登録することもできます
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              2. 地図で通報状況を確認する
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>通報管理画面の「地図」ボタンで地図表示に切り替え</li>
              <li>
                地図上のマーカーで目撃場所を確認（獣種ごとに色・アイコンが異なります）
              </li>
              <li>マーカーをクリックすると通報の詳細をポップアップで表示</li>
              <li>同じエリアの通報はクラスター表示でまとめて表示されます</li>
              <li>
                詳細フィルターからタイムライン表示をオンにすると、時間経過に沿った通報の変化を確認できます
              </li>
              <li>
                サイドメニューの「地図表示」から全画面地図を開くこともできます
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              3. 職員を管理する
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>サイドメニューの「職員管理」をクリックして職員一覧を表示</li>
              <li>「新規作成」から新しい職員を登録</li>
              <li>職員をクリックして名前などの情報を編集</li>
              <li>職員を通報の担当者として割り当てられます</li>
              <li>
                ヘッダー右上の職員セレクターで自分の名前を選択すると、操作時に自動的に担当者として設定されます
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              4. AI データ分析を使う
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>
                サイドメニューの「地図表示」を開き、パネルの「分析AI」タブからチャットに自然言語で質問を入力
              </li>
              <li>
                検索タイプの質問例：「確認待ちの通報を探して」「最近1週間のクマの目撃情報を表示して」
              </li>
              <li>
                分析タイプの質問例：「今月の通報の傾向を分析して」「地域別の通報分布を分析して」「先月と比べて通報の増減はある？」
              </li>
              <li>
                AIがデータベースを自動検索し、結果をテーブルやグラフで表示します
              </li>
              <li>検索結果は地図上にもピン表示され、視覚的に確認できます</li>
              <li>
                周辺施設（学校・公園・病院など）の情報も併せて分析できます
              </li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              5. 統計ダッシュボードを確認する
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>ホーム画面で通報件数、ステータス別の割合を確認</li>
              <li>獣種別の分布をグラフで確認</li>
              <li>通報件数の推移をトレンドチャートで確認</li>
              <li>時間帯別の通報傾向を分析</li>
              <li>通報の多いエリアランキングを確認</li>
              <li>直近24時間の通報グループサマリーを確認</li>
              <li>期間フィルターで分析対象の期間を変更できます</li>
            </Ol>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              6. システム設定を変更する
            </h3>
            <Ol className="ml-6 space-y-2">
              <li>サイドメニューの「システム設定」をクリック</li>
              <li>
                ジオフェンス（住所プレフィックス）：通報を受け付ける地域を制限
              </li>
              <li>
                クラスタリング設定：通報を自動グループ化する時間・距離の閾値を調整
              </li>
              <li>対応動物種別：システムで扱う動物種別を選択</li>
              <li>
                LINEセッションタイムアウト：LINE通報チャットのセッション有効期間を設定
              </li>
              <li>地図デフォルト座標：地図の初期表示位置を設定</li>
              <li>分析AIのおすすめ質問：分析AI画面に表示する質問候補を編集</li>
            </Ol>
          </div>
        </div>
      </Card>

      <Divider />

      {/* FAQ */}
      <FAQSection
        id="faq"
        className="scroll-mt-28"
        title="よくある質問（FAQ）"
        items={[
          {
            question: '通報のステータスにはどのような種類がありますか？',
            answer:
              '以下の2種類があります：\n・確認待ち（waiting）：新規通報の初期状態\n・確認完了（completed）：対応が完了した状態',
          },
          {
            question: '通報を削除できますか？',
            answer:
              '通報詳細画面から削除できます。削除した通報は論理削除（ソフトデリート）となり、通常の画面には表示されなくなります。',
          },
          {
            question: '通報を手動で登録するにはどうすればいいですか？',
            answer:
              '通報管理画面の「新規作成」ボタンをクリックし、動物種別・住所・位置情報・状況説明などを入力して登録してください。LINE以外のルート（電話など）で受けた通報を手動登録する場合に便利です。',
          },
          {
            question: '職員の追加・編集はどのように行いますか？',
            answer:
              '「職員管理」画面から操作できます。「新規作成」ボタンで新しい職員を登録し、一覧から職員をクリックして詳細の確認・編集が可能です。登録した職員は通報の担当者として割り当てられます。',
          },
          {
            question: '通報グループと通報の関係は何ですか？',
            answer:
              '通報グループは近接した時間・場所での複数の通報を自動的にグループ化したものです。同じエリアで短期間に発生した通報が1つの通報グループにまとめられ、一括で進捗管理できます。通報グループに担当職員を割り当てると、関連する通報にも反映されます。',
          },
          {
            question: '分析AIではどのような質問ができますか？',
            answer:
              '自然言語でデータの検索や分析ができます。\n\n検索例：\n・「確認待ちの通報を探して」\n・「最近1週間のクマの目撃情報を表示して」\n\n分析例：\n・「今月の通報の傾向を分析して」\n・「地域別の通報分布を分析して」\n・「先月と比べて通報の増減はある？」\n・「時間帯別の出没パターンを教えて」\n\nAIがデータベースを検索し、結果をテーブルや地図上のピン表示で返します。',
          },
          {
            question: '地図のタイムライン機能とは何ですか？',
            answer:
              '通報管理画面の地図モードで「タイムライン表示」をオンにすると、通報の発生を時系列で再生できます。スライダーを動かして、指定期間内の通報がどのように発生したかをアニメーションで確認できます。推定表示期間も調整可能です。',
          },
          {
            question: '地図上のマーカーの色は何を表していますか？',
            answer:
              'マーカーの色は動物の種類を表しています。獣種ごとに異なる色で表示され、地図の凡例で確認できます。クラスター表示により、同じエリアの複数の通報がまとめて表示される場合があります。',
          },
          {
            question: 'ジオフェンス設定とは何ですか？',
            answer:
              'ジオフェンスは通報を受け付ける地域を制限する機能です。システム設定の「ジオフェンス住所プレフィックス」に設定した住所で始まる場所からの通報のみ受け付けます。例えば「東京都」と設定すると、東京都内の住所からの通報のみが有効になります。',
          },
          {
            question: 'クラスタリング設定とは何ですか？',
            answer:
              'クラスタリング設定は、通報を通報グループに自動グループ化する条件を制御します。\n・時間（分）：この時間内に発生した通報を同じ通報グループとしてグループ化\n・半径（メートル）：この距離内の通報を同じ通報グループとしてグループ化\n\nシステム設定画面から閾値を調整できます。',
          },
          {
            question: 'ダッシュボードではどのような統計を確認できますか？',
            answer:
              'ホーム画面のダッシュボードでは以下の統計を確認できます：\n・ステータス別の通報件数と割合\n・獣種別の通報分布（棒グラフ）\n・通報件数の推移（トレンドチャート）\n・時間帯別の通報傾向\n・通報の多いエリアランキング（上位10件）\n・直近24時間の通報グループサマリー\n\n期間フィルターで分析対象の期間を変更できます。',
          },
          {
            question: 'ヘルプアシスタント（チャットボット）の使い方は？',
            answer:
              '画面右下の青いボタンをクリックするとヘルプアシスタントが開きます。システムの使い方に関する質問をチャット形式で入力すると、AIが回答します。おすすめの質問が表示されるので、クリックして質問することもできます。',
          },
        ]}
      />

      <Divider />

      {/* 追加情報 */}
      <Card
        id="additional"
        title="追加情報"
        padding="lg"
        className="scroll-mt-28"
      >
        <Disclosure>
          <DisclosureSummary>管理メニュー一覧</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <Ul className="ml-6 space-y-1">
              <li>
                <strong>通報管理</strong>
                ：通報の検索・フィルタリング・詳細確認・編集・ステータス更新・新規作成・削除
              </li>
              <li>
                <strong>職員管理</strong>
                ：職員の登録・編集・一覧表示
              </li>
              <li>
                <strong>システム設定</strong>
                ：ジオフェンス・クラスタリング・動物種別・LINEタイムアウト・地図座標・分析AI質問
              </li>
              <li>
                <strong>管理者用ヘルプ</strong>
                ：このページ + AIチャットボット
              </li>
            </Ul>
          </div>
        </Disclosure>

        <Disclosure>
          <DisclosureSummary>ツールメニュー一覧</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <Ul className="ml-6 space-y-1">
              <li>
                <strong>統計ダッシュボード</strong>
                ：通報統計のグラフ表示
              </li>
              <li>
                <strong>地図表示</strong>
                ：全画面地図で通報の位置を確認・AIデータ分析
              </li>
              <li>
                <strong>AI獣害通報</strong>
                ：AI対話形式の通報シミュレーター
              </li>
              <li>
                <strong>ヘルプ</strong>
                ：一般利用者向けヘルプ（LINE通報の使い方など）
              </li>
            </Ul>
          </div>
        </Disclosure>

        <Disclosure>
          <DisclosureSummary>お問い合わせ</DisclosureSummary>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              システムに関するお問い合わせは、システム管理者までご連絡ください。
            </p>
          </div>
        </Disclosure>
      </Card>

      {/* チャットボット */}
      <AdminChatbotSidebar />
    </div>
  );
}
