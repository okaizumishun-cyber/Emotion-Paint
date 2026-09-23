# 次のステップ - Instagramテスター承認後

## 現在の状況（スクリーンショット確認）

✅ **素晴らしい！Instagramテスターとして追加されました！**

スクリーンショットから確認できること:
- ✅ ビジネスアカウント「Atelier for KANNNAHUKUSHIKAI」にアプリがリンクされました
- ✅ Instagramテスター: `atelier_kanna1212`が追加されました
- ⚠️ ステータス: **「承認待ち」**（オレンジ色）

## 次に必要なこと

### ステップ1: Instagramアプリでテスター招待を承認

1. **Instagramアプリを開く**（スマートフォン）

2. **プロフィール画面**に移動

3. **メニュー（三本線）**をタップ

4. **設定とプライバシー**をタップ

5. **ウェブサイトの権限**または**アプリとウェブサイト**をタップ

6. **「テスター招待」**タブを探す

7. **「Emotion Paint」からの招待を承認**
   - 「承認」または「Accept」ボタンをタップ

8. **数分待つ**
   - 承認が反映されるまで少し時間がかかる場合があります

### ステップ2: 承認を確認

1. **Facebook Developersの画面に戻る**
   - 現在のスクリーンショットの画面

2. **ページを更新**（F5キー）

3. **ステータスを確認**
   - 「承認待ち」（オレンジ） → 「承認済み」（緑）に変わるはず

### ステップ3: 新しいアクセストークンを生成

承認が完了したら:

1. **Graph API Explorerにアクセス**
   - https://developers.facebook.com/tools/explorer/

2. **アプリを選択**
   - 右上のドロップダウンで「Emotion Paint」を選択

3. **ユーザーまたはページを選択**
   - 「アトリエ神流福祉会」または「Atelier for KANNNAHUKUSHIKAI」を選択

4. **権限を追加**
   - 「権限を追加」ボタンをクリック
   - 以下の権限を検索して追加:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_read_engagement`
     - `pages_show_list`

5. **アクセストークンを生成**
   - 「Generate Access Token」ボタンをクリック
   - Instagram関連の権限を承認
   - 生成されたトークンをコピー

6. **`.env`ファイルを更新**
   ```env
   INSTAGRAM_ACCESS_TOKEN=<新しいトークン>
   ```

### ステップ4: Instagram Account IDを取得

1. **コマンドプロンプトを開く**

2. **プロジェクトディレクトリに移動**
   ```bash
   cd c:\Users\okaiz\.gemini\antigravity\scratch\I-finalcollege
   ```

3. **テストスクリプトを実行**
   ```bash
   node test-instagram-token.js
   ```

4. **期待される出力**
   ```
   ✅ Token is valid!
   User/Page: Atelier for KANNNAHUKUSHIKAI
   ID: XXXXXXXXX

   ✅ Instagram Business Account found!
   Account ID: 17841XXXXXXXXXX
   ```

5. **Account IDをコピー**

### ステップ5: .envファイルを更新

1. **`.env`ファイルを開く**

2. **INSTAGRAM_ACCOUNT_IDを更新**
   ```env
   INSTAGRAM_ACCOUNT_ID=17841XXXXXXXXXX
   ```

3. **保存**

### ステップ6: サーバーを再起動

1. **現在のサーバーを停止**（Ctrl+C）

2. **サーバーを再起動**
   ```bash
   npm start
   ```

### ステップ7: テスト

1. **アプリで作品を作成**
   - Controller: http://localhost:3000?role=controller
   - Viewer: http://localhost:3000?role=viewer

2. **「ほぞん」ボタンをクリック**

3. **サインを描いて「かんせい！」**

4. **サーバーログを確認**
   ```
   ✅ Successfully posted to Instagram: 18XXXXXXXXXX
   ```

## トラブルシューティング

### Instagramアプリで「テスター招待」が見つからない

**場所を確認:**
1. Instagram → 設定とプライバシー
2. 「ウェブサイトの権限」または「アプリとウェブサイト」
3. 「アクティブ」「期限切れ」「削除済み」のタブを確認
4. 「テスター招待」という別のタブがある場合もあります

**表示されない場合:**
- 数分待ってから再確認
- Instagramアプリを最新版に更新
- アプリを再起動

### 承認後も「Instagram Business Account found」と表示されない

**原因:** InstagramアカウントがFacebookページにリンクされていない

**解決策:**
1. Instagramアプリ → 設定とプライバシー → ビジネス
2. 「Facebookページ」をタップ
3. 「Atelier for KANNNAHUKUSHIKAI」または「アトリエ神流福祉会」を選択してリンク

### 「Error validating image URL」エラーが表示される

**原因:** Instagram APIは公開HTTPS URLが必要（base64データURLは使用不可）

**解決策:**
- Firebase Storageに画像をアップロードして公開URLを取得
- `FIREBASE_STORAGE_INSTAGRAM.md`を参照して実装

## 重要な注意事項

### 画像URLの問題

現在のコードは`thumbnailUrl`（base64データURL）を使用していますが、Instagram APIは**公開アクセス可能なHTTPS URL**が必要です。

Instagram Account IDの取得が成功しても、実際の投稿には以下のエラーが発生する可能性があります:
```
Error validating image URL
```

**次のステップ:**
1. ✅ Instagram Account IDを取得（今回）
2. ✅ Firebase Storage統合を実装（次回）
3. ✅ 画像を公開URLとしてアップロード
4. ✅ Instagram投稿をテスト

## まとめ

現在の進捗:
- ✅ Instagramテスターとして追加完了
- ⏳ Instagramアプリで承認待ち ← **今ここ**
- ⏳ 新しいアクセストークンを生成
- ⏳ Instagram Account IDを取得
- ⏳ Firebase Storage統合（画像URL問題の解決）

次にやること:
1. **Instagramアプリでテスター招待を承認**
2. **Graph API Explorerで新しいトークンを生成**
3. **`node test-instagram-token.js`を実行**
4. **`.env`ファイルを更新**
5. **サーバーを再起動してテスト**

頑張ってください！もうすぐ完成です！🎉
