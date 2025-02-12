const crypto = require('crypto');
const { exec } = require('child_process');

const EDSController = {
    eds_calculation: async (req, res) => {
        try {
            const { text, privateKey } = req.body;

            if (!text || !privateKey) {
                return res.status(400).json({ error: 'Missing required parameters: text and privateKey' });
            }

            const sign = crypto.createSign('SHA256');
            sign.update(text);
            let signature;
            try {
                signature = sign.sign(privateKey, 'hex');
            } catch (error) {
                return res.status(400).json({ error: 'Invalid private key format. Ensure the private key is in PEM format.' });
            }

            res.json({ signature });

        } catch (error) {
            console.error('Error during EDS calculation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    eds_verification: async (req, res) => {
        try {
            const { text, signature, publicKey } = req.body;

            if (!text || !signature || !publicKey) {
                return res.status(400).json({ error: 'Missing required parameters: text, signature, and publicKey' });
            }

            const verify = crypto.createVerify('SHA256');
            verify.update(text);
            const isVerified = verify.verify(publicKey, signature, 'hex');

            res.json({ isVerified });

        } catch (error) {
            console.error('Error during EDS verification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    eds_encrypt: async (req, res) => {
        try {
            const { text, privateKey } = req.body;

            if (!text || !privateKey) {
                return res.status(400).json({ error: 'Missing required parameters: text and privateKey' });
            }

            const encrypted = crypto.privateEncrypt(privateKey, Buffer.from(text)).toString('hex');

            res.json({ encrypted });

        } catch (error) {
            console.error('Error during encryption:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    eds_decrypt: async (req, res) => {
        try {
            const { encryptedText, publicKey } = req.body;

            if (!encryptedText || !publicKey) {
                return res.status(400).json({ error: 'Missing required parameters: encryptedText and publicKey' });
            }

            const decrypted = crypto.publicDecrypt(publicKey, Buffer.from(encryptedText, 'hex')).toString();

            res.json({ decrypted });

        } catch (error) {
            console.error('Error during decryption:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = EDSController;