const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TheKeyPairController = {
    generateKeyPair: async (req, res) => {
        const modulusLength = parseInt(req.body.modulusLength, 10) || 2048;

        // Проверка допустимости modulusLength
        if (isNaN(modulusLength) || modulusLength < 512 || modulusLength > 16384) {
            return res.status(400).json({ error: 'Invalid modulusLength. Must be a number between 512 and 16384.' });
        }

        try {
            // Генерация пары ключей
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

            // Генерация уникального ID
            const keyPairId = generateUniqueId();

            // Сохранение пары ключей в database.json
            saveKeyPairToDatabase(keyPairId, publicKey, privateKey);

            // Отправка ответа клиенту
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
    const databasePath = path.join(__dirname, './models', 'database.json');

    let database;
    try {
        const data = fs.readFileSync(databasePath, 'utf8');
        database = JSON.parse(data);
    } catch (error) {
        database = {};
    }

    database[id] = { publicKey, privateKey };

    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf8');
}

module.exports = TheKeyPairController;