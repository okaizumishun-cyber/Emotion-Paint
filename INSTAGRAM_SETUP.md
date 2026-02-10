# Instagram自動投稿セットアップガイド

このガイドでは、Emotion PaintアプリにInstagram自動投稿機能を設定する手順を説明します。

## 前提条件
- Instagramアカウント（Business または Creator アカウント）
- Facebookページ（Instagramアカウントとリンク済み）
- Facebook Developersアカウント

---

## ステップ1: .envファイルの作成

1. プロジェクトのルートディレクトリで`.env.example`をコピーして`.env`を作成:

```bash
copy .env.example .env
```

または手動で`.env`ファイルを作成し、以下の内容をコピー:

```
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id_here

# Server Configuration
PORT=3000
```

---

## ステップ2: Instagram Business/Creatorアカウントの取得

### 2-1. Instagramアカウントをビジネスアカウントに変換

1. Instagramアプリを開く
2. プロフィール → メニュー（三本線）→ 設定
3. 「アカウント」→「プロアカウントに切り替える」
4. 「ビジネス」または「クリエイター」を選択
5. カテゴリを選択して完了

### 2-2. FacebookページとInstagramをリンク

1. Facebookページを作成（まだない場合）
2. Facebookページの設定 → Instagram
3. 「アカウントをリンク」をクリック
4. Instagramのログイン情報を入力してリンク

---

## ステップ3: Facebook Developersでアプリを作成

### 3-1. Facebook Developersにアクセス

1. https://developers.facebook.com/ にアクセス
2. 右上の「マイアプリ」→「アプリを作成」をクリック

### 3-2. アプリタイプを選択

1. 「ビジネス」を選択
2. 「次へ」をクリック

### 3-3. アプリの詳細を入力

1. **アプリ表示名**: `Emotion Paint` (任意の名前)
2. **アプリの連絡先メールアドレス**: あなたのメールアドレス
3. **ビジネスアカウント**: 選択（オプション）
4. 「アプリを作成」をクリック

### 3-4. Instagram Graph APIを追加

1. ダッシュボードで「製品を追加」をクリック
2. 「Instagram」を探して「設定」をクリック
3. Instagram Graph APIが追加されます

---

## ステップ4: アクセストークンとアカウントIDを取得

### 4-1. Graph APIエクスプローラーを使用

1. https://developers.facebook.com/tools/explorer/ にアクセス
2. 右上で作成したアプリを選択
3. 「ユーザーまたはページ」→ リンクしたFacebookページを選択

### 4-2. 必要な権限を追加

1. 「権限を追加」をクリック
2. 以下の権限を検索して追加:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
3. 「アクセストークンを生成」をクリック
4. Instagramアカウントへのアクセスを許可

### 4-3. アクセストークンをコピー

1. 生成されたアクセストークンをコピー
2. `.env`ファイルの`INSTAGRAM_ACCESS_TOKEN`に貼り付け

### 4-4. Instagram Business Account IDを取得

1. Graph APIエクスプローラーで以下のクエリを実行:

```
me?fields=instagram_business_account
```

2. 「送信」をクリック
3. レスポンスから`instagram_business_account.id`をコピー
4. `.env`ファイルの`INSTAGRAM_ACCOUNT_ID`に貼り付け

**例:**
```json
{
  "instagram_business_account": {
    "id": "17841405309211844"
  },
  "id": "..."
}
```

### 4-5. 長期アクセストークンに変換（推奨）

短期トークン（1時間有効）を長期トークン（60日有効）に変換:

1. 以下のURLにアクセス（パラメータを置き換え）:

```
https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app-id}&
  client_secret={app-secret}&
  fb_exchange_token={short-lived-token}
```

- `{app-id}`: アプリID（ダッシュボードで確認）
- `{app-secret}`: アプリシークレット（ダッシュボード → 設定 → ベーシック）
- `{short-lived-token}`: 先ほど取得したトークン

2. レスポンスの`access_token`を`.env`に設定

---

## ステップ5: 依存関係のインストール

プロジェクトディレクトリで以下を実行:

```bash
npm install
```

これにより`dotenv`パッケージがインストールされます。

---

## ステップ6: サーバーの再起動

```bash
npm start
```

サーバーが起動したら、以下のメッセージが表示されます:

```
Server running at http://localhost:3000
Controller: http://localhost:3000?role=controller
Viewer:     http://localhost:3000?role=viewer
```

---

## テスト

### 手動テスト（Postmanまたはcurl）

```bash
curl -X POST http://localhost:3000/api/instagram/post \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "caption": "Test post from Emotion Paint"
  }'
```

### アプリからのテスト

1. コントローラーで作品を作成
2. 「ほぞん」ボタンをクリック
3. サインを描いて「かんせい！」
4. QRコードが表示されたら成功
5. サーバーログでInstagram投稿の成功を確認

---

## トラブルシューティング

### エラー: "Instagram API not configured"

- `.env`ファイルが正しく作成されているか確認
- `INSTAGRAM_ACCESS_TOKEN`と`INSTAGRAM_ACCOUNT_ID`が設定されているか確認
- サーバーを再起動

### エラー: "Failed to create Instagram media container"

- アクセストークンが有効か確認（期限切れの可能性）
- 権限が正しく設定されているか確認
- 画像URLが公開アクセス可能か確認（Instagram APIは公開URLが必要）

### エラー: "OAuthException"

- アクセストークンを再生成
- アプリの権限を再確認
- Instagramアカウントがビジネスアカウントであることを確認

---

## 注意事項

1. **画像URL**: Instagram Graph APIは公開アクセス可能な画像URLが必要です。現在の実装ではbase64データURLを使用していますが、本番環境では画像をFirebase StorageやS3にアップロードしてURLを取得する必要があります。

2. **レート制限**: Instagram APIには投稿数の制限があります（1時間あたり25投稿など）。

3. **アクセストークンの更新**: 長期トークンも60日で期限切れになります。定期的に更新するか、トークンリフレッシュ機能を実装してください。

4. **テストモード**: 開発中はアプリが「開発モード」になっています。本番環境では「ライブモード」に切り替える必要があります。

---

## 次のステップ

Instagram自動投稿が動作したら、以下の機能拡張を検討してください:

- [ ] 画像をFirebase Storageにアップロードして公開URLを取得
- [ ] 投稿成功時のUI通知
- [ ] 投稿履歴の表示
- [ ] ハッシュタグの自動追加
- [ ] 複数画像投稿（カルーセル）のサポート

---

## 参考リンク

- [Instagram Graph API ドキュメント](https://developers.facebook.com/docs/instagram-api)
- [Content Publishing API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [アクセストークンの取得](https://developers.facebook.com/docs/instagram-api/getting-started)
