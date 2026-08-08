import { permanentRedirect } from "next/navigation";

// Order history now lives inside the account section. This route stays only so old links
// and bookmarks keep working — middleware already sends signed-out visitors to /login.
export default function OrdersPage() {
  permanentRedirect("/account/orders");
}
