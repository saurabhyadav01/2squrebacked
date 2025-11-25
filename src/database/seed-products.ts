import { pool, query } from "../config/database";
import dotenv from "dotenv";

dotenv.config();

interface ProductSeed {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  sku: string;
  stock_quantity: number;
  image_url: string;
  images?: string[];
  category: string;
  tags?: string[];
  is_active: boolean;
}

const products: ProductSeed[] = [
  // Men's Products
  {
    name: "Custom Bucket Hat",
    description: "Elevate your street style with this custom bucket hat. Made with premium materials and featuring our signature Gen Z aesthetic. Perfect for any occasion, from casual hangouts to music festivals.",
    price: 3100,
    compare_at_price: 4150,
    sku: "MEN-BH-001",
    stock_quantity: 50,
    image_url: "/assets/product-4.jpg",
    images: ["/assets/product-4.jpg", "/assets/product-2.jpg", "/assets/product-3.jpg"],
    category: "Men",
    tags: ["hat", "accessories", "streetwear", "unisex"],
    is_active: true,
  },
  {
    name: "Neon Graphic Tee",
    description: "Stand out from the crowd with this vibrant neon graphic tee. Bold designs that reflect your unique personality and style.",
    price: 2600,
    compare_at_price: 3450,
    sku: "MEN-TEE-001",
    stock_quantity: 75,
    image_url: "/assets/product-3.jpg",
    images: ["/assets/product-3.jpg", "/assets/product-4.jpg", "/assets/product-showcase-1.jpg"],
    category: "Men",
    tags: ["t-shirt", "graphic", "casual", "neon"],
    is_active: true,
  },
  {
    name: "Vintage Sunglasses",
    description: "Classic vintage-inspired sunglasses with modern UV protection. Perfect for any sunny day.",
    price: 3750,
    compare_at_price: 5000,
    sku: "MEN-SG-001",
    stock_quantity: 30,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Men",
    tags: ["sunglasses", "accessories", "vintage"],
    is_active: true,
  },
  {
    name: "Classic Denim Jeans",
    description: "Premium quality denim jeans with perfect fit and comfort. A wardrobe essential.",
    price: 7500,
    compare_at_price: 10000,
    sku: "MEN-JEANS-001",
    stock_quantity: 40,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Men",
    tags: ["jeans", "denim", "bottoms", "casual"],
    is_active: true,
  },
  {
    name: "Leather Jacket",
    description: "Stylish leather jacket with modern design. Perfect for cool weather and making a statement.",
    price: 16500,
    compare_at_price: 20800,
    sku: "MEN-JKT-001",
    stock_quantity: 25,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Men",
    tags: ["jacket", "leather", "outerwear", "premium"],
    is_active: true,
  },
  {
    name: "Casual Sneakers",
    description: "Comfortable and stylish sneakers for everyday wear. Perfect for walking and casual outings.",
    price: 6650,
    compare_at_price: 8300,
    sku: "MEN-SNK-001",
    stock_quantity: 60,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Men",
    tags: ["sneakers", "shoes", "footwear", "casual"],
    is_active: true,
  },
  {
    name: "Formal Shirt",
    description: "Classic formal shirt perfect for business and formal occasions. Premium cotton fabric.",
    price: 5000,
    compare_at_price: 6650,
    sku: "MEN-SHRT-001",
    stock_quantity: 45,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Men",
    tags: ["shirt", "formal", "business", "professional"],
    is_active: true,
  },
  {
    name: "Sports Watch",
    description: "Modern sports watch with multiple features. Water-resistant and durable.",
    price: 10800,
    compare_at_price: 13300,
    sku: "MEN-WTCH-001",
    stock_quantity: 35,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Men",
    tags: ["watch", "sports", "accessories", "fitness"],
    is_active: true,
  },

  // Women's Products
  {
    name: "Y2K Denim Jacket",
    description: "Channel your inner Y2K energy with this statement denim jacket. Featuring bold graphics and retro-inspired details that scream early 2000s nostalgia.",
    price: 6150,
    compare_at_price: 8300,
    sku: "WOM-JKT-001",
    stock_quantity: 40,
    image_url: "/assets/product-2.jpg",
    images: ["/assets/product-2.jpg", "/assets/product-showcase-1.jpg", "/assets/product-3.jpg"],
    category: "Women",
    tags: ["jacket", "denim", "y2k", "retro", "fashion"],
    is_active: true,
  },
  {
    name: "Retro Style Collection",
    description: "A complete retro-inspired collection featuring multiple pieces. Mix and match to create your perfect nostalgic look.",
    price: 8300,
    compare_at_price: 10350,
    sku: "WOM-SET-001",
    stock_quantity: 30,
    image_url: "/assets/product-showcase-1.jpg",
    images: ["/assets/product-showcase-1.jpg", "/assets/product-2.jpg", "/assets/hero-product-1.jpg"],
    category: "Women",
    tags: ["collection", "retro", "vintage", "set"],
    is_active: true,
  },
  {
    name: "Designer Handbag",
    description: "Elegant designer handbag perfect for any occasion. Spacious and stylish.",
    price: 10400,
    compare_at_price: 13300,
    sku: "WOM-BAG-001",
    stock_quantity: 20,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Women",
    tags: ["handbag", "bag", "accessories", "designer"],
    is_active: true,
  },
  {
    name: "Elegant Dress",
    description: "Beautiful elegant dress perfect for special occasions. Made with premium fabric.",
    price: 12500,
    compare_at_price: 16600,
    sku: "WOM-DRS-001",
    stock_quantity: 25,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Women",
    tags: ["dress", "elegant", "formal", "occasion"],
    is_active: true,
  },
  {
    name: "High Heels",
    description: "Stylish high heels that combine comfort and elegance. Perfect for formal events.",
    price: 7500,
    compare_at_price: 10000,
    sku: "WOM-HL-001",
    stock_quantity: 35,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Women",
    tags: ["heels", "shoes", "footwear", "formal"],
    is_active: true,
  },
  {
    name: "Designer Purse",
    description: "Luxury designer purse with elegant design. Perfect accessory for any outfit.",
    price: 15000,
    compare_at_price: 19100,
    sku: "WOM-PRS-001",
    stock_quantity: 15,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Women",
    tags: ["purse", "bag", "accessories", "luxury"],
    is_active: true,
  },
  {
    name: "Summer Blouse",
    description: "Light and comfortable summer blouse. Perfect for warm weather and casual outings.",
    price: 4150,
    compare_at_price: 5800,
    sku: "WOM-BLS-001",
    stock_quantity: 50,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Women",
    tags: ["blouse", "top", "summer", "casual"],
    is_active: true,
  },
  {
    name: "Fashion Jewelry Set",
    description: "Beautiful fashion jewelry set including necklace, earrings, and bracelet. Perfect for accessorizing.",
    price: 5800,
    compare_at_price: 7500,
    sku: "WOM-JWL-001",
    stock_quantity: 40,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Women",
    tags: ["jewelry", "accessories", "fashion", "set"],
    is_active: true,
  },

  // Children's Products
  {
    name: "Kids T-Shirt",
    description: "Comfortable and fun t-shirt for kids. Made with soft, child-friendly materials.",
    price: 2100,
    compare_at_price: 2900,
    sku: "CHD-TEE-001",
    stock_quantity: 60,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Children",
    tags: ["t-shirt", "kids", "casual", "comfortable"],
    is_active: true,
  },
  {
    name: "Children's Sneakers",
    description: "Durable and comfortable sneakers for active kids. Perfect for play and school.",
    price: 4600,
    compare_at_price: 6250,
    sku: "CHD-SNK-001",
    stock_quantity: 45,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Children",
    tags: ["sneakers", "shoes", "footwear", "kids"],
    is_active: true,
  },
  {
    name: "Kids Backpack",
    description: "Colorful and spacious backpack perfect for school. Durable and kid-friendly design.",
    price: 3300,
    compare_at_price: 4150,
    sku: "CHD-BPK-001",
    stock_quantity: 30,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Children",
    tags: ["backpack", "school", "kids", "accessories"],
    is_active: true,
  },
  {
    name: "Children's Jeans",
    description: "Comfortable jeans designed for active kids. Durable and easy to move in.",
    price: 3800,
    compare_at_price: 5000,
    sku: "CHD-JEANS-001",
    stock_quantity: 40,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Children",
    tags: ["jeans", "bottoms", "kids", "casual"],
    is_active: true,
  },
  {
    name: "Kids Hoodie",
    description: "Warm and cozy hoodie perfect for cooler weather. Fun designs kids love.",
    price: 3600,
    compare_at_price: 4600,
    sku: "CHD-HD-001",
    stock_quantity: 35,
    image_url: "/placeholder.svg",
    images: ["/placeholder.svg"],
    category: "Children",
    tags: ["hoodie", "sweatshirt", "warm", "kids"],
    is_active: true,
  },
];

async function seedProducts() {
  try {
    console.log("📦 Seeding products...");

    // First, get or create categories
    const categoryMap: Record<string, string> = {};

    for (const categoryName of ["Men", "Women", "Children"]) {
      let categoryResult = await query(
        "SELECT id FROM categories WHERE name = $1",
        [categoryName]
      );

      if (categoryResult.rows.length === 0) {
        // Create category if it doesn't exist
        const newCategory = await query(
          `INSERT INTO categories (name, slug, description, is_active)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            categoryName,
            categoryName.toLowerCase(),
            `${categoryName}'s fashion collection`,
            true,
          ]
        );
        categoryMap[categoryName] = newCategory.rows[0].id;
        console.log(`✅ Created category: ${categoryName}`);
      } else {
        categoryMap[categoryName] = categoryResult.rows[0].id;
      }
    }

    // Insert products
    let inserted = 0;
    let skipped = 0;

    for (const product of products) {
      // Check if product already exists by SKU
      const existing = await query(
        "SELECT id FROM products WHERE sku = $1",
        [product.sku]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Use category name (products table stores category as VARCHAR, not foreign key)
      await query(
        `INSERT INTO products (
          name, description, price, compare_at_price, sku, stock_quantity,
          image_url, images, category, tags, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, name`,
        [
          product.name,
          product.description,
          product.price,
          product.compare_at_price || null,
          product.sku,
          product.stock_quantity,
          product.image_url,
          product.images || null,
          product.category, // Use category name directly
          product.tags || null,
          product.is_active,
        ]
      );

      inserted++;
    }

    console.log(`✅ Products seeded successfully!`);
    console.log(`   Inserted: ${inserted} products`);
    console.log(`   Skipped: ${skipped} products (already exist)`);
    console.log(`   Total: ${products.length} products`);

    await pool.end();
  } catch (error: any) {
    console.error("❌ Error seeding products:", error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log("✅ Product seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Product seeding failed:", error);
      process.exit(1);
    });
}

export { seedProducts };

