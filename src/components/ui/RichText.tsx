import Link from "next/link";
import type { ReactNode } from "react";
import { paragraphs } from "@/lib/content/sections";

/**
 * Renders admin-entered copy that needs inline links.
 *
 * FAQ answers used to be JSX, so a few of them could embed a link to /contact or WhatsApp. Once the
 * answers moved into the database that had to survive without letting the admin panel store markup:
 * raw HTML from a form is an injection surface, and the client would have to hand-write tags. So
 * answers are plain text with one markdown-style escape hatch — `[label](/return)` — parsed here.
 * Anything that is not a well-formed link is printed verbatim, brackets and all, rather than
 * silently disappearing.
 *
 * Internal paths go through next/link so they prefetch and navigate client-side; external URLs open
 * in a new tab with the usual rel guard.
 */

// Deliberately strict: no nested brackets in the label, no whitespace in the href. A stray "[" in
// ordinary prose ("[sic]") then fails to match and is left alone instead of eating the rest of the
// sentence.
const LINK_PATTERN = /\[([^[\]]+)\]\(([^()\s]+)\)/g;

const linkClasses = "text-brown underline hover:no-underline";

function isInternal(href: string) {
  return href.startsWith("/") || href.startsWith("#");
}

/** Splits one line of copy into text runs and links. Exported for headings and other inline spots. */
export function inlineText(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  // matchAll needs the regex reset between calls; a module-level /g regex is stateful.
  LINK_PATTERN.lastIndex = 0;
  for (const match of value.matchAll(LINK_PATTERN)) {
    const [full, label, href] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) nodes.push(value.slice(lastIndex, start));

    nodes.push(
      isInternal(href) ? (
        <Link key={`${start}-${href}`} href={href} className={linkClasses}>
          {label}
        </Link>
      ) : (
        <a
          key={`${start}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
        >
          {label}
        </a>
      ),
    );

    lastIndex = start + full.length;
  }

  if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
  return nodes;
}

interface RichTextProps {
  value: string;
  /** Applied to every paragraph. */
  className?: string;
}

export function RichText({ value, className = "" }: RichTextProps) {
  const blocks = paragraphs(value);
  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, i) => (
        <p key={i} className={`${className} ${i > 0 ? "mt-4" : ""}`.trim()}>
          {inlineText(block)}
        </p>
      ))}
    </>
  );
}

/**
 * Copy where each line break is a visual line break rather than a new paragraph — the hero heading
 * and the newsletter blurb, both of which were written as explicit <br /> in the original markup.
 */
export function MultilineText({ value }: { value: string }) {
  const rows = value.split("\n");
  return (
    <>
      {rows.map((row, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {inlineText(row)}
        </span>
      ))}
    </>
  );
}
