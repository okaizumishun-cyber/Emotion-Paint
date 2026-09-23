# Instagram連携 - 最終解決手順

## 現在の状況（スクリーンショット確認済み）

Graph API Explorerのスクリーンショットから判明したこと:
- ✅ 「ユーザーまたはページ」に**「アトリエ神流福祉会」**が選択されています
- ✅ これが唯一のFacebookページです（「アトリエ__かんな」は存在しません）
- ✅ ページアクセストークンのセクションに「アトリエ神流福祉会」が表示されています
- ❌ このページにInstagramビジネスアカウントがリンクされていません

## 問題の根本原因

**Facebookページ「アトリエ神流福祉会」にInstagramアカウントがリンクされていないため、Instagram APIが動作しません。**

## 解決手順（3ステップ）

### ステップ1: Instagram権限を追加してトークンを再生成

Graph API Explorerで（スクリーンショットの画面で）:

1. **「権限を追加」**をクリック（画面右側）

2. 以下の権限を検索して追加:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`

3. **「Generate Access Token」**ボタンをクリック

4. Instagram関連の権限を承認

5. 生成された新しいアクセストークンをコピー

6. `.env`ファイルを更新:
   ```env
   INSTAGRAM_ACCESS_TOKEN=<新しいトークン>
   ```

### ステップ2: InstagramをFacebookページにリンク

#### 方法A: Instagramアプリから（推奨）

1. **Instagramアプリ**を開く
2. **プロフィール**に移動
3. **メニュー（三本線）** → **設定とプライバシー**
4. **アカウントの種類とツール**をタップ
5. **プロアカウントに切り替える**（既にプロアカウントの場合はスキップ）
6. **ビジネス**を選択
7. 再度**設定とプライバシー** → **ビジネス**
8. **Facebookページ**をタップ
9. **「アトリエ神流福祉会」**を選択してリンク

#### 方法B: Meta Business Suiteから

1. https://business.facebook.com/ にアクセス
2. 左メニュー → **ビジネス設定**
3. **アカウント** → **Instagramアカウント**
4. **追加**をクリック
5. Instagramアカウントをリンク
6. 「アトリエ神流福祉会」ページを選択

#### 方法C: Facebookページから

1. 最初のスクリーンショットに表示されていた「アトリエ__かんな」ページにアクセス
   - または https://www.facebook.com/682808618259775
2. ページ設定 → **Instagram**
3. **「アカウントをリンク」**をクリック
4. Instagramのログイン情報を入力

### ステップ3: 正しいAccount IDを取得

リンクが完了したら:

```bash
node test-instagram-token.js
```

**期待される出力:**
```
✅ Token is valid!
User/Page: アトリエ神流福祉会
ID: 682808618259775

✅ Instagram Business Account found!
Account ID: 17841XXXXXXXXXX
```

表示されたAccount IDを`.env`ファイルに設定:

```env
INSTAGRAM_ACCOUNT_ID=17841XXXXXXXXXX
```

### ステップ4: サーバーを再起動

```bash
npm start
```

## 確認方法

1. アプリで作品を作成
2. 「ほぞん」ボタンをクリック
3. サインを描いて「かんせい！」
4. サーバーログを確認:
   ```
   ✅ Successfully posted to Instagram: 18XXXXXXXXXX
   ```

## トラブルシューティング

### 「Instagram Business Account found」と表示されない

**原因:** Instagramアカウントがビジネスアカウントではない、またはリンクが完了していない

**解決策:**
1. Instagramアプリ → プロフィール
2. 「プロフェッショナルダッシュボード」が表示されるか確認
3. 表示されない場合:
   - プロフィール → メニュー → 設定とプライバシー
   - アカウントの種類とツール → プロアカウントに切り替える
   - ビジネスを選択

### リンクボタンが見つからない

**Instagramアプリで確認:**
1. Instagram → 設定とプライバシー → ビジネス
2. 「Facebookページ」が表示されない場合:
   - アカウントがプロアカウント（ビジネスまたはクリエイター）であることを確認
   - アプリを最新版に更新

### 権限エラーが表示される

**Graph API Explorerで権限を再確認:**
1. https://developers.facebook.com/tools/explorer/
2. アクセストークンの横の「i」アイコンをクリック
3. 以下の権限があることを確認:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`

## 重要な注意事項

### 画像URLの問題

現在のコードは`thumbnailUrl`（base64データURL）を使用していますが、**Instagram APIは公開アクセス可能なHTTPS URLが必要**です。

リンクが完了しても、画像投稿には以下のエラーが発生する可能性があります:
```
Error validating image URL
```

**解決策:**
- Firebase Storageに画像をアップロードして公開URLを取得
- `FIREBASE_STORAGE_INSTAGRAM.md`を参照して実装

### アクセストークンの有効期限

- 短期トークン: 1時間
- 長期トークン: 60日

定期的に更新するか、自動更新機能を実装してください。

## 次のステップ

Instagram連携が成功したら:
1. ✅ Firebase Storage統合を実装（画像の公開URL取得）
2. ✅ カルーセル投稿（4方向の画像）のテスト
3. ✅ エラーハンドリングの改善
4. ✅ 投稿成功時のUI通知

## サポートリンク

- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
- [Meta Business Suite](https://business.facebook.com/)
