import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "cart";

interface SharedProps {
  variant?: Variant;
  icon?: boolean;
}

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

// Column = button type, row = state (normal / hover / disabled), per design reference.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brown text-beige-light border border-brown " +
    "hover:bg-neutral-500 hover:border-neutral-500 " +
    "disabled:bg-neutral-200 disabled:border-neutral-200 disabled:text-beige-light",
  secondary:
    "bg-transparent text-neutral-500 border border-neutral-500 " +
    "hover:bg-pink-200 hover:border-pink-200 " +
    "disabled:text-neutral-200 disabled:border-neutral-200",
  tertiary:
    "bg-transparent text-neutral-500 border border-transparent " +
    "hover:bg-pink-100 " +
    "disabled:text-neutral-200",
  cart:
    "bg-terracotta text-beige-light border border-terracotta " +
    "hover:bg-brown hover:border-brown " +
    "disabled:bg-neutral-200 disabled:border-neutral-200 disabled:text-beige-light",
};

export function Button({
  variant = "primary",
  icon = true,
  className = "",
  children = "Shop Now",
  href,
  ...props
}: ButtonProps) {
  // py matches the shared input field's height exactly (border-box: 2×py + text line-height + 2px border
  // must equal 2×input-py + input line-height + 2px border) — kept the same at every breakpoint since
  // `inputClasses` doesn't vary by breakpoint either.
  // No whitespace-nowrap: an inline-flex box is already sized to its content, so a label that
  // fits renders identically either way — nowrap only changed what happens when it *doesn't*
  // fit, which was to overflow the button off the side of a phone. text-center keeps a label
  // that does wrap balanced across its lines.
  const classes = `group inline-flex max-w-full cursor-pointer items-center justify-center gap-2.5 px-6 py-4.5 sm:px-8 text-center font-heading text-xs tracking-[0.14em] uppercase transition-all duration-200 active:scale-97 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 ${variantClasses[variant]} ${className}`;

  const content = (
    <>
      {/* shrink-0 so the icons keep their size when a long label wraps beside them. */}
      {icon && <ShoppingBag className="h-4 w-4 shrink-0" strokeWidth={1.5} />}
      {children}
      {icon && (
        <ArrowRight
          className="h-4 w-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
          strokeWidth={1.5}
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
