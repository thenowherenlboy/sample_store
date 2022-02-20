const mongoose = require('mongoose');

const Item = new mongoose.Schema({
  name: {type:String, default:''},
  description: {type:String, default:''},
  price: {type:Number, default:0},
  pictureUrl: {type:String, default:''},
  interested: {type:Array, default:[]},
  timestamp: {type:Date, default:Date.now}
});

module.exports = mongoose.model('Item', Item);