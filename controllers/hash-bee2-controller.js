const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const bee2cmdPath = path.join(__dirname, '../dll', 'bee2cmd.exe');
console.log(bee2cmdPath);
const executeBee2Cmd = (command, args) => {
    return new Promise((resolve, reject) => {
        const fullCommand = `wine ${bee2cmdPath} ${command} ${args.join(' ')}`;
        exec(fullCommand, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

const HashControllerBee2 = {
    hashing: async (req, res) => {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        try {
            const decodedData = Buffer.from(text, 'hex');
            console.log(decodedData.toString('hex'))
            const tempFilePath = path.join(__dirname, 'temp.txt');
            fs.writeFileSync(tempFilePath, decodedData);

            const output = await executeBee2Cmd('bsum', ['-belt-hash', tempFilePath]);

            fs.unlinkSync(tempFilePath);

            const hash = output.split(' ')[0];

            return res.json({ hash });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    },

    hashFile: async (req, res) => {
        const { algorithm } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        try {
            const filePath = file.path;

            let bee2Algorithm;
            switch (algorithm) {
                case 'belt':
                    bee2Algorithm = '-belt-hash';
                    break;
                case 'bash256':
                    bee2Algorithm = '-bash256';
                    break;
                case 'bash512':
                    bee2Algorithm = '-bash512';
                    break;
                default:
                    return res.status(400).json({ error: 'Не тот алгоритм для Bee2' });
            }

            const output = await executeBee2Cmd('bsum', [bee2Algorithm, filePath]);

            fs.unlinkSync(filePath);

            const hash = output.split(' ')[0];

            return res.json({ hash });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    },
};

module.exports = HashControllerBee2;