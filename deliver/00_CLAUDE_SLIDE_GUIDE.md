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
| **`package.json`** | システム構成・依存ライブラリ一覧（Express, Socket.io, dotenv。※Firebase SDKはブラウザ側でCDNより読み込み）。 |
| **`firestore.rules`** | **【Firestoreセキュリティルール】**<br>作品ドキュメントの作成（匿名認証・許可フィールド限定）のみを許可し、読み取り・更新・削除を全面禁止した本番ルール。 |
| **`storage.rules`** | **【Cloud Storageセキュリティルール】**<br>作品画像（JPEG/PNG、5MB以下、匿名認証）のアップロードと公開読み取りのみを許可し、上書き・削除を全面禁止した本番ルール。 |

---
