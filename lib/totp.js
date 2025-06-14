const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TotpManager {
  constructor() {
    this.issuer = 'MyNextJSApp';
  }

  generateSecret() {
    return speakeasy.generateSecret({
      name: this.issuer,
      length: 20, // 160 bits
    });
  }

  generateQRCode(secret, username) {
    // Manual otpauth URL construction to ensure we use the exact secret
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(username)}?secret=${secret.base32}&issuer=${encodeURIComponent(this.issuer)}&algorithm=SHA1&digits=6&period=30`;

    return new Promise((resolve, reject) => {
      QRCode.toDataURL(otpauthUrl, {
        width: 256,
        height: 256,
      }, (err, dataUrl) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            qrCodeDataUrl: dataUrl,
            otpauthUrl: otpauthUrl,
            secret: secret.base32
          });
        }
      });
    });
  }

  verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // ±60 seconds tolerance (expanded for testing)
      algorithm: 'sha1',
      digits: 6,
      step: 30,
    });
  }

  generateTokenForTesting(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      algorithm: 'sha1',
      digits: 6,
      step: 30,
    });
  }
}

module.exports = TotpManager;