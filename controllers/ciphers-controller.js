const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {exec} = require('child_process');

const CiphersController = {
    encryptText: async (req, res) => {
        const { text, key, algorithm } = req.body;
        const iv = crypto.randomBytes(16).toString('hex');
        const inputFilePath = path.join(__dirname, 'temp_input.txt');
        const outputFilePath = path.join(__dirname, 'temp_output.txt');
        fs.writeFileSync(inputFilePath, text);
        const command = `openssl enc -${algorithm} -e -in ${inputFilePath} -out ${outputFilePath} -K ${key} -iv ${iv}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during encryption: ${stderr}`);
                return res.status(500).json({ error: 'Encryption failed' });
            }
            const encrypted = fs.readFileSync(outputFilePath, 'hex');
            fs.unlinkSync(inputFilePath);
            fs.unlinkSync(outputFilePath);
            res.json({ encrypted, iv });
        });
    },
    decryptText: async (req, res) => {
        const { encryptedText, key, algorithm, iv } = req.body;
        if (!encryptedText || !key || !algorithm || !iv) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }
        const inputFilePath = path.join(__dirname, 'temp_input.txt');
        const outputFilePath = path.join(__dirname, 'temp_output.txt');
        try {
            Buffer.from(encryptedText, 'hex');
        } catch (error) {
            return res.status(400).json({ error: 'Неверный формат шифротекста' });
        }

        fs.writeFileSync(inputFilePath, Buffer.from(encryptedText, 'hex'));

        const command = `openssl enc -${algorithm} -d -in ${inputFilePath} -out ${outputFilePath} -K ${key} -iv ${iv}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (stderr.includes('bad decrypt')) {
                    return res.status(400).json({ error: 'Ошибка расшифрования: неверный ключ или IV' });
                } else if (stderr.includes('not a valid')) {
                    return res.status(400).json({ error: 'Ошибка расшифрования: неверный алгоритм' });
                } else {
                    console.error(`Error during decryption: ${stderr}`);
                    return res.status(500).json({ error: 'Произошла ошибка при расшифровании' });
                }
            }

            try {
                const decrypted = fs.readFileSync(outputFilePath, 'utf8');
                fs.unlinkSync(inputFilePath);
                fs.unlinkSync(outputFilePath);
                res.json({ decrypted });
            } catch (readError) {
                console.error('Error reading decrypted file:', readError);
                return res.status(500).json({ error: 'Не удалось прочитать расшифрованный файл' });
            }
        });
    },
    generateKey: async (req, res) => {
        try {
            const keyLength = Math.floor(Math.random() * (64 - 32 + 1)) + 32;
            const key = crypto.randomBytes(keyLength / 2).toString('hex'); // Генерация ключа
            const uniqueId = crypto.randomBytes(8).toString('hex'); // Уникальный ID для ключа

            const keyFilePath = ('./models/key.json');
            const keysDir = path.dirname(keyFilePath);

            if (!fs.existsSync(keysDir)) {
                fs.mkdirSync(keysDir, { recursive: true });
            }

            let keys = [];
            if (fs.existsSync(keyFilePath)) {
                const data = fs.readFileSync(keyFilePath, 'utf8');
                keys = JSON.parse(data) || [];
            }
            const newKey = { id: uniqueId, key };
            keys.push(newKey);
            fs.writeFileSync(keyFilePath, JSON.stringify(keys, null, 2));
            res.json({ id: uniqueId, key });
        } catch (error) {
            console.error('Error during key generation:', error);
            res.status(500).json({ error: 'Failed to generate key' });
        }
    },
    getKeys: async (req, res) => {
        try {
            const keyFilePath = ('./models/key.json'); // Путь к файлу с ключами
            if (!fs.existsSync(keyFilePath)) {
                return res.json([]);
            }
            const data = fs.readFileSync(keyFilePath, 'utf8');
            const keys = JSON.parse(data) || [];

            res.json(keys);
        } catch (error) {
            console.error('Error fetching keys:', error);
            res.status(500).json({ error: 'Failed to fetch keys' });
        }
    },
};

module.exports = CiphersController;