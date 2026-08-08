import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/data/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 bg-beige-light/90 px-3 py-1 font-heading text-[10px] uppercase tracking-[0.14em] text-brown backdrop-blur-sm">
          {post.category}
        </span>
      </div>
      <p className="mt-4 font-heading text-[11px] uppercase tracking-widest text-neutral-300">
        {post.date} &middot; {post.readTime}
      </p>
      <h3 className="mt-2 font-heading text-xl text-neutral-500 transition-colors group-hover:text-brown">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-2 font-body text-neutral-300">{post.excerpt}</p>
      <span className="mt-3 inline-block font-body text-brown group-hover:underline">
        Read More &gt;
      </span>
    </Link>
  );
}
