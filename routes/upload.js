const express = require('express');
const router = express.Router();
const path = require('path');
const Sharp = require('sharp');
const multer = require('multer');
const mkdirp = require('mkdirp');

const config = require('../config');
const diskStorage = require('../utils/diskStorage');
const models = require('../models');

const rs = () =>
  Math.random()
    .toString(36)
    .slice(-3);

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dir = '/' + rs() + '/' + rs();
    req.dir = dir;

    mkdirp(config.DESTINATION + dir, err => cb(err, config.DESTINATION + dir));
  },
  filename: async (req, file, cb) => {
    const userId = req.session.userId;
    const fileName = Date.now().toString(36) + path.extname(file.originalname);
    const dir = req.dir;
    console.log(req.body); // { postId: '5b059790979c832a1215016a' }
    // find post
    const post = await models.Post.findById(req.body.postId);
    if (!post) {
      const err = new Error('No Post');
      err.code = 'NOPOST';
      return cb(err);
    }
    // upload
    const upload = await models.Upload.create({
      owner: userId,
      path: dir + '/' + fileName
    });
    // write to post
    const uploads = post.uploads;
    uploads.push(upload.id);
    post.uploads = uploads;
    await post.save();
    cb(null, fileName);
  },
  sharp: (req, file, cb) => {
    const resizer = Sharp()
      .resize(1024, 768)
      .max()
      .withoutEnlargement()
      .toFormat('jpg')
      .jpeg({
        quality: 40,
        progressive: true
      });
    cb(null, resizer);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      const err = new Error('Extention');
      err.code = 'EXTENTION';
      return cb(err);
    }
    cb(null, true);
  }
}).single('file');

// POST is add
router.post('/image', (req, res) => {
  upload(req, res, err => {
    let error = '';
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        error = 'Image size less than 2mb!';
      }
      if (err.code === 'EXTENTION') {
        error = 'Only jpeg or png!';
      }
      if (err.code === 'NOPOST') {
        error = 'Reload page!';
      }
    }

    res.json({
      ok: !error,
      error
    });
  });
});

module.exports = router;
