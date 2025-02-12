const crypto = require('crypto');

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
};

module.exports = EDSController;