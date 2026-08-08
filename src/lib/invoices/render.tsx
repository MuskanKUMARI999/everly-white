import "server-only";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { InvoiceDocument } from "@/lib/invoices/InvoiceDocument";
import { ensureInvoiceFont } from "@/lib/invoices/pdfFont";
import { loadInvoiceLogo } from "@/lib/invoices/pdfLogo";
import type { Tables } from "@/lib/supabase/database.types";

/** Renders an issued invoice row to PDF bytes. */
export async function renderInvoicePdf(invoice: Tables<"invoices">): Promise<Buffer> {
  const hasFont = ensureInvoiceFont();
  const logo = loadInvoiceLogo();

  // renderToBuffer's signature demands ReactElement<DocumentProps>, but a
  // component that RETURNS a <Document> has its own prop type, which never
  // structurally matches. The cast is on the element's prop types only — the
  // element genuinely is a Document, which is what the renderer requires.
  const element = (
    <InvoiceDocument invoice={invoice} hasFont={hasFont} logo={logo} />
  ) as unknown as ReactElement<DocumentProps>;

  return renderToBuffer(element);
}

/**
 * A filename for the download. Invoice numbers contain slashes (EW/2026-27/0001)
 * which are not legal in filenames and would be read as a path, so they become
 * hyphens: EW-2026-27-0001.pdf.
 */
export function invoiceFileName(invoiceNumber: string): string {
  return `${invoiceNumber.replace(/[^A-Za-z0-9._-]+/g, "-")}.pdf`;
}
