import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  centerOfTheUniverse,
  type CollectionProduct,
} from "@/components/collection/collectionData";
import { productCategories } from "@/components/products/productTypes";
import { posts } from "@/components/blog/blogData";
import { seedReviews } from "./seedReviews";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Seeding database...");

  // 1. Categories
  console.log("Inserting categories...");
  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      productCategories.map((cat) => ({ key: cat.key, label: cat.label })),
      { onConflict: "key", ignoreDuplicates: false },
    )
    .select("id, key");

  if (categoryError) throw categoryError;
  console.log(`  ${categories?.length ?? 0} categories`);

  const categoryMap = new Map(categories?.map((c) => [c.key, c.id]) ?? []);
  const centerPiecesId = categoryMap.get("center-pieces");

  // 2. Collection
  console.log("Inserting collection...");
  const { data: collections, error: collectionError } = await supabase
    .from("collections")
    .upsert(
      {
        slug: centerOfTheUniverse.slug,
        title: centerOfTheUniverse.name,
        subtitle: centerOfTheUniverse.subtitle,
        description: centerOfTheUniverse.intro.paragraphs.join("\n\n"),
        category_id: centerPiecesId,
        hero_image: centerOfTheUniverse.heroImage,
        metadata: {
          intro: centerOfTheUniverse.intro,
          stats: centerOfTheUniverse.stats,
          founderNote: centerOfTheUniverse.founderNote,
        },
      },
      { onConflict: "slug", ignoreDuplicates: false },
    )
    .select("id, slug");

  if (collectionError) throw collectionError;
  console.log(`  ${collections?.length ?? 0} collections`);

  const collectionId = collections?.[0]?.id;

  // 3. Products
  console.log("Inserting products...");
  const DEFAULT_DIMENSIONS =
    "Large plate — approx. 20cm (8in) diameter · Small plate — approx. 12cm (5in) diameter. Includes 2 brass display stands, delivered in a branded gift box.";

  const productsToInsert = centerOfTheUniverse.products.map(
    (product: CollectionProduct, index: number) => ({
      slug: product.name.toLowerCase().replace(/\s+/g, "-"),
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: 50,
      is_available: true,
      is_bestseller: index === 0,
      is_new_arrival: index === 0,
      category_id: centerPiecesId,
      collection_id: collectionId,
      dimensions: product.dimensions ?? DEFAULT_DIMENSIONS,
      tagline: product.tagline,
      story: product.story,
      metadata: {
        hoverImage: product.hoverImage,
        hasGallery: Boolean(product.galleryImages?.length),
      },
    }),
  );

  const { data: insertedProducts, error: productError } = await supabase
    .from("products")
    .upsert(productsToInsert, { onConflict: "slug", ignoreDuplicates: false })
    .select("id, slug, name");

  if (productError) throw productError;
  console.log(`  ${insertedProducts?.length ?? 0} products`);

  const productMap = new Map(
    insertedProducts?.map((p) => [p.name, p.id]) ?? [],
  );

  // 4. Product images
  console.log("Inserting product images...");
  const imagesToInsert: {
    product_id: string;
    url: string;
    alt: string;
    position: number;
    is_featured: boolean;
  }[] = [];

  for (const product of centerOfTheUniverse.products) {
    const productId = productMap.get(product.name);
    if (!productId) continue;

    // Main image first
    imagesToInsert.push({
      product_id: productId,
      url: product.image,
      alt: `${product.name} main image`,
      position: 0,
      is_featured: true,
    });

    // Hover image
    if (product.hoverImage) {
      imagesToInsert.push({
        product_id: productId,
        url: product.hoverImage,
        alt: `${product.name} lifestyle image`,
        position: 1,
        is_featured: false,
      });
    }

    // Gallery images
    if (product.galleryImages) {
      for (let i = 0; i < product.galleryImages.length; i++) {
        imagesToInsert.push({
          product_id: productId,
          url: product.galleryImages[i].src,
          alt: product.galleryImages[i].alt,
          position: i + 2,
          is_featured: false,
        });
      }
    }
  }

  // Delete existing images for these products to avoid duplicates on re-seed
  const productIds = insertedProducts?.map((p) => p.id) ?? [];
  if (productIds.length) {
    const { error: deleteImagesError } = await supabase
      .from("product_images")
      .delete()
      .in("product_id", productIds);
    if (deleteImagesError) throw deleteImagesError;
  }

  const { error: imagesError } = await supabase
    .from("product_images")
    .insert(imagesToInsert);
  if (imagesError) throw imagesError;
  console.log(`  ${imagesToInsert.length} product images`);

  // 5. Reviews — insert the pre-written launch reviews, but only into an empty table.
  //
  // Unlike the other seed steps this one must never delete first: the `reviews` table holds genuine
  // customer submissions, and the previous version of this step wiped every row before inserting.
  // Skipping when rows already exist also stops a re-run from duplicating the launch reviews.
  console.log("Inserting reviews...");
  const { count: existingReviews, error: reviewCountError } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true });
  if (reviewCountError) throw reviewCountError;

  if (existingReviews && existingReviews > 0) {
    console.log(`  skipped — ${existingReviews} review(s) already in the table`);
  } else {
    const reviewsToInsert = seedReviews.map((review) => ({
      reviewer_name: review.name,
      rating: review.rating,
      body: review.quote,
      is_approved: true,
      metadata: {
        location: review.location,
        photos: review.photos ?? [],
      },
    }));

    const { error: reviewsError } = await supabase.from("reviews").insert(reviewsToInsert);
    if (reviewsError) throw reviewsError;
    console.log(`  ${reviewsToInsert.length} reviews`);
  }

  // 6. Blog posts
  console.log("Inserting blog posts...");
  const postsToInsert = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: JSON.stringify(post.content),
    cover_image: post.image,
    author: post.author,
    published_at: new Date(post.date).toISOString(),
    is_published: true,
    metadata: {
      category: post.category,
      date: post.date,
      readTime: post.readTime,
      authorRole: post.authorRole,
    },
  }));

  const { error: deletePostsError } = await supabase
    .from("blog_posts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deletePostsError) throw deletePostsError;

  const { error: postsError } = await supabase
    .from("blog_posts")
    .upsert(postsToInsert, { onConflict: "slug", ignoreDuplicates: false });
  if (postsError) throw postsError;
  console.log(`  ${postsToInsert.length} blog posts`);

  console.log("Seeding complete!");
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
