const express = require('express');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');

// -- create a user -- signup
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user: user, token: token});
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

// -- login a user
router.post('/users/login', async (req, res) => {
   try {
       const user = await User.findByCredentials(req.body.email, req.body.password);
       const token = await user.generateAuthToken();
       res.send({user: user, token: token})
   } catch (error) {
       console.log(error);
       res.status(400).send(error)
   }
});

// -- logout a user
router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

// -- logout a user on all sessions/tokens
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

// -- view my profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

// -- update a user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {
        updates.forEach((update) => {req.user[update] = req.body[update]});
        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error)
    }
});

// -- delete user
router.delete('/users/:id', auth, async(req, res) => {
    try {
        const user = await req.user.remove();
        sendCancellationEmail(user.email, user.name);
        res.send(req.user)
    } catch (error) {
        res.status(500).send()
    }
});

// -- upload a profile picture
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image.'))
        }
        return cb(undefined, true);
    }
});
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => { // error handling
    res.status(400).send({error: error.message});
});

// -- delete your avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
   try {
       req.user.avatar = undefined;
       await req.user.save();
       res.send();
   } catch (error) {
       res.status(400).send({error: error})
   }
});

// -- get your avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
});

module.exports = router;
