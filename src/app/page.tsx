import { Hero } from "@/components/sections/Hero";
import { CenterOfUniverse } from "@/components/sections/CenterOfUniverse";
import { ShopByCategory } from "@/components/sections/ShopByCategory";
import { Bestsellers } from "@/components/sections/Bestsellers";
import { ElevateExperience } from "@/components/sections/ElevateExperience";
import { VideoShowcase } from "@/components/sections/VideoShowcase";
import { CollectionTabs } from "@/components/sections/CollectionTabs";
import { Testimonials } from "@/components/sections/Testimonials";
import { Journal } from "@/components/sections/Journal";
import { InstagramFeed } from "@/components/sections/InstagramFeed";
import { Newsletter } from "@/components/sections/Newsletter";
import { CollectionTrustBar } from "@/components/collection/CollectionTrustBar";
import { getAllProducts } from "@/components/products/productsData";
import { getAllReviews, mapReview } from "@/lib/data/reviews";
import { getAllBlogPosts } from "@/lib/data/blog";
import { getActiveBanners } from "@/lib/data/banners";

export default async function Home() {
  const allProducts = await getAllProducts();
  const reviews = await getAllReviews();
  const blogPosts = await getAllBlogPosts();
  const heroBanners = await getActiveBanners("homepage_hero");
  // banner.alt is what the client types into Admin → Banners "Alt Text". It was being dropped here,
  // so an uploaded hero rendered with no alt at all. Blank stays blank (an alt can't be guessed for
  // an image we've never seen); Hero only substitutes a name when the banner is also a link.
  const heroSlides = heroBanners.map((banner) => ({
    src: banner.image_url,
    alt: banner.alt ?? "",
    href: banner.link_url,
  }));

  const bestSellers = allProducts.slice(0, 4);
  const collectionProducts = allProducts.slice(0, 4);
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  // The homepage testimonial cards show customer photos, so prefer reviews that have them —
  // falling back to ones without if too few photo reviews are available.
  const allReviews = reviews.map(mapReview);
  const withPhotos = allReviews.filter((review) => review.photos?.length);
  const featuredReviews = [
    ...withPhotos,
    ...allReviews.filter((review) => !review.photos?.length),
  ].slice(0, 3);

  // The pair shown in the Journal section, chosen with "Feature on homepage" in Admin → Blog.
  // This used to be two hardcoded slugs, so renaming or deleting either post left the section
  // rendering its heading above an empty grid with nothing to explain why. Now it takes whatever
  // is ticked (newest first) and tops up from the most recent posts, so it is never short.
  const JOURNAL_SLOTS = 2;
  const ticked = blogPosts.filter((post) => post.featuredOnHome);
  const featuredPosts = [
    ...ticked,
    ...blogPosts.filter((post) => !ticked.includes(post)),
  ].slice(0, JOURNAL_SLOTS);

  return (
    <main className="bg-white">
      <Hero averageRating={averageRating} slides={heroSlides} />
      <CenterOfUniverse />
      <ShopByCategory />
      <Bestsellers products={bestSellers} />
      <ElevateExperience />
      <VideoShowcase />
      <CollectionTabs products={collectionProducts} />
      {/* Reviews are all database-backed and deletable in the admin panel — drop the whole
          section rather than render a heading above an empty grid. */}
      {featuredReviews.length > 0 && <Testimonials testimonials={featuredReviews} />}
      <Journal posts={featuredPosts} />
      <InstagramFeed />
      <Newsletter />
      <CollectionTrustBar />
    </main>
  );
}
