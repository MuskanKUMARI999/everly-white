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
import { getPageContent } from "@/lib/data/siteContent";
import { number } from "@/lib/content/sections";

export default async function Home() {
  // Every heading, tile, caption and button label on this page is editable in Admin → Home Page;
  // `content` is that copy, falling back to the schema defaults when a section has never been
  // saved. Which *products*, reviews and posts appear is still decided by the product, review and
  // blog admin screens — only how many of them is set here.
  const content = await getPageContent();
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

  const bestsellersContent = content.values("home_bestsellers");
  const collectionsContent = content.values("home_collections");
  const testimonialsContent = content.values("home_testimonials");
  const journalContent = content.values("home_journal");

  const bestSellers = allProducts.slice(0, number(bestsellersContent, "productLimit", 4));
  const collectionProducts = allProducts.slice(0, number(collectionsContent, "productLimit", 4));
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
  ].slice(0, number(testimonialsContent, "reviewLimit", 3));

  // The posts shown in the Journal section, chosen with "Feature on homepage" in Admin → Blog.
  // This used to be two hardcoded slugs, so renaming or deleting either post left the section
  // rendering its heading above an empty grid. Now it takes whatever is ticked (newest first) and
  // tops up from the most recent posts, so it is never short.
  const ticked = blogPosts.filter((post) => post.featuredOnHome);
  const featuredPosts = [
    ...ticked,
    ...blogPosts.filter((post) => !ticked.includes(post)),
  ].slice(0, number(journalContent, "postLimit", 2));

  return (
    <main className="bg-white">
      <Hero averageRating={averageRating} slides={heroSlides} content={content.values("home_hero")} />
      {content.isVisible("home_center") && <CenterOfUniverse content={content.values("home_center")} />}
      {content.isVisible("home_categories") && (
        <ShopByCategory content={content.values("home_categories")} />
      )}
      {content.isVisible("home_bestsellers") && (
        <Bestsellers products={bestSellers} content={bestsellersContent} />
      )}
      {content.isVisible("home_elevate") && (
        <ElevateExperience content={content.values("home_elevate")} />
      )}
      {content.isVisible("home_video") && <VideoShowcase content={content.values("home_video")} />}
      {content.isVisible("home_collections") && (
        <CollectionTabs products={collectionProducts} content={collectionsContent} />
      )}
      {/* Reviews are all database-backed and deletable in the admin panel — drop the whole
          section rather than render a heading above an empty grid. */}
      {content.isVisible("home_testimonials") && featuredReviews.length > 0 && (
        <Testimonials testimonials={featuredReviews} content={testimonialsContent} />
      )}
      {content.isVisible("home_journal") && (
        <Journal posts={featuredPosts} content={journalContent} />
      )}
      {content.isVisible("home_instagram") && (
        <InstagramFeed content={content.values("home_instagram")} />
      )}
      {content.isVisible("home_newsletter") && (
        <Newsletter content={content.values("home_newsletter")} />
      )}
      <CollectionTrustBar />
    </main>
  );
}
