/**
 * Canvas2D readback操作の警告を抑制するためのパッチ
 *
 * leaflet.heat（内部でsimpleheatを使用）は、ヒートマップ描画時に
 * canvas.getContext('2d') で取得したコンテキストに対して getImageData を
 * 頻繁に呼び出す。willReadFrequently: true が設定されていないと、
 * ブラウザが以下の警告を出力する:
 *
 *   Canvas2D: Multiple readback operations using getImageData are faster
 *   with the willReadFrequently attribute set to true.
 *
 * leaflet.heatはメンテナンスされておらず、ライブラリ内部を直接変更できないため、
 * HTMLCanvasElement.prototype.getContext をラップして、2dコンテキスト取得時に
 * 自動的に willReadFrequently: true を付与する。
 *
 * パッチはヒートマップレイヤーの初期化前に1回だけ適用する。
 * leaflet.heatのCanvas生成はレイヤー追加時とredraw時に発生するため、
 * 恒久的にパッチを適用しておく必要がある。
 * このアプリケーションではcanvas 2Dコンテキストを使用するのはleaflet.heatのみ
 * であるため、他のコンポーネントへの影響はない。
 */

let patched = false;

export function patchCanvasWillReadFrequently(): void {
  if (patched) return;
  if (typeof HTMLCanvasElement === 'undefined') return;

  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    options?: Record<string, unknown>
  ): RenderingContext | null {
    if (contextId === '2d') {
      const mergedOptions = { willReadFrequently: true, ...options };
      return originalGetContext.call(this, contextId, mergedOptions);
    }
    return originalGetContext.call(this, contextId, options);
  } as typeof originalGetContext;

  patched = true;
}
