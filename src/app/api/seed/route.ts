import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
  "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
  "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
  "https://images.unsplash.com/photo-1503341504253-dff4f94032fc?w=600&q=80",
  "https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=600&q=80",
  "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
  "https://images.unsplash.com/photo-1434389677669-e08b4cda3a27?w=600&q=80",
  "https://images.unsplash.com/photo-1616150638538-ffb0679a3fc4?w=600&q=80",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&q=80",
];

export async function POST() {
  try {
    const db = getServiceSupabase();

    // Check if already seeded
    const { data: existingProducts } = await db
      .from("products")
      .select("id")
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      return NextResponse.json(
        { error: "Database already has data. Clear it first or skip seeding." },
        { status: 400 }
      );
    }

    // 1. Create site settings
    const { data: existingSettings } = await db
      .from("site_settings")
      .select("id")
      .single();

    if (!existingSettings) {
      await db.from("site_settings").insert({
        shop_name: "Paras Cloth Store Online",
        whatsapp_number: "919876543210",
        primary_color: "#7c3aed",
        accent_color: "#f59e0b",
        dark_mode: false,
        footer_text: "© 2026 Paras Cloth Store Online. All rights reserved.",
        banner_text: "Grand Opening Sale - 15% off on all Sarees! 🎉",
        banner_active: true,
        shop_address: "Shop No. 12, Main Market, Near Bus Stand, Raipur, Chhattisgarh 492001",
        shop_timings: "10:00 AM - 9:00 PM (Closed on Sundays)",
        instagram_url: "https://instagram.com/parasclothstore",
        facebook_url: "https://facebook.com/parasclothstore",
        is_installed: true,
      });
    } else {
      await db
        .from("site_settings")
        .update({
          shop_name: "Paras Cloth Store Online",
          whatsapp_number: "919876543210",
          primary_color: "#7c3aed",
          accent_color: "#f59e0b",
          banner_text: "Grand Opening Sale - 15% off on all Sarees! 🎉",
          banner_active: true,
          shop_address: "Shop No. 12, Main Market, Near Bus Stand, Raipur, Chhattisgarh 492001",
          shop_timings: "10:00 AM - 9:00 PM (Closed on Sundays)",
          instagram_url: "https://instagram.com/parasclothstore",
          facebook_url: "https://facebook.com/parasclothstore",
          footer_text: "© 2026 Paras Cloth Store Online. All rights reserved.",
          is_installed: true,
        })
        .eq("id", existingSettings.id);
    }

    // 2. Create admin (if not exists)
    const { data: existingAdmin } = await db
      .from("admin")
      .select("id")
      .limit(1);

    if (!existingAdmin || existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.from("admin").insert({
        username: "admin",
        password_hash: passwordHash,
        email: "admin@example.com",
        last_login: new Date().toISOString(),
      });
    }

    // 3. Create categories
    const categories = [
      { name: "Sarees", display_order: 1 },
      { name: "Shirts", display_order: 2 },
      { name: "Pants", display_order: 3 },
      { name: "Kurtas", display_order: 4 },
      { name: "Towels", display_order: 5 },
      { name: "Bedsheets", display_order: 6 },
      { name: "Dupattas", display_order: 7 },
      { name: "Kids Wear", display_order: 8 },
    ];

    const { data: catData } = await db
      .from("categories")
      .insert(categories)
      .select();

    if (!catData) {
      return NextResponse.json({ error: "Failed to create categories" }, { status: 500 });
    }

    const catMap: Record<string, string> = {};
    catData.forEach((c) => { catMap[c.name] = c.id; });

    // 4. Create products
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const products = [
      // Sarees
      {
        code: "100001", name: "Pink Banarasi Silk Saree", price: 2500,
        description: "Beautiful handwoven Banarasi silk saree with intricate gold zari work. Perfect for weddings and festive occasions. Comes with matching blouse piece.",
        category_id: catMap["Sarees"], is_available: true, is_featured: true,
        stock_count: 2, colors: ["Pink", "Maroon", "Red"], video_url: null,
        created_at: oneDayAgo,
      },
      {
        code: "100002", name: "Blue Cotton Saree", price: 800,
        description: "Lightweight cotton saree ideal for daily wear. Soft fabric, easy to drape. Perfect for office and casual outings.",
        category_id: catMap["Sarees"], is_available: true, is_featured: false,
        stock_count: 3, colors: ["Blue", "Navy", "Teal"], video_url: null,
        created_at: twoDaysAgo,
      },
      {
        code: "100003", name: "Red Chanderi Silk Saree", price: 1800,
        description: "Elegant Chanderi silk saree with golden border. Lightweight and perfect for summer weddings.",
        category_id: catMap["Sarees"], is_available: true, is_featured: true,
        stock_count: 1, colors: ["Red", "Golden"], video_url: null,
        created_at: oneDayAgo,
      },
      {
        code: "100004", name: "Green Patola Saree", price: 3500,
        description: "Authentic Patola saree with traditional geometric patterns. A collector's piece with vibrant colors.",
        category_id: catMap["Sarees"], is_available: false, is_featured: false,
        stock_count: null, colors: ["Green", "Red", "Yellow"], video_url: null,
        created_at: tenDaysAgo,
      },
      {
        code: "100005", name: "Yellow Georgette Saree", price: 1200,
        description: "Flowing georgette saree with floral print. Ideal for parties and celebrations.",
        category_id: catMap["Sarees"], is_available: true, is_featured: false,
        stock_count: 2, colors: ["Yellow", "Orange"], video_url: null,
        created_at: fiveDaysAgo,
      },

      // Shirts
      {
        code: "200001", name: "White Formal Shirt", price: 650,
        description: "Premium cotton formal shirt. Slim fit, perfect for office wear. Wrinkle-resistant fabric.",
        category_id: catMap["Shirts"], is_available: true, is_featured: false,
        stock_count: null, colors: ["White", "Blue", "Grey"], video_url: null,
        created_at: fiveDaysAgo,
      },
      {
        code: "200002", name: "Blue Check Casual Shirt", price: 550,
        description: "Comfortable casual check shirt. Regular fit, suitable for daily wear and outings.",
        category_id: catMap["Shirts"], is_available: true, is_featured: true,
        stock_count: 3, colors: ["Blue", "Red", "Green"], video_url: null,
        created_at: twoDaysAgo,
      },
      {
        code: "200003", name: "Black Party Wear Shirt", price: 850,
        description: "Stylish black shirt with subtle sheen. Perfect for parties and evening events.",
        category_id: catMap["Shirts"], is_available: true, is_featured: false,
        stock_count: 1, colors: ["Black", "Navy"], video_url: null,
        created_at: oneDayAgo,
      },
      {
        code: "200004", name: "Printed Hawaiian Shirt", price: 450,
        description: "Trendy printed shirt with tropical design. Perfect for vacations and casual outings.",
        category_id: catMap["Shirts"], is_available: true, is_featured: false,
        stock_count: null, colors: ["Multi-color", "Blue", "Green"], video_url: null,
        created_at: fiveDaysAgo,
      },

      // Pants
      {
        code: "300001", name: "Formal Trouser", price: 900,
        description: "Classic formal trouser with perfect crease. Comfortable stretch fabric for all-day wear.",
        category_id: catMap["Pants"], is_available: true, is_featured: false,
        stock_count: null, colors: ["Black", "Navy", "Grey", "Brown", "Beige"], video_url: null,
        created_at: fiveDaysAgo,
      },
      {
        code: "300002", name: "Slim Fit Chinos", price: 750,
        description: "Modern slim fit chinos. Versatile enough for office and casual wear.",
        category_id: catMap["Pants"], is_available: true, is_featured: true,
        stock_count: 2, colors: ["Beige", "Navy", "Black", "Green", "Maroon"], video_url: null,
        created_at: oneDayAgo,
      },
      {
        code: "300003", name: "Cotton Track Pants", price: 400,
        description: "Comfortable cotton track pants with elastic waist. Perfect for lounging and exercise.",
        category_id: catMap["Pants"], is_available: true, is_featured: false,
        stock_count: null, colors: ["Black", "Grey", "Navy", "Blue"], video_url: null,
        created_at: tenDaysAgo,
      },

      // Kurtas
      {
        code: "400001", name: "White Lucknowi Chikan Kurta", price: 1200,
        description: "Handcrafted Lucknowi chikan embroidery kurta. Elegant white cotton with intricate thread work.",
        category_id: catMap["Kurtas"], is_available: true, is_featured: true,
        stock_count: 1, colors: ["White", "Cream", "Beige"], video_url: null,
        created_at: twoDaysAgo,
      },
      {
        code: "400002", name: "Printed Cotton Kurta", price: 600,
        description: "Comfortable cotton kurta with block print design. Perfect for festivals and daily wear.",
        category_id: catMap["Kurtas"], is_available: true, is_featured: false,
        stock_count: 3, colors: ["Blue", "Green", "Maroon", "Yellow"], video_url: null,
        created_at: fiveDaysAgo,
      },
      {
        code: "400003", name: "Silk Kurta Pajama Set", price: 2200,
        description: "Premium silk kurta with matching pajama. Ideal for weddings, pujas and special occasions.",
        category_id: catMap["Kurtas"], is_available: true, is_featured: false,
        stock_count: 1, colors: ["Golden", "Maroon", "Navy"], video_url: null,
        created_at: oneDayAgo,
      },

      // Towels
      {
        code: "500001", name: "Premium Bath Towel", price: 350,
        description: "Extra soft 100% cotton bath towel. Highly absorbent, quick dry. Size: 30x60 inches.",
        category_id: catMap["Towels"], is_available: true, is_featured: false,
        stock_count: null, colors: ["White", "Blue", "Pink", "Yellow", "Green"], video_url: null,
        created_at: tenDaysAgo,
      },
      {
        code: "500002", name: "Hand Towel Set (Pack of 6)", price: 250,
        description: "Set of 6 colorful hand towels. Soft cotton, perfect for kitchen and bathroom.",
        category_id: catMap["Towels"], is_available: true, is_featured: false,
        stock_count: 2, colors: ["Multi-color"], video_url: null,
        created_at: fiveDaysAgo,
      },

      // Bedsheets
      {
        code: "600001", name: "King Size Bedsheet with 2 Pillow Covers", price: 650,
        description: "Premium cotton king size bedsheet (108x108 inches) with 2 matching pillow covers. Beautiful floral print.",
        category_id: catMap["Bedsheets"], is_available: true, is_featured: true,
        stock_count: 2, colors: ["Blue", "Red", "Green", "Pink"], video_url: null,
        created_at: twoDaysAgo,
      },
      {
        code: "600002", name: "Double Bedsheet - Jaipuri Print", price: 500,
        description: "Traditional Jaipuri hand-block print double bedsheet. 100% cotton, vibrant colors.",
        category_id: catMap["Bedsheets"], is_available: true, is_featured: false,
        stock_count: 3, colors: ["Multi-color", "Blue", "Pink"], video_url: null,
        created_at: fiveDaysAgo,
      },

      // Dupattas
      {
        code: "700001", name: "Bandhani Dupatta", price: 450,
        description: "Traditional Bandhani tie-dye dupatta. Pure cotton with beautiful pattern. Goes with any suit or kurta.",
        category_id: catMap["Dupattas"], is_available: true, is_featured: false,
        stock_count: null, colors: ["Red", "Yellow", "Green", "Orange", "Pink"], video_url: null,
        created_at: oneDayAgo,
      },
      {
        code: "700002", name: "Silk Embroidered Dupatta", price: 800,
        description: "Elegant silk dupatta with heavy embroidery work. Perfect for wedding outfits.",
        category_id: catMap["Dupattas"], is_available: true, is_featured: false,
        stock_count: 1, colors: ["Red", "Golden", "Maroon", "Navy"], video_url: null,
        created_at: twoDaysAgo,
      },

      // Kids Wear
      {
        code: "800001", name: "Kids Cotton T-Shirt", price: 250,
        description: "Soft cotton t-shirt for kids (age 4-10). Fun cartoon prints, comfortable for daily wear.",
        category_id: catMap["Kids Wear"], is_available: true, is_featured: false,
        stock_count: null, colors: ["Red", "Blue", "Yellow", "Green", "White"], video_url: null,
        created_at: fiveDaysAgo,
      },
      {
        code: "800002", name: "Kids Traditional Kurta Set", price: 550,
        description: "Festive kurta pajama set for boys (age 3-8). Comes with matching topi. Perfect for Diwali and weddings.",
        category_id: catMap["Kids Wear"], is_available: true, is_featured: false,
        stock_count: 2, colors: ["Cream", "Golden", "White", "Maroon"], video_url: null,
        created_at: oneDayAgo,
      },
      {
        code: "800003", name: "Girls Lehenga Choli Set", price: 750,
        description: "Beautiful lehenga choli set for girls (age 4-10). Embroidered with mirror work. Festival special.",
        category_id: catMap["Kids Wear"], is_available: false, is_featured: false,
        stock_count: null, colors: ["Pink", "Red", "Purple"], video_url: null,
        created_at: tenDaysAgo,
      },
    ];

    const { data: prodData, error: prodError } = await db
      .from("products")
      .insert(products)
      .select();

    if (prodError || !prodData) {
      return NextResponse.json({ error: prodError?.message || "Failed to create products" }, { status: 500 });
    }

    // 5. Add product images (using placeholder Unsplash images)
    const imageInserts = prodData.map((product, index) => ({
      product_id: product.id,
      cloudinary_url: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
      is_primary: true,
      display_order: 0,
    }));

    // Add second images for featured products
    const featuredProducts = prodData.filter((p) => p.is_featured);
    featuredProducts.forEach((p, i) => {
      imageInserts.push({
        product_id: p.id,
        cloudinary_url: PLACEHOLDER_IMAGES[(i + 8) % PLACEHOLDER_IMAGES.length],
        is_primary: false,
        display_order: 1,
      });
    });

    await db.from("product_images").insert(imageInserts);

    // 6. Create collections
    const { data: collData } = await db
      .from("collections")
      .insert([
        { name: "Wedding Collection", description: "Premium sarees, kurtas and outfits for weddings and special occasions", is_active: true },
        { name: "Summer Special", description: "Cool cotton wear perfect for hot summer days", is_active: true },
        { name: "Festival Special", description: "Traditional outfits for Diwali, Holi and festive celebrations", is_active: true },
        { name: "Under ₹500 Store", description: "Quality products at pocket-friendly prices", is_active: true },
      ])
      .select();

    if (collData) {
      const collProductLinks: Array<{ collection_id: string; product_id: string }> = [];

      // Wedding Collection: expensive sarees, silk kurtas, silk dupattas
      const weddingCodes = ["100001", "100003", "100004", "400003", "700002", "800003"];
      const summerCodes = ["100002", "200004", "300003", "400002", "500001"];
      const festivalCodes = ["100001", "100003", "400001", "400003", "600001", "700001", "800002"];
      const budgetCodes = ["200004", "300003", "500002", "800001", "500001", "400002"];

      const collMap: Record<string, string[]> = {
        "Wedding Collection": weddingCodes,
        "Summer Special": summerCodes,
        "Festival Special": festivalCodes,
        "Under ₹500 Store": budgetCodes,
      };

      collData.forEach((coll) => {
        const codes = collMap[coll.name] || [];
        codes.forEach((code) => {
          const prod = prodData.find((p) => p.code === code);
          if (prod) {
            collProductLinks.push({
              collection_id: coll.id,
              product_id: prod.id,
            });
          }
        });
      });

      if (collProductLinks.length > 0) {
        await db.from("collection_products").insert(collProductLinks);
      }
    }

    // 7. Add some visitor counts
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

    await db.from("visitor_count").insert([
      { date: dayBefore, count: 45 },
      { date: yesterday, count: 78 },
      { date: today, count: 23 },
    ]);

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully!",
      data: {
        categories: catData.length,
        products: prodData.length,
        collections: collData?.length || 0,
        admin: "username: admin, password: admin123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Seeding failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send a POST request to this endpoint to seed demo data.",
    warning: "Only works if the database is empty. Creates 24 products, 8 categories, 4 collections, and 1 admin (admin/admin123).",
  });
}
