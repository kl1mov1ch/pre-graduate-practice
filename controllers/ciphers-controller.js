const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
        const inputFilePath = path.join(__dirname, 'temp_input.txt');
        const outputFilePath = path.join(__dirname, 'temp_output.txt');

        fs.writeFileSync(inputFilePath, Buffer.from(encryptedText, 'hex'));
        const command = `openssl enc -${algorithm} -d -in ${inputFilePath} -out ${outputFilePath} -K ${key} -iv ${iv}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during decryption: ${stderr}`);
                return res.status(500).json({ error: 'Decryption failed' });
            }
            const decrypted = fs.readFileSync(outputFilePath, 'utf8');
            fs.unlinkSync(inputFilePath);
            fs.unlinkSync(outputFilePath);
            res.json({ decrypted });
        });
    },
};

//key - 0123456789abcdef0123456789abcdef
module.exports = CiphersController;