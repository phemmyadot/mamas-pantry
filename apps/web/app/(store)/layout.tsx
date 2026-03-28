import StorefrontHeader from "./_components/StorefrontHeader";
import StorefrontFooter from "./_components/StorefrontFooter";
import CartDrawer from "./_components/CartDrawer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <StorefrontHeader />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
