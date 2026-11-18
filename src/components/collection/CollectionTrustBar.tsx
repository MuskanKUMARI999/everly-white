import { ContentIcon } from "@/components/ui/ContentIcon";
import { getPageContent } from "@/lib/data/siteContent";
import { list } from "@/lib/content/sections";

/**
 * The three promises that close the homepage, the products page and every product page.
 *
 * It reads its own copy rather than taking it as a prop: it is dropped into three unrelated pages,
 * and threading the same section through all of them would mean every future page that wants the
 * band has to remember to fetch and pass it. getPageContent is request-deduplicated, so the
 * homepage still makes one content query in total.
 */
export async function CollectionTrustBar() {
  const content = await getPageContent();
  if (!content.isVisible("site_trust_bar")) return null;

  const items = list(content.values("site_trust_bar"), "items").filter((item) => item.title);
  if (items.length === 0) return null;

  return (
    <section className="bg-pink-100 py-14">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {items.map((item, i) => (
            <div key={`${i}-${item.title}`}>
              <ContentIcon name={item.icon} size={26} strokeWidth={1.3} className="mx-auto text-brown" />
              <h4 className="mt-3 font-heading text-[12.5px] uppercase tracking-widest text-neutral-500">
                {item.title}
              </h4>
              <p className="mt-1.5 font-body text-sm text-neutral-300">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
