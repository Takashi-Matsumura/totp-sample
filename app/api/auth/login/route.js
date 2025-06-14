import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from '../../../../lib/database.js';
import TotpManager from '../../../../lib/totp.js';

export async function POST(request) {
  try {
    const { username, password, totpToken } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードは必須です' },
        { status: 400 }
      );
    }

    // Initialize database
    const db = new Database();
    await db.connect();

    // Get user with TOTP info
    const user = await db.getUserWithTotp(username);
    if (!user) {
      await db.close();
      return NextResponse.json(
        { error: '無効なログイン情報です' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await db.close();
      return NextResponse.json(
        { error: '無効なログイン情報です' },
        { status: 401 }
      );
    }

    // Check if TOTP is enabled
    if (user.totp_enabled && user.totp_secret) {
      // TOTP token is required
      if (!totpToken) {
        await db.close();
        return NextResponse.json(
          { 
            error: '2段階認証コードが必要です',
            requireTotp: true
          },
          { status: 200 }
        );
      }

      // Validate TOTP token format
      if (!/^\d{6}$/.test(totpToken)) {
        await db.close();
        return NextResponse.json(
          { error: '無効なトークン形式です（6桁の数字を入力してください）' },
          { status: 400 }
        );
      }

      // Verify TOTP token
      const totpManager = new TotpManager();
      const isTotpValid = totpManager.verifyToken(totpToken, user.totp_secret);

      if (!isTotpValid) {
        await db.close();
        return NextResponse.json(
          { error: '無効な2段階認証コードです' },
          { status: 401 }
        );
      }
    }

    await db.close();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'サーバー設定エラーです' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        totpEnabled: user.totp_enabled 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      message: 'ログインに成功しました',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        totpEnabled: user.totp_enabled
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}