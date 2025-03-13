const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CiphersController, EDSController, HashController, TheKeyPairController } = require('../controllers/index');
const {HashControllerBee2, TheKeyPairControllerBee2} = require("../controllers");

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
});


router.post('/encrypt', CiphersController.encryptText);
router.post('/decrypt', CiphersController.decryptText);
router.post('/generate-key', CiphersController.generateKey);
router.get('/get-keys', CiphersController.getKeys);

router.post('/eds-calculation', EDSController.edsCalculation);
router.post('/eds-verification', EDSController.edsVerification);

router.post('/hash', HashController.hashing);
router.post('/hashbel', HashControllerBee2.hashing);
router.post('/hashFile', upload.single('file'), HashController.hashFile);
router.post('/hashFilebel', upload.single('file'), HashControllerBee2.hashFile);

router.post('/generate-key-pair', TheKeyPairController.generateKeyPair);
router.post('/generate-key-pair-bee2', TheKeyPairControllerBee2.generateKeyPair);
router.get('/get-key-pairs', EDSController.getKeyPairs);


module.exports = router;