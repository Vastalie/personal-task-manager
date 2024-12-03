const crypto = require('crypto');

const algorithm = 'aes-256-cbc'; // AES algorithm
const ivLength = 16; // Initialization vector length

// Encrypt function
const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex') };
};

// Decrypt function
const decrypt = (encryptedData, ivHex) => {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const key = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');
console.log('Using hardcoded key:', key.toString('hex'));
module.exports = { encrypt, decrypt };
