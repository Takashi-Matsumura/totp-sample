import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Database from '../../../../lib/database.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

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

    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      await db.close();
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await db.createUser(username, hashedPassword);
    await db.close();

    return NextResponse.json({
      message: 'ユーザー登録が完了しました',
      userId: user.id,
      username: user.username
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}