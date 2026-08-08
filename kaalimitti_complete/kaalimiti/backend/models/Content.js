const mongoose = require('mongoose');
const ContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
module.exports = mongoose.model('Content', ContentSchema);
