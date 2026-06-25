const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    badge: { type: String, default: '' }, // e.g. "Bestseller", "New"
    images: [{ type: String }],           // paths/URLs to uploaded images
    stock: { type: Number, default: 100 },
    inStock: { type: Boolean, default: true },
    variants: [{ label: String }],        // e.g. ["100g", "200g", "500g"]
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    features: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
