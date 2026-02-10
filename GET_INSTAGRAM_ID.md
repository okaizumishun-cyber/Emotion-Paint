# Instagram Business Account ID 取得手順

## 簡単な方法（推奨）

### 1. Graph APIエクスプローラーを使用

1. **Graph APIエクスプローラーにアクセス**
   - https://developers.facebook.com/tools/explorer/ を開く

2. **アプリとページを選択**
   - 右上の「Meta App」で作成したアプリを選択
   - 「User or Page」で、InstagramとリンクしているFacebookページを選択

3. **必要な権限を追加**
   - 「Permissions」タブをクリック
   - 以下の権限を検索して追加（チェックを入れる）:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_read_engagement`
   - 「Generate Access Token」をクリック
   - ポップアップで権限を許可

4. **Instagram Account IDを取得**
   - クエリボックスに以下を入力:
     ```
     me?fields=instagram_business_account
     ```
   - 「Submit」ボタンをクリック

5. **結果からIDをコピー**
   - レスポンスに以下のような形式で表示されます:
     ```json
     {
       "instagram_business_account": {
         "id": "17841405309211844"
       },
       "id": "..."
     }
     ```
   - `instagram_business_account.id` の値（数字の部分）をコピー

6. **.envファイルに設定**
   - コピーしたIDを `.env` ファイルの `INSTAGRAM_ACCOUNT_ID` に貼り付け
   - 例: `INSTAGRAM_ACCOUNT_ID=17841405309211844`

---

## トラブルシューティング

### エラー: "instagram_business_account" が表示されない

**原因**: Instagramアカウントがビジネスアカウントでないか、Facebookページとリンクされていない

**解決方法**:
1. Instagramアプリでアカウントをビジネスアカウントに変換
   - プロフィール → メニュー → 設定 → アカウント → プロアカウントに切り替える
2. FacebookページとInstagramをリンク
   - Facebookページの設定 → Instagram → アカウントをリンク

### エラー: 権限エラー

**原因**: 必要な権限が付与されていない

**解決方法**:
1. Graph APIエクスプローラーで「Permissions」タブを確認
2. 必要な権限がすべてチェックされているか確認
3. 「Generate Access Token」を再度クリック

---

## 次のステップ

Instagram Account IDを取得したら:

1. `.env` ファイルを更新
2. サーバーを再起動: `npm start`
3. Instagram自動投稿機能をテスト

---

## 参考

現在の設定状況:
- ✅ アクセストークン: 設定済み
- ❌ アカウントID: 未設定（上記手順で取得してください）
- ✅ Instagram URL: https://www.instagram.com/atelier_kanna1212/
