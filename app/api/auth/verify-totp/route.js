import { NextResponse } from 'next/server';
import Database from '../../../../lib/database.js';
import TotpManager from '../../../../lib/totp.js';

export async function POST(request) {
  try {
    const { username, token, secret, isSetup } = await request.json();

    // Validate input
    if (!username || !token || !secret) {
      return NextResponse.json(
        { error: 'ユーザー名、トークン、シークレットは必須です' },
        { status: 400 }
      );
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: '無効なトークン形式です（6桁の数字を入力してください）' },
        { status: 400 }
      );
    }

    // Initialize TOTP manager
    const totpManager = new TotpManager();

    // Verify TOTP token
    const isValid = totpManager.verifyToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      );
    }

    // If this is for setup, save the secret to database
    if (isSetup) {
      const db = new Database();
      await db.connect();

      const result = await db.updateTotpSecret(username, secret);
      await db.close();

      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        valid: true,
        message: 'TOTP設定が完了しました'
      }, { status: 200 });
    }

    // For login verification
    return NextResponse.json({
      valid: true,
      message: 'トークンが検証されました'
    }, { status: 200 });

  } catch (error) {
    console.error('TOTP verification error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}