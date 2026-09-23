# Instagram連携 - 今すぐ実行する手順

## 現在の状況
- ❌ Facebookページ「アトリエ__かんな」にInstagramアカウントがリンクされていません
- ❌ `.env`のAccount ID `918191083991142` は無効です
- ✅ アクセストークンは有効です（ページ名: アトリエ.神流福祉会、ID: 682808618259775）

**注意:** アクセストークンは「アトリエ.神流福祉会」ページに紐付いていますが、スクリーンショットでは「アトリエ__かんな」というページが表示されています。正しいページにInstagramをリンクする必要があります。

## 今すぐ実行する3ステップ

### ステップ1: InstagramをFacebookページにリンク（5分）

#### 方法A: Instagramアプリから（推奨）

1. **Instagramアプリを開く**
2. **プロフィール画面**に移動
3. **メニュー（三本線）**をタップ
4. **設定とプライバシー**をタップ
5. **アカウントの種類とツール**をタップ
6. **プロアカウントに切り替える**をタップ（既にプロアカウントの場合はスキップ）
7. **ビジネス**を選択
8. カテゴリを選択して完了
9. 再度**設定とプライバシー** → **ビジネス**に移動
10. **Facebookページ**をタップ
11. **「アトリエ__かんな」**または**「アトリエ.神流福祉会」**を選択してリンク
    - スクリーンショットでは「アトリエ__かんな」が表示されています
    - アクセストークンは「アトリエ.神流福祉会」(ID: 682808618259775)に紐付いています
    - **どちらのページを使用するか確認してください**

#### 方法B: Facebookページから

1. ブラウザで以下のURLにアクセス:
   ```
   https://www.facebook.com/682808618259775
   ```

2. ページ設定に移動

3. 左メニューから**Instagram**を選択

4. **「アカウントをリンク」**をクリック

5. Instagramのログイン情報を入力

6. リンクを承認

### ステップ2: 正しいAccount IDを取得（1分）

リンクが完了したら、以下のコマンドを実行:

```bash
node test-instagram-token.js
```

**期待される出力:**
```
✅ Instagram Business Account found!
Account ID: 17841XXXXXXXXXX
```

このAccount IDをコピーしてください。

### ステップ3: .envファイルを更新（1分）

`.env`ファイルを開いて、`INSTAGRAM_ACCOUNT_ID`を更新:

```env
INSTAGRAM_ACCOUNT_ID=<ステップ2でコピーしたID>
```

保存して、サーバーを再起動:

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

### 「Instagramアカウントが見つかりません」と表示される場合

**原因:** Instagramアカウントがビジネスアカウントではない、またはリンクが完了していない

**解決策:**
1. Instagramアプリ → プロフィール
2. 「プロフェッショナルダッシュボード」が表示されるか確認
3. 表示されない場合は、ステップ1を再度実行

### リンクボタンが見つからない場合

**Meta Business Suiteを使用:**

1. https://business.facebook.com/ にアクセス
2. 左メニューから**ビジネス設定**をクリック
3. **アカウント** → **Instagramアカウント**
4. **追加**をクリック
5. Instagramアカウントをリンク

### それでも解決しない場合

**新しいアクセストークンを生成:**

1. https://developers.facebook.com/tools/explorer/ にアクセス
2. 右上でアプリを選択
3. 「ユーザーまたはページ」で**「アトリエ.神流福祉会」**を選択
4. 「権限を追加」をクリック
5. 以下の権限を追加:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
6. 「アクセストークンを生成」をクリック
7. 新しいトークンを`.env`の`INSTAGRAM_ACCESS_TOKEN`に設定
8. `node test-instagram-token.js`を再実行

## 重要な注意事項

### 画像URLの問題

現在のコードは`thumbnailUrl`（base64データURL）を使用していますが、Instagram APIは**公開アクセス可能なHTTPS URL**が必要です。

**一時的な解決策:**
- Firebase Storageなどに画像をアップロードして公開URLを取得する必要があります

**長期的な解決策:**
- `FIREBASE_STORAGE_INSTAGRAM.md`を参照してFirebase Storage統合を実装

### アクセストークンの有効期限

現在のトークンは60日で期限切れになります。定期的に更新するか、自動更新機能を実装してください。

## 次のステップ

Instagram連携が成功したら:
1. ✅ Firebase Storage統合を実装（画像の公開URL取得）
2. ✅ カルーセル投稿（4方向の画像）のテスト
3. ✅ エラーハンドリングの改善
4. ✅ 投稿成功時のUI通知

## サポートリンク

- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
- [Link Instagram to Facebook Page](https://www.facebook.com/business/help/898752960195806)
- [Meta Business Suite](https://business.facebook.com/)
- [Facebook Developers](https://developers.facebook.com/)
