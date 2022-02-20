const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const formidable = require('formidable');
const fs = require('fs');

router.get('/', (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect('/');
    return;
  }

  if (!(user.isAdmin)) {
    res.redirect('/account')
    return;
  }

  Item.find(null, (err, items) => {
    if (err)
      return next(err);
    const data = {
      user: user,
      items: items
    }
    res.render('admin', data);
  });
});

router.post('/additem', (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect('/');
    return;
  }
  if (!(user.isAdmin)) {
    res.redirect('/account')
    return;
  }
  const form = formidable();
  form.parse(req, (err, fields, files) => {
    if (err)
      return next(err);
    var pic = files == null ? '' : files.pictureUrl.originalFilename;
    var data = {
      name: fields.name,
      description: fields.description,
      price: fields.price,
      pictureUrl: pic
    };
    //res.json({fields, files, data});

    Item.create(data, (err, item) => {
      if (err)
        return next(err);
    });
    if (files.pictureUrl.size != 0) {
      var oldpath = files.pictureUrl.filepath;
      var newpath = __dirname + '/../public/images/' + files.pictureUrl.originalFilename;
      fs.rename(oldpath, newpath, (err) => {
        if (err)
          return next(err);
      });
    }
    
    res.redirect('/admin');

    //res.json({fields, files});
  });
});

router.post('/addPicture', (req, res, next) => {
  const form = formidable({multiples: true});
  form.parse(req, (err, fields, files) => {
    if (err)
      return next(err);
    Item.findById(fields.id, (err, item) => {
      if (err)
        return next(err);
      item.pictureUrl = files.picture.originalFilename;
      item.save();
    });
    var fileName = files.picture.originalFilename;
    var oldpath = files.picture.filepath;
    var newpath = __dirname + '/../public/images/' + fileName;
    console.log(oldpath);
    console.log(newpath);
    fs.rename(oldpath, newpath, (err) => {
      if (err)
        return next(new Error("File not uploaded: " + err));
      res.redirect('/admin');
    });
  });
});

router.get('/removeitem/:itemid', (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect('/');
    return;
  }
  if (!(user.isAdmin)) {
    res.redirect('/account');
    return;
  }
  Item.findById(req.params.itemid, (err, found) => {
    if (err) return next(err);
    // console.log(found);
    fs.unlink(__dirname + '/../public/images/' + found.pictureUrl, (err) => {
      if (err) return next(err);
      console.log(found.pictureUrl + ' successfully deleted.');
    });
    Item.deleteOne({_id: found._id}, (err) => {
      if (err)
        return next(err);
      res.redirect('/admin');
    });
  });
});

module.exports = router;