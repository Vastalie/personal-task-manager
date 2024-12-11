// Import the crypto module
const crypto = require('crypto');

// AES (advanced encryption standard) algorithm
// Initialisation vector length
const algorithm = 'aes-256-cbc'; 
const ivLength = 16; 

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

// Define a hardcoded 256-bit encryption key, log it for debugging, 
//and export the encrypt and decrypt functions for use across application
const key = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');
console.log('Using hardcoded key:', key.toString('hex'));
module.exports = { encrypt, decrypt };



