/**
 * Seed script — run once to populate DB with initial products + admin user
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Product.deleteMany({});

  // Admin user
  await User.create({
    name: 'Admin',
    email: 'admin@kaalimitti.in',
    password: 'admin123',
    role: 'admin',
  });
  console.log('✅ Admin user created: admin@kaalimitti.in / admin123');

  // Products
  await Product.insertMany([
    {
      name: 'Kaali Mitti Face Pack',
      slug: 'facepack',
      description:
        'Deep-cleansing black clay face pack enriched with neem, turmeric & rose water. Draws out impurities, minimises pores, brightens skin. Safe for all skin types. Dermatologist tested.',
      price: 349,
      originalPrice: 499,
      badge: 'Bestseller',
      images: [],
      stock: 100,
      inStock: true,
      variants: [{ label: '100g' }, { label: '200g' }, { label: '500g' }],
      rating: 4.8,
      reviewCount: 124,
      features: [
        '100% natural Kaali Mitti (Black Clay)',
        'No parabens, sulphates, or artificial fragrances',
        'Dermatologist tested & verified',
        'Free delivery on orders above ₹399',
        'Easy 7-day returns',
      ],
    },
    {
      name: 'Kaali Mitti Shampoo',
      slug: 'shampoo',
      description:
        'Mineral-rich clay shampoo that cleanses the scalp deeply, reduces dandruff, strengthens roots, and adds natural shine — without sulphates.',
      price: 299,
      originalPrice: 449,
      badge: 'New',
      images: [],
      stock: 100,
      inStock: true,
      variants: [{ label: '100ml' }, { label: '200ml' }, { label: '400ml' }],
      rating: 4.7,
      reviewCount: 87,
      features: [
        '100% natural Kaali Mitti (Black Clay)',
        'Sulphate-free, paraben-free',
        'Reduces dandruff & strengthens roots',
        'Free delivery on orders above ₹399',
        'Easy 7-day returns',
      ],
    },
  ]);
  console.log('✅ Products seeded');

  mongoose.disconnect();
  console.log('✅ Seeding complete!');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
