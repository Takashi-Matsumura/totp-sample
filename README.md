# TOTP認証システム サンプルアプリケーション

Microsoft Authenticatorとの連携を前提としたTOTP（Time-based One-Time Password）認証システムのデモンストレーションアプリケーションです。RFC 6238準拠の二要素認証を実装し、実際のエンタープライズアプリケーションと同等のセキュアな認証フローを提供します。

## 主な機能

- **ユーザー登録・ログイン**: パスワード認証とTOTP二要素認証
- **TOTP設定**: QRコードによるMicrosoft Authenticator連携
- **セキュアな認証**: JWT + bcrypt + TOTP による多層認証
- **リアルタイム認証**: 30秒更新の6桁TOTPコード対応

## 技術スタック

- **フロントエンド**: Next.js 15.3.3 (App Router), React 19.0.0, Tailwind CSS v4
- **バックエンド**: Next.js API Routes, SQLite3, JWT認証
- **TOTP実装**: speakeasy (RFC 6238準拠), qrcode生成
- **セキュリティ**: bcryptjs (パスワードハッシュ), jsonwebtoken

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-environment-for-security
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 使用方法

### 1. ユーザー登録
- ホーム画面から「新規登録」を選択
- ユーザー名とパスワードを入力して登録

### 2. TOTP設定
- 登録後、自動的にTOTP設定画面に遷移
- 表示されるQRコードをMicrosoft Authenticatorでスキャン
- Authenticatorに表示される6桁コードを入力して設定完了

### 3. ログイン
- パスワード入力後、Microsoft Authenticatorの6桁コードを入力
- 認証成功でダッシュボードに遷移

## Microsoft Authenticator 設定手順

1. Microsoft Authenticatorアプリを起動
2. 「+」ボタン → 「他のアカウント（Google、Facebook等）」を選択
3. 「QRコードをスキャン」を選択
4. アプリで表示されるQRコードをスキャン
5. アカウント名「MyNextJSApp:ユーザー名」で追加完了

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # 本番ビルド
npm run start  # 本番サーバー起動
npm run lint   # ESLint実行
```

## プロジェクト構成

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # ホーム画面
│   ├── register/          # ユーザー登録
│   ├── setup-totp/        # TOTP設定
│   ├── login/             # ログイン
│   ├── dashboard/         # ダッシュボード
│   └── api/auth/          # 認証API
├── lib/                   # ライブラリ
│   ├── database.js        # SQLite操作
│   └── totp.js           # TOTP処理
├── design/               # 設計仕様書
├── users.db             # データベースファイル（自動生成）
└── .env.local           # 環境変数
```

## TOTP仕様

- **準拠規格**: RFC 6238 (TOTP), RFC 4226 (HOTP)
- **アルゴリズム**: HMAC-SHA1
- **時間ステップ**: 30秒
- **桁数**: 6桁
- **時間窓**: ±60秒許容
- **秘密鍵長**: 160bit

## セキュリティ機能

- **パスワード**: bcrypt ハッシュ化（salt rounds: 10）
- **TOTP秘密鍵**: 160bit暗号学的安全な鍵生成
- **JWT**: HS256アルゴリズム、24時間有効期限
- **入力検証**: 全APIエンドポイントで実装

## 詳細仕様

プロジェクトの詳細な技術仕様や設計方針については、[design/specification.md](./design/specification.md) を参照してください。

## ライセンス

このプロジェクトはサンプル・学習目的で作成されています。
