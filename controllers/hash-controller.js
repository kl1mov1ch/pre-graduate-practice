const crypto = require('crypto');
const fs = require('fs');
const HashController = {
    hashing: async (req, res) => {
        const { text, algorithm } = req.body;
        const hash = crypto.createHash(algorithm).update(text).digest('hex');
        res.json({ hash });
    },

    hashFile: async (req, res) => {
        const filePath = req.file.path;
        const algorithm = req.body.algorithm;

        try {
            const hash = crypto.createHash(algorithm);
            const stream = fs.createReadStream(filePath);
            stream.on('data', (chunk) => hash.update(chunk));
            stream.on('end', () => {
                fs.unlinkSync(filePath);
                const digest = hash.digest('hex');
                res.json({hash: digest});
            });
            stream.on('error', (err) => {
                fs.unlinkSync(filePath);
                return res.status(500).json({error: 'Error reading file'});
            });
        } catch (error) {
            return res.status(500).json({error: 'Internal server error'}  );
        }
    }
};

module.exports = HashController;