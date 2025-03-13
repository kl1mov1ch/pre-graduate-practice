const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TheKeyPairController = {
    generateKeyPair: async (req, res) => {
        const modulusLength = parseInt(req.body.modulusLength, 10) || 2048;

        if (isNaN(modulusLength) || modulusLength < 512 || modulusLength > 16384) {
            return res.status(400).json({ error: 'Invalid modulusLength. Must be a number between 512 and 16384.' });
        }

        try {
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

            const keyPairId = generateUniqueId();
            saveKeyPairToDatabase(keyPairId, publicKey, privateKey);

            res.json({ id: keyPairId, publicKey, privateKey });
        } catch (error) {
            console.error('Error generating key pair:', error);
            res.status(500).json({ error: 'Failed to generate key pair' });
        }
    },
};

function generateUniqueId() {
    return crypto.randomBytes(8).toString('hex');
}

function saveKeyPairToDatabase(id, publicKey, privateKey) {
    const databasePath = ('./models/database.json');
    const databaseDir = path.dirname(databasePath);

    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }

    let database = {};
    try {
        if (fs.existsSync(databasePath)) {
            const data = fs.readFileSync(databasePath, 'utf8');
            database = JSON.parse(data);
        }
    } catch (error) {

        console.error('Error reading database file:', error);
    }

    database[id] = { publicKey, privateKey };

    try {
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing to database file:', error);
    }
}

module.exports = TheKeyPairController;