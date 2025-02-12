const crypto = require('crypto');

const TheKeyPairController = {
    generateKeyPair: async (req, res) => {
        const { modulusLength } = req.body;
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: modulusLength,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        res.json({ publicKey, privateKey });
    },
};

module.exports = TheKeyPairController;