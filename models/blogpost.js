var mongoose = require('mongoose');

//good to have default{} in case there isnt anything
var blogSchema = new mongoose.Schema({
  title: String,
  image: String,
  description: String,
  created: {type: Date, default: Date.now}
});

//Blogpost model allows create() to edit methods and attributes of the Blogpost object-the schema is the original template
module.exports = mongoose.model("Blogpost", blogSchema);
