import { NextResponse } from 'next/server';
import Database from '../../../../lib/database.js';
import TotpManager from '../../../../lib/totp.js';

export async function POST(request) {
  try {
    const { username } = await request.json();

    // Validate input
    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名は必須です' },
        { status: 400 }
      );
    }

    // Initialize database and TOTP manager
    const db = new Database();
    await db.connect();
    const totpManager = new TotpManager();

    // Check if user exists
    const user = await db.getUserByUsername(username);
    if (!user) {
      await db.close();
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // Generate TOTP secret
    const secret = totpManager.generateSecret();
    
    // Generate QR code
    const qrData = await totpManager.generateQRCode(secret, username);
    
    await db.close();

    return NextResponse.json({
      qrCodeDataUrl: qrData.qrCodeDataUrl,
      otpauthUrl: qrData.otpauthUrl,
      secret: qrData.secret,
      message: 'TOTP設定用のQRコードが生成されました'
    }, { status: 200 });

  } catch (error) {
    console.error('TOTP setup error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}