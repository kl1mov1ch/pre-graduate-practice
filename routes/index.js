const express = require('express');
const router = express.Router();
const multer = require('multer'); // Импортируем multer
const { CiphersController, EDSController, HashController, TheKeyPairController } = require('../controllers/index');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Роуты для шифрования и дешифрования
router.post('/encrypt', CiphersController.encryptText);
router.post('/decrypt', CiphersController.decryptText);

// Роуты для работы с ЭЦП (встроенный модуль crypto)
router.post('/eds-calculation', EDSController.eds_calculation);
router.post('/eds-verification', EDSController.eds_verification);

// Роуты для хеширования
router.post('/hash', HashController.hashing);
router.post('/hashFile', upload.single('file'), HashController.hashFile);

router.post('/generate-key-pair', TheKeyPairController.generateKeyPair);

module.exports = router;