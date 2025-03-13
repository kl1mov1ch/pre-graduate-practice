const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const bee2cmdPath = path.join(__dirname, '../dll', 'bee2cmd.exe');

console.log(bee2cmdPath)

const TheKeyPairControllerBee2 = {
    generateKeyPair: async (req, res) => {
        const { password } = req.body;

        try {
            const keyPairId = uuidv4() + 'BEE2';
            const outputDir = path.join('./models/keysBee2', keyPairId);
            const privKeyPath = path.join(outputDir, 'private_key.key');
            const pubKeyPath = path.join(outputDir, 'public_key.pub');

            fs.mkdirSync(outputDir, { recursive: true });

            const genCommand = `wine ${bee2cmdPath} kg gen -l128 -pass "pass:${password}" ${privKeyPath}`;
            await new Promise((resolve, reject) => {
                exec(genCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Ошибка генерации:', stderr);
                        reject(new Error(`Ошибка генерации закрытого ключа: ${stderr}`));
                    }
                    resolve(stdout);
                });
            });

            const extrCommand = `wine ${bee2cmdPath} kg extr -pass "pass:${password}" ${privKeyPath} ${pubKeyPath}`;
            await new Promise((resolve, reject) => {
                exec(extrCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Ошибка извлечения:', stderr);
                        reject(new Error(`Ошибка извлечения открытого ключа: ${stderr}`));
                    }
                    resolve(stdout);
                });
            });

            const privateKey = fs.readFileSync(privKeyPath, 'base64');
            const publicKey = fs.readFileSync(pubKeyPath, 'base64');

            await saveKeyPairToDatabase(keyPairId, publicKey, privateKey, privKeyPath, pubKeyPath);

            res.status(200).json({
                id: keyPairId,
                publicKey,
                privateKey,
                privKeyPath,
                pubKeyPath
            });

        } catch (error) {
            console.error('Ошибка:', error.message);
            res.status(500).json({ error: 'Ошибка при генерации ключей' });
        }
    },
};

async function saveKeyPairToDatabase(id, publicKey, privateKey, privKeyPath, pubKeyPath) {
    const databasePath = path.join('./models/database.json');
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
        console.error('Ошибка чтения базы данных:', error);
        throw new Error('Ошибка при чтении базы данных');
    }

    database[id] = {
        publicKey,
        privateKey,
        privKeyPath,
        pubKeyPath
    };

    try {
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), 'utf8');
    } catch (error) {
        console.error('Ошибка записи в базу данных:', error);
        throw new Error('Ошибка при записи в базу данных');
    }
}

module.exports = TheKeyPairControllerBee2;