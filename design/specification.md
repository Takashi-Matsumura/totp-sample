# TOTP認証システム 設計指示書

## プロジェクト概要

このプロジェクトは、RFC 6238準拠のTOTP（Time-based One-Time Password）を使用したセキュアな認証システムをNext.js 15で実装したものです。Microsoft Authenticator（iPhone）との連携を前提とし、QRコードスキャンによる設定と6桁コードによる認証を実現しています。

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15.3.3 (App Router)
- **React**: 19.0.0
- **Styling**: Tailwind CSS v4
- **UI Pattern**: Client Component (`'use client'`) 

### バックエンド
- **API**: Next.js App Router API Routes (`app/api/*/route.js`)
- **Database**: SQLite3（開発用、簡単セットアップ）
- **Authentication**: JWT + TOTP

### 主要ライブラリ
- **speakeasy**: TOTP実装（RFC 6238準拠）
- **qrcode**: QRコード生成
- **bcryptjs**: パスワードハッシュ化
- **jsonwebtoken**: JWT認証
- **sqlite3**: データベース

## プロジェクト構造

```
totp-sample/
├── app/
│   ├── page.tsx                 # ホーム画面（ランディングページ）
│   ├── layout.tsx              # ルートレイアウト
│   ├── globals.css             # グローバルスタイル
│   ├── register/
│   │   └── page.js             # ユーザー登録画面
│   ├── setup-totp/
│   │   └── page.js             # TOTP設定画面（QRコード表示・検証）
│   ├── login/
│   │   └── page.js             # ログイン画面（パスワード + TOTP）
│   ├── dashboard/
│   │   └── page.js             # 認証後ダッシュボード
│   └── api/
│       └── auth/
│           ├── register/route.js     # ユーザー登録API
│           ├── setup-totp/route.js   # TOTP設定API
│           ├── verify-totp/route.js  # TOTP検証API
│           └── login/route.js        # ログインAPI
├── lib/
│   ├── database.js             # SQLiteデータベース操作クラス
│   └── totp.js                 # TOTP処理クラス
├── design/
│   └── specification.md        # 本設計指示書
├── .env.local                  # 環境変数（JWT_SECRET）
├── users.db                    # SQLiteデータベースファイル（自動生成）
├── package.json
└── CLAUDE.md                   # Claude Code用プロジェクト情報
```

## データベース設計

### usersテーブル
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,           -- bcryptハッシュ
  totp_secret TEXT,                -- Base32秘密鍵
  totp_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API設計

### 1. ユーザー登録API
- **エンドポイント**: `POST /api/auth/register`
- **入力**: `{ username: string, password: string }`
- **処理**: 
  - ユーザー名重複チェック
  - パスワードbcryptハッシュ化（salt rounds: 10）
  - データベース保存
- **出力**: `{ message: string, userId: number, username: string }`

### 2. TOTP設定API
- **エンドポイント**: `POST /api/auth/setup-totp`
- **入力**: `{ username: string }`
- **処理**:
  - 160bit秘密鍵生成
  - otpauth:// URI生成（Microsoft Authenticator互換）
  - QRコード画像生成（PNG, Base64, 256x256px）
- **出力**: `{ qrCodeDataUrl: string, otpauthUrl: string, secret: string }`

### 3. TOTP検証API
- **エンドポイント**: `POST /api/auth/verify-totp`
- **入力**: `{ username: string, token: string, secret: string, isSetup: boolean }`
- **処理**:
  - speakeasyによるTOTP検証（window: ±2ステップ = ±60秒許容）
  - 設定時は秘密鍵をデータベース保存
- **出力**: `{ valid: boolean, message: string }`

### 4. ログインAPI
- **エンドポイント**: `POST /api/auth/login`
- **入力**: `{ username: string, password: string, totpToken?: string }`
- **処理**:
  - パスワード検証
  - TOTP有効時は6桁コード検証
  - JWT生成（24時間有効、HS256アルゴリズム）
- **出力**: `{ token: string, user: object }` または `{ requireTotp: true }`

## TOTP実装仕様

### アルゴリズム設定
- **準拠規格**: RFC 6238（TOTP）, RFC 4226（HOTP）
- **ハッシュアルゴリズム**: HMAC-SHA1
- **時間ステップ**: 30秒
- **桁数**: 6桁
- **時間窓**: ±2ステップ（±60秒許容）
- **秘密鍵長**: 160bit（20バイト）

### otpauth URI形式
```
otpauth://totp/MyNextJSApp:username?secret=BASE32SECRET&issuer=MyNextJSApp&algorithm=SHA1&digits=6&period=30
```

### QRコード仕様
- **形式**: PNG
- **サイズ**: 256x256px
- **出力**: Base64 DataURL

## UI/UX設計

### デザインシステム
- **CSSフレームワーク**: Tailwind CSS
- **カラーパレット**: Indigo系（primary）、Gray系（neutral）
- **レイアウト**: レスポンシブデザイン、カード型UI
- **フォント**: Geist Sans、Geist Mono（Next.js標準）

### 画面フロー
1. **ホーム画面** → 新規登録 or ログイン選択
2. **ユーザー登録** → TOTP設定画面へ自動遷移
3. **TOTP設定** → 2ステップ形式（QRコード表示 → 6桁コード入力）
4. **ログイン** → パスワード認証 → TOTP認証（条件付き）
5. **ダッシュボード** → 認証情報表示

### 状態管理
- **認証状態**: localStorage（authToken, user）
- **セットアップ状態**: localStorage（setupUsername, setupQRCode, setupSecret）
- **フォーム状態**: React useState

## セキュリティ要件

### 1. パスワードセキュリティ
- **ハッシュ化**: bcrypt（salt rounds: 10）
- **保存**: 平文パスワードは保存しない

### 2. TOTP秘密鍵管理
- **生成**: crypto.randomBytes（160bit）
- **エンコーディング**: Base32
- **保存**: データベース内（平文、本番環境では暗号化推奨）

### 3. セッション管理
- **JWT**: HS256アルゴリズム
- **有効期限**: 24時間
- **保存場所**: localStorage（フロントエンド）

### 4. API セキュリティ
- **入力検証**: 必須パラメータチェック
- **エラーハンドリング**: 適切なHTTPステータスコードとメッセージ

## 開発ガイドライン

### コーディング規約
- **Next.js App Router**を使用
- **Client Component**は`'use client'`ディレクティブを明記
- **API Routes**は`route.js`ファイルで実装
- **エラーハンドリング**は必須（try-catch、適切なレスポンス）
- **デバッグログ**は`console.log`で出力（本番では削除）

### ファイル命名規則
- **ページコンポーネント**: `page.js` （Client Component）
- **APIルート**: `route.js`
- **ライブラリ**: `lib/*.js` （CommonJS）
- **スタイル**: Tailwind CSS クラス使用

### 依存関係管理
- **必須パッケージ**: speakeasy, qrcode, sqlite3, bcryptjs, jsonwebtoken
- **バージョン固定**: package.jsonで明示的に指定

## テスト要件

### 手動テスト項目
1. **ユーザー登録フロー**
   - 重複ユーザー名エラー確認
   - 正常登録とTOTP設定遷移確認

2. **TOTP設定フロー**
   - QRコード生成と表示確認
   - Microsoft Authenticator追加確認
   - 6桁コード検証確認

3. **ログインフロー**
   - パスワード認証確認
   - TOTP認証確認
   - JWT生成と画面遷移確認

4. **エラーハンドリング**
   - 無効なTOTPコード
   - ネットワークエラー
   - データベースエラー

## 環境設定

### 必須環境変数（.env.local）
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-environment-for-security
```

### 開発コマンド
```bash
npm run dev    # 開発サーバー起動
npm run build  # 本番ビルド
npm run start  # 本番サーバー起動
npm run lint   # ESLint実行
```

## Microsoft Authenticator連携

### QRコード読み取り手順
1. Microsoft Authenticatorアプリ起動
2. 「+」ボタン → 「他のアカウント（Google、Facebook等）」
3. 「QRコードをスキャン」選択
4. QRコード読み取り
5. アカウント名「MyNextJSApp:username」で追加

### 表示形式
- **サービス名**: MyNextJSApp
- **アカウント**: username
- **コード**: 6桁数字
- **更新間隔**: 30秒

## トラブルシューティング

### よくある問題と解決法

1. **「SQLITE_ERROR: no such table: users」**
   - 原因: データベーステーブル未作成
   - 解決: `lib/database.js`の`connect()`メソッドで`initializeTables()`を適切にawait

2. **「無効なトークンです」（TOTP検証エラー）**
   - 原因: 秘密鍵の不一致、時刻同期問題
   - 解決: デバッグログで秘密鍵確認、時間窓拡大（window: 2）

3. **QRコード生成で異なる秘密鍵**
   - 原因: speakeasy.otpauthURL()の内部秘密鍵生成
   - 解決: 手動でotpauth URL構築

4. **ページリロードで新しい秘密鍵生成**
   - 原因: useEffectでの重複実行
   - 解決: localStorageで秘密鍵保存・再利用

## 拡張可能性

### 将来の機能追加候補
- **レート制限**: API呼び出し制限
- **監査ログ**: 認証イベント記録
- **バックアップコード**: TOTP無効時の代替認証
- **複数デバイス対応**: 1ユーザー複数TOTP
- **管理画面**: ユーザー管理機能

### セキュリティ強化
- **秘密鍵暗号化**: データベース内暗号化
- **セッション管理改善**: httpOnlyクッキー使用
- **CSRFトークン**: フォーム送信保護
- **レスポンスヘッダー**: セキュリティヘッダー追加

## 完成目標

Microsoft AuthenticatorアプリでQRコードをスキャンして登録し、30秒ごとに更新される6桁のTOTPコードでログインできるセキュアなNext.jsアプリケーション。実際のGitHubやMicrosoft 365で使用している認証フローと同等の体験を提供する。