# 「開発者の役割が不十分です」エラーの解決方法

## エラーの意味

「開発者の役割が不十分です」というエラーは、Facebookアプリの**開発モード**で、必要な権限やテストユーザーの設定が不足していることを示しています。

## 解決方法

### オプション1: テストユーザーとしてInstagramアカウントを追加（推奨）

1. **Facebook Developersダッシュボードにアクセス**
   - https://developers.facebook.com/apps/
   - あなたのアプリ（Emotion Paint）を選択

2. **「役割」セクションに移動**
   - 左メニュー → **「役割」** → **「役割」**

3. **Instagramテスターを追加**
   - 左メニュー → **「役割」** → **「Instagramテスター」**
   - **「Instagramテスターを追加」**をクリック
   - あなたのInstagramユーザー名を入力
   - **「送信」**をクリック

4. **Instagramアプリで承認**
   - Instagramアプリを開く
   - **設定とプライバシー** → **アプリとウェブサイト**
   - **「テスター招待」**セクションで承認

5. **Graph API Explorerで再試行**
   - https://developers.facebook.com/tools/explorer/
   - 権限を追加して新しいトークンを生成

### オプション2: アプリをライブモードに切り替える

**注意:** 本番環境で使用する場合のみ推奨

1. **Facebook Developersダッシュボード**
   - https://developers.facebook.com/apps/
   - あなたのアプリを選択

2. **アプリレビューを確認**
   - 左メニュー → **「アプリレビュー」** → **「権限とフィーチャー」**
   - 必要な権限が承認されているか確認:
     - `instagram_basic`
     - `instagram_content_publish`

3. **アプリをライブモードに切り替え**
   - ダッシュボード上部の**「開発モード」**スイッチをクリック
   - **「ライブモード」**に切り替え
   - 確認ダイアログで承認

4. **注意事項**
   - ライブモードに切り替える前に、アプリレビューで必要な権限を申請・承認する必要があります
   - 個人使用の場合は、テストユーザーとして追加する方が簡単です

### オプション3: 開発者として自分を追加

1. **Facebook Developersダッシュボード**
   - https://developers.facebook.com/apps/
   - あなたのアプリを選択

2. **「役割」に移動**
   - 左メニュー → **「役割」** → **「役割」**

3. **管理者または開発者を追加**
   - **「ユーザーを追加」**をクリック
   - あなたのFacebookアカウントを追加
   - 役割: **「管理者」**または**「開発者」**を選択

4. **Facebookで承認**
   - Facebookの通知を確認
   - 役割を承認

### オプション4: ビジネスアカウントを使用

1. **Meta Business Suiteを設定**
   - https://business.facebook.com/ にアクセス
   - ビジネスアカウントを作成（まだない場合）

2. **Facebookページとアプリをビジネスに追加**
   - ビジネス設定 → **「アカウント」** → **「ページ」**
   - 「アトリエ神流福祉会」ページを追加
   - ビジネス設定 → **「アカウント」** → **「アプリ」**
   - あなたのアプリを追加

3. **Instagramアカウントをビジネスに追加**
   - ビジネス設定 → **「アカウント」** → **「Instagramアカウント」**
   - **「追加」**をクリック
   - Instagramアカウントをリンク

4. **システムユーザーを作成（オプション）**
   - ビジネス設定 → **「ユーザー」** → **「システムユーザー」**
   - システムユーザーを作成してトークンを生成

## 推奨される手順（最も簡単）

### ステップ1: Instagramテスターとして追加

1. https://developers.facebook.com/apps/ にアクセス
2. アプリを選択
3. 左メニュー → **「役割」** → **「Instagramテスター」**
4. あなたのInstagramユーザー名を追加
5. Instagramアプリで承認

### ステップ2: 権限を追加してトークンを再生成

1. https://developers.facebook.com/tools/explorer/ にアクセス
2. アプリを選択
3. 「ユーザーまたはページ」で「アトリエ神流福祉会」を選択
4. **「権限を追加」**をクリック
5. 以下を追加:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
6. **「Generate Access Token」**をクリック
7. 新しいトークンを`.env`にコピー

### ステップ3: テスト

```bash
node test-instagram-token.js
```

期待される出力:
```
✅ Token is valid!
User/Page: アトリエ神流福祉会
ID: 682808618259775

✅ Instagram Business Account found!
Account ID: 17841XXXXXXXXXX
```

## トラブルシューティング

### 「Instagramテスター」メニューが見つからない

**原因:** アプリにInstagram製品が追加されていない

**解決策:**
1. ダッシュボード → **「製品を追加」**
2. **「Instagram」**を探して**「設定」**をクリック
3. Instagram Graph APIが追加されます
4. 再度「役割」→「Instagramテスター」を確認

### テスター招待が表示されない

**Instagramアプリで確認:**
1. Instagram → **設定とプライバシー**
2. **「アプリとウェブサイト」**
3. **「テスター招待」**タブを確認
4. 表示されない場合は、数分待ってから再確認

### 権限を追加できない

**原因:** アプリレビューが必要な権限

**解決策（開発モードの場合）:**
- テストユーザーとして追加すれば、アプリレビューなしで権限を使用できます
- 本番環境では、アプリレビューを申請する必要があります

## 参考リンク

- [Facebook App Roles](https://developers.facebook.com/docs/development/build-and-test/app-roles)
- [Instagram Testers](https://developers.facebook.com/docs/instagram-api/overview#instagram-testers)
- [App Review](https://developers.facebook.com/docs/app-review)
- [Meta Business Suite](https://business.facebook.com/)

## 次のステップ

Instagramテスターとして追加され、権限が正しく設定されたら:

1. ✅ 新しいアクセストークンを生成
2. ✅ `.env`ファイルを更新
3. ✅ `node test-instagram-token.js`を実行
4. ✅ Instagram Account IDを取得
5. ✅ サーバーを再起動してテスト
