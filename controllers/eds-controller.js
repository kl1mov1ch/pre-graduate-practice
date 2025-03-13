const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {exec} = require('child_process');

const bee2cmdPath = path.join(__dirname, '../dll', 'bee2cmd.exe');
console.log(bee2cmdPath);

const EdsController = {
    edsCalculation: async (req, res) => {
        const { text, privateKey, algorithm, password } = req.body;

        if (!text || !privateKey) {
            return res.status(400).json({ error: 'Missing required parameters: text and privateKey' });
        }

        try {
            let signature;
            if (algorithm === 'openssl') {
                const sign = crypto.createSign('SHA256');
                sign.update(text);
                signature = sign.sign(privateKey, 'hex');
            } else if (algorithm === 'bee2') {
                const tempDir = path.join('./models/temp');
                fs.mkdirSync(tempDir, { recursive: true });

                const privKeyPath = path.join(tempDir, 'private_key.bin');
                const textFilePath = path.join(tempDir, 'text_to_sign.txt');
                const sigPath = path.join(tempDir, 'signature.sig');

                fs.writeFileSync(privKeyPath, Buffer.from(privateKey, 'base64'));
                fs.writeFileSync(textFilePath, text);

                const signCommand = `wine ${bee2cmdPath} sig sign -pass "pass:${password}" ${privKeyPath} ${textFilePath} ${sigPath}`;
                await new Promise((resolve, reject) => {
                    exec(signCommand, (error, stdout, stderr) => {
                        if (error) {
                            console.error('Ошибка подписи:', stderr);
                            reject(new Error(`Ошибка подписи: ${stderr}`));
                        }
                        resolve(stdout);
                    });

                });
                signature = fs.readFileSync(sigPath, 'base64');
                fs.unlinkSync(privKeyPath);
                fs.unlinkSync(textFilePath);
                fs.unlinkSync(sigPath);
            } else {
                return res.status(400).json({ error: 'Invalid algorithm' });
            }

            res.json({ signature });
        } catch (error) {
            console.error('Error during EDS calculation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    edsVerification: async (req, res) => {
        const { text, signature, publicKey, algorithm, password } = req.body;

        if (!text || !signature || !publicKey) {
            return res.status(400).json({ error: 'Missing required parameters: text, signature, and publicKey' });
        }

        try {
            let isVerified;
            if (algorithm === 'openssl') {
                const verify = crypto.createVerify('SHA256');
                verify.update(text);
                isVerified = verify.verify(publicKey, signature, 'hex');
            } else if (algorithm === 'bee2') {
                const tempDir = path.join('./models/temp');
                fs.mkdirSync(tempDir, { recursive: true });

                const pubKeyPath = path.join(tempDir, 'public_key.bin');
                const textFilePath = path.join(tempDir, 'text_to_verify.txt');
                const sigPath = path.join(tempDir, 'signature.sig');

                fs.writeFileSync(pubKeyPath, Buffer.from(publicKey, 'base64'));
                fs.writeFileSync(textFilePath, text);
                fs.writeFileSync(sigPath, Buffer.from(signature, 'base64'));

                const verifyCommand = `wine ${bee2cmdPath} sig val -pubkey ${pubKeyPath} ${textFilePath} ${sigPath}`;
                await new Promise((resolve, reject) => {
                    exec(verifyCommand, (error, stdout, stderr) => {
                        if (error) {
                            console.error('Ошибка проверки:', stderr);
                            reject(new Error(`Ошибка проверки: ${stderr}`));
                        }
                        resolve(stdout);
                    });
                });

                isVerified = true;

                fs.unlinkSync(pubKeyPath);
                fs.unlinkSync(textFilePath);
                fs.unlinkSync(sigPath);
            } else {
                return res.status(400).json({ error: 'Invalid algorithm' });
            }

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
                res.status(500).json({error: 'Failed to load key pairs'});
            }
        },
}
module.exports = EdsController;