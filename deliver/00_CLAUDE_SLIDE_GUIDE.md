# Emotion-Paint スライド制作引き渡し用ガイド (Deliver Guide)

このフォルダは、**Claude (Claude Pro / Projects / Claude Design)** に本システムの設計スライドや解説プレゼンテーションを作成してもらうための引き渡し用データ一式です。

---

## 📁 フォルダ内のファイル構成と役割

| ファイル名 | 役割・内容 |
| :--- | :--- |
| **`SYSTEM_ARCHITECTURE_FOR_CLAUDE.md`** | **【最重要・完全仕様書】**<br>システム全体概要、基本5要素（入力・処理・出力・NW・電源）、物理/論理配線、WebSocketイベント、25種類のツールと感情推測ロジック、Canvas UVマッピング、TOP/END形状構造の完全解説。 |
| **`index.html`** | **【フロントエンド完全実装】**<br>`public/index.html` の複製。手元タブレット（Controller）のお絵描きUI・オノマトペアイコン、正面の縦型モニター（Viewer）のThree.js 3D陶器レンダリング、GLSLシェーダー、Socket.io通信の実装コード。 |
| **`server.js`** | **【バックエンド完全実装】**<br>Google Cloud Run 上で動作するシステム本体。低遅延Socket.ioブロードキャスト中継、および Instagram Graph API へのカルーセル自動投稿処理。 |
| **`system_architecture_slide.html`** | **【スライド完成見本】**<br>Tailwind CSSで構築した白黒モダン（Monochrome Modern）な16:9スライドHTML。左側に基本5要素、右側に機材連携図を配置した洗練されたレイアウト見本。 |
| **`process2_hardware_diagram.html`** | **【機材連携設計図】**<br>物理配線（AC電源、USB-PD給電、HDMI映像）と論理通信（Wi-Fi、WebSocket、クラウド）を視覚化したSVGダイアグラム（PNG/SVG書き出しボタン付き）。 |
| **`package.json`** | システム構成・依存ライブラリ一覧（Express, Socket.io, Firebase, dotenv等）。 |

---

## 💡 Claude へのスライド制作指示プロンプト（コピペ用）

Claude のチャットや Project にこれらのファイルを添付・参照させた上で、以下のプロンプトをそのまま送信してください：

```text
添付された「SYSTEM_ARCHITECTURE_FOR_CLAUDE.md」および「index.html」の設計仕様を読み込み、
Claude Design（Artifacts）を使用して、プレゼンテーション用スライド（16:9比率）を作成してください。

【デザイン・レイアウト要件】
1. トーン＆マナー:
   - 白黒ベースのモダン・ミニマル（Monochrome Modern）。建築やデザイン事務所の設計図のような洗練されたデザイン。
2. 画面構成（16:9横型スライド）:
   - 左側（または上部）: システム基本5要素（入力・処理・出力・NW・電源）の構造化カード
   - 右側（または下部）: 機材連携設計図（手元タブレット ⇄ 会場ルーター ⇄ 縦型モニター ⇄ Cloud Run ⇄ Instagram）
3. 正確な用語の遵守:
   - 会場表記: 「店舗」ではなく「会場」
   - モニター表記: 「会場モニター」ではなく「縦型モニター」
   - QRコード: 「手元タブレット」の画面に表示され、お客さんがスマホで読み取ってInstagramを開く
   - 25ツールの通信: ペン15種は「draw（PNG画像）」、エフェクト10種は「emotion（スライダー数値）」
   - 壺の構造: 肉厚を持った中空構造。上端（TOP）は口の縁と内壁空洞、下端（END）は底面ディスク
4. 機能要件:
   - スライド右上に「印刷 / PDF保存」ができるボタンを配置してください。
```
