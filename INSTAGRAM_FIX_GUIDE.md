# Instagram API エラー対処法

## 問題の診断結果

エラーメッセージ:
```
Unsupported post request. Object with ID '25445533551790862' does not exist, 
cannot be loaded due to missing permissions, or does not support this operation.
```

診断テストの結果:
- ✅ アクセストークンは有効
- ✅ Facebookページ「アトリエ.神流福祉会」に接続済み
- ❌ **このFacebookページにInstagramビジネスアカウントがリンクされていません**

## 根本原因

現在の`.env`ファイルに設定されている`INSTAGRAM_ACCOUNT_ID=25445533551790862`は、このFacebookページにリンクされていないか、存在しないアカウントIDです。

## 解決方法

### ステップ1: InstagramアカウントをFacebookページにリンクする

1. **Instagramアプリでビジネスアカウントに変換**
   - Instagramアプリを開く
   - プロフィール → メニュー（三本線）→ 設定とプライバシー
   - 「アカウントの種類とツール」→「プロアカウントに切り替える」
   - 「ビジネス」を選択してセットアップを完了

2. **FacebookページとInstagramをリンク**
   
   **方法A: Instagramアプリから**
   - Instagramアプリ → プロフィール → メニュー → 設定とプライバシー
   - 「ビジネス」→「Facebookページ」
   - 「アトリエ.神流福祉会」ページを選択してリンク

   **方法B: Facebookページから**
   - https://www.facebook.com/682808618259775 にアクセス
   - ページ設定 → Instagram
   - 「アカウントをリンク」をクリック
   - Instagramのログイン情報を入力

3. **リンクを確認**
   - https://www.facebook.com/settings?tab=business_tools にアクセス
   - 「Instagram」セクションでリンクされたアカウントを確認

### ステップ2: 正しいInstagram Account IDを取得

リンクが完了したら、以下のコマンドを実行:

```bash
node test-instagram-token.js
```

このスクリプトが正しいInstagram Account IDを表示します。

### ステップ3: .envファイルを更新

スクリプトが表示した正しいAccount IDで`.env`ファイルを更新:

```
INSTAGRAM_ACCOUNT_ID=<新しいID>
INSTAGRAM_ACCESS_TOKEN=<現在のトークン>
```

### ステップ4: サーバーを再起動

```bash
npm start
```

## 追加の確認事項

### アクセストークンの権限を確認

現在のトークンに必要な権限があるか確認:

1. https://developers.facebook.com/tools/explorer/ にアクセス
2. アクセストークンの横の「i」アイコンをクリック
3. 以下の権限があることを確認:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`

権限が不足している場合:
1. Graph API Explorerで「権限を追加」
2. 上記の権限を追加
3. 「アクセストークンを生成」をクリック
4. 新しいトークンを`.env`ファイルに設定

### 長期アクセストークンに変換（推奨）

現在のトークンは短期間で期限切れになる可能性があります。長期トークン（60日有効）に変換:

1. Facebook Developersダッシュボードでアプリを開く
2. 「ツール」→「アクセストークンツール」
3. 「長期トークンを取得」をクリック
4. 生成されたトークンを`.env`に設定

または、以下のURLにアクセス（パラメータを置き換え）:

```
https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={YOUR_APP_ID}&
  client_secret={YOUR_APP_SECRET}&
  fb_exchange_token={YOUR_SHORT_LIVED_TOKEN}
```

## トラブルシューティング

### 「Instagram Business Account found」と表示されない場合

1. Instagramアカウントが本当にビジネスアカウントか確認
   - Instagramアプリ → プロフィール
   - 「プロフェッショナルダッシュボード」が表示されるか確認

2. Facebookページとのリンクを解除して再リンク
   - Instagram → 設定 → ビジネス → Facebookページ
   - リンクを解除 → 再度リンク

3. 別のFacebookページを試す
   - 新しいFacebookページを作成
   - そのページにInstagramをリンク

### それでも解決しない場合

1. **Meta Business Suiteを使用**
   - https://business.facebook.com/ にアクセス
   - Instagramアカウントを追加
   - ビジネスアカウントとして設定

2. **アプリの権限を再確認**
   - Facebook Developersダッシュボード
   - アプリレビュー → 権限とフィーチャー
   - Instagram関連の権限が承認されているか確認

3. **新しいアクセストークンを生成**
   - 古いトークンを削除
   - Graph API Explorerで新しいトークンを生成
   - すべての必要な権限を追加

## 参考リンク

- [Instagram Graph API - Getting Started](https://developers.facebook.com/docs/instagram-api/getting-started)
- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
- [Link Instagram to Facebook Page](https://www.facebook.com/business/help/898752960195806)
- [Meta Business Suite](https://business.facebook.com/)

## 次のステップ

Instagram連携が成功したら:
1. ✅ 作品を保存してInstagram投稿をテスト
2. ✅ カルーセル投稿（4方向の画像）が正しく動作するか確認
3. ✅ キャプションとハッシュタグが正しく表示されるか確認
