# Facebookページの確認が必要です

## 現在の状況

スクリーンショットを確認したところ、**2つの異なるFacebookページ**が存在する可能性があります:

1. **「アトリエ__かんな」** - スクリーンショットに表示されているページ
2. **「アトリエ.神流福祉会」** (ID: 682808618259775) - 現在のアクセストークンに紐付いているページ

## 重要な質問

**どちらのFacebookページを使用してInstagram投稿を行いたいですか？**

### オプション1: 「アトリエ__かんな」を使用する場合

スクリーンショットに表示されているページを使用する場合:

1. **新しいアクセストークンを生成する必要があります**
   - https://developers.facebook.com/tools/explorer/ にアクセス
   - 「ユーザーまたはページ」で**「アトリエ__かんな」**を選択
   - 必要な権限を追加:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_read_engagement`
     - `pages_show_list`
   - 「アクセストークンを生成」をクリック
   - 新しいトークンを`.env`に設定

2. **Instagramアカウントを「アトリエ__かんな」にリンク**
   - Instagramアプリ → 設定 → ビジネス → Facebookページ
   - 「アトリエ__かんな」を選択

3. **Account IDを取得**
   ```bash
   node test-instagram-token.js
   ```

### オプション2: 「アトリエ.神流福祉会」を使用する場合（現在のトークン）

現在のアクセストークンをそのまま使用する場合:

1. **Instagramアカウントを「アトリエ.神流福祉会」にリンク**
   - Instagramアプリ → 設定 → ビジネス → Facebookページ
   - 「アトリエ.神流福祉会」を選択
   - または、ブラウザで https://www.facebook.com/682808618259775 にアクセスしてリンク

2. **Account IDを取得**
   ```bash
   node test-instagram-token.js
   ```

## 推奨事項

**スクリーンショットに表示されている「アトリエ__かんな」を使用することをお勧めします。**

理由:
- スクリーンショットでこのページが表示されているということは、現在アクティブに使用しているページである可能性が高い
- Instagramアカウントがすでにこのページにリンクされている可能性がある

## 次のステップ

どちらのページを使用するか決定したら:

1. **オプション1を選択した場合:**
   - 新しいアクセストークンを生成
   - `.env`ファイルを更新
   - `node test-instagram-token.js`を実行
   - 表示されたAccount IDを`.env`に設定

2. **オプション2を選択した場合:**
   - Instagramを「アトリエ.神流福祉会」にリンク
   - `node test-instagram-token.js`を実行
   - 表示されたAccount IDを`.env`に設定

## 確認方法

正しく設定されているか確認:

```bash
node test-instagram-token.js
```

以下のような出力が表示されれば成功:
```
✅ Token is valid!
User/Page: アトリエ__かんな (または アトリエ.神流福祉会)
ID: XXXXXXXXX

✅ Instagram Business Account found!
Account ID: 17841XXXXXXXXXX
```

## サポート

どちらのページを使用すべきか不明な場合は、以下を確認してください:

1. **Instagramアプリで現在リンクされているページを確認**
   - Instagram → 設定 → ビジネス → Facebookページ
   - 現在リンクされているページ名を確認

2. **Meta Business Suiteで確認**
   - https://business.facebook.com/ にアクセス
   - リンクされているInstagramアカウントとFacebookページを確認

3. **両方のページを確認**
   - https://www.facebook.com/682808618259775 (アトリエ.神流福祉会)
   - スクリーンショットの「アトリエ__かんな」ページ
   - どちらがメインで使用しているページか確認
