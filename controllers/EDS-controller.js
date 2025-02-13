const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EDSController = {
    edsCalculation: async (req, res) => {
        const { text, privateKey } = req.body;

        if (!text || !privateKey) {
            return res.status(400).json({ error: 'Missing required parameters: text and privateKey' });
        }

        try {
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

    edsVerification: async (req, res) => {
        const { text, signature, publicKey } = req.body;

        if (!text || !signature || !publicKey) {
            return res.status(400).json({ error: 'Missing required parameters: text, signature, and publicKey' });
        }

        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(text);

            const isVerified = verify.verify(publicKey, signature, 'hex');
            res.json({ isVerified });
        } catch (error) {
            console.error('Error during EDS verification:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getKeyPairs: async (req, res) => {
        const databasePath = ('./models/database.json');

        try {
            const data = fs.readFileSync(databasePath, 'utf8');
            const database = JSON.parse(data);

            const keyPairs = Object.entries(database).map(([id, keys]) => ({
                id,
                publicKey: keys.publicKey,
                privateKey: keys.privateKey,
            }));

            res.json(keyPairs);
        } catch (error) {
            console.error('Error loading key pairs:', error);
            res.status(500).json({ error: 'Failed to load key pairs' });
        }
    },
};

module.exports = EDSController;