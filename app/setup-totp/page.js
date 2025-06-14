'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupTOTP() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem('setupUsername');
    if (!storedUsername) {
      router.push('/register');
      return;
    }
    setUsername(storedUsername);
    
    // Check if we already have QR data
    const storedQRCode = localStorage.getItem('setupQRCode');
    const storedSecret = localStorage.getItem('setupSecret');
    
    if (storedQRCode && storedSecret) {
      // Use existing QR data
      setQrCode(storedQRCode);
      setSecret(storedSecret);
    } else {
      // Generate new QR code
      generateQRCode(storedUsername);
    }
  }, [router]);

  const generateQRCode = async (username) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/setup-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCodeDataUrl);
        setSecret(data.secret);
        // Store QR data to prevent regeneration
        localStorage.setItem('setupQRCode', data.qrCodeDataUrl);
        localStorage.setItem('setupSecret', data.secret);
      } else {
        setError(data.error || 'QRコードの生成に失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          token: totpToken,
          secret,
          isSetup: true
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // Clear stored data
        localStorage.removeItem('setupUsername');
        localStorage.removeItem('setupQRCode');
        localStorage.removeItem('setupSecret');
        // Redirect to login
        router.push('/login?setup=success');
      } else {
        setError(data.error || 'トークンの検証に失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatSecret = (secret) => {
    return secret.replace(/(.{4})/g, '$1 ').trim();
  };

  if (loading && !qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">QRコードを生成中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          TOTP認証設定
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Microsoft Authenticatorで2段階認証を設定
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ステップ 1: QRコードをスキャン
                </h3>
                
                {qrCode && (
                  <div className="mb-6">
                    <img 
                      src={qrCode} 
                      alt="TOTP QR Code" 
                      className="mx-auto border rounded-lg shadow-sm"
                    />
                  </div>
                )}

                <div className="space-y-4 text-sm text-gray-600">
                  <p><strong>Microsoft Authenticatorでの設定手順:</strong></p>
                  <ol className="list-decimal list-inside space-y-2 text-left">
                    <li>Microsoft Authenticatorアプリを開く</li>
                    <li>「+」ボタンをタップ</li>
                    <li>「他のアカウント（Google、Facebook等）」を選択</li>
                    <li>「QRコードをスキャン」をタップ</li>
                    <li>上のQRコードを読み取る</li>
                  </ol>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>手動入力キー:</strong>
                  </p>
                  <p className="text-xs font-mono bg-white p-2 rounded border">
                    {formatSecret(secret)}
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  次のステップへ
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ステップ 2: 認証コードを入力
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Microsoft Authenticatorに表示されている6桁のコードを入力してください
                </p>
              </div>

              <form onSubmit={handleVerifyToken} className="space-y-6">
                <div>
                  <label htmlFor="totpToken" className="block text-sm font-medium text-gray-700">
                    認証コード（6桁）
                  </label>
                  <div className="mt-1">
                    <input
                      id="totpToken"
                      name="totpToken"
                      type="text"
                      maxLength="6"
                      pattern="[0-9]{6}"
                      required
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg font-mono"
                      placeholder="123456"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    コードは30秒ごとに更新されます
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    戻る
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totpToken.length !== 6}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '検証中...' : '設定完了'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}