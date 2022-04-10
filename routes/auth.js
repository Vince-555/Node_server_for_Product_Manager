const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();
          
router.post('/register', authController.register );

router.post('/login', authController.login );

router.post('/addProduct', authController.addProduct );
router.put('/updateProduct/:id', authController.updateProduct );




router.get('/product', authController.product );
router.get('/productById/:id', authController.productById );
router.get('/tagById/:id', authController.tagById );

router.get('/logout', authController.logout );


module.exports = router;