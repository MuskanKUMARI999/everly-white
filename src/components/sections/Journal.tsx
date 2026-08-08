import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import type { BlogPost } from "@/lib/data/blog";

interface JournalProps {
  posts: BlogPost[];
}

export function Journal({ posts }: JournalProps) {
  return (
    <section className="bg-beige-light py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal className="text-center">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">Blog</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            Embrace the Laid-Back Luxury lifestyle — a peaceful home where emotions elevate beyond
            the senses.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.1}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-8 font-heading text-xl text-neutral-500">{post.title}</h3>
                <span className="mt-3 inline-block font-body text-brown group-hover:underline">
                  Learn More &gt;
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
