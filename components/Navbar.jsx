
"use client";
import { PackageIcon, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton, SignedIn, SignedOut, Protect } from "@clerk/nextjs";

const Navbar = () => {
  const { user } = useUser();
  const router = useRouter();
  const { openSignIn } = useClerk();

  const [search, setSearch] = useState("");
  const [cartDisplayCount, setCartDisplayCount] = useState(0);
  
  // Get cart data from Redux
  const cartTotal = useSelector((state) => state.cart.total);

  // Fix cart count display
  useEffect(() => {
    // Ensure cart count is a valid number
    let count = 0;
    
    if (typeof cartTotal === 'number' && !isNaN(cartTotal)) {
      count = Math.max(0, Math.floor(cartTotal));
    } else if (cartTotal && typeof cartTotal === 'object') {
      // If cartTotal is an object (wrong data), calculate from cartItems
      const cartItems = useSelector(state => state.cart.cartItems);
      if (cartItems && typeof cartItems === 'object') {
        count = Object.values(cartItems).reduce((sum, qty) => {
          const quantity = typeof qty === 'number' ? qty : 0;
          return sum + quantity;
        }, 0);
      }
    }
    
    // Cap at 99 for display
    setCartDisplayCount(count > 99 ? '99+' : count);
  }, [cartTotal]);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/shop?search=${search}`);
  };

  return (
    <nav className="relative bg-white">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
          {/* Logo */}
          <Link
            href="/"
            className="relative text-4xl font-semibold text-slate-700"
          >
            <span className="text-green-600">go</span>cart
            <span className="text-green-600 text-5xl leading-0">.</span>
            <Protect plan='plus'>
            <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
              plus
            </p>
            </Protect>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/">About</Link>
            <Link href="/">Contact</Link>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full"
            >
              <Search size={18} className="text-slate-600" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-600"
                type="text"
                placeholder="Search products"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                required
              />
            </form>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-600"
            >
              <ShoppingCart size={18} />
              Cart
              {cartDisplayCount > 0 && (
                <span className="absolute -top-1 left-3 text-[8px] font-bold text-white bg-red-500 size-3.5 rounded-full flex items-center justify-center">
                  {cartDisplayCount}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            <SignedOut>
              <button
                onClick={openSignIn}
                className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
              >
                Login
              </button>
            </SignedOut>

            <SignedIn>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Orders"
                    labelIcon={<PackageIcon size={16} />}
                    href="/orders"
                  />
                  <UserButton.Action label="Sign out" action="signOut" />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>

          {/* Mobile */}
          <div className="sm:hidden">
            <SignedOut>
              <button
                onClick={openSignIn}
                className="px-7 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full"
              >
                Login
              </button>
            </SignedOut>

            <SignedIn>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Cart"
                    labelIcon={<ShoppingCart size={16} />}
                    href="/cart"
                  />
                  <UserButton.Link
                    label="My Orders"
                    labelIcon={<PackageIcon size={16} />}
                    href="/orders"
                  />
                  <UserButton.Action label="Sign out" action="signOut" />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />
    </nav>
  );
};

export default Navbar;