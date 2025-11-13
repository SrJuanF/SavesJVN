"use client";
import Link from "next/link";
import { useAuth } from "@/hooks";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/wallet/ConnectWallets";

export function Navbar() {
  const { authenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    
    if (authenticated && pathname === "/") {
      router.replace("/dashboard");
    }else if(!authenticated && pathname === "/dashboard"){
      router.replace("/");
    }
  }, [authenticated, pathname, router]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-10">
        <Link
          href="/"
          className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight"
        >
          Ahorro <span className="text-white">JVN</span>
        </Link>

        <ConnectWalletButton />
      </div>
    </nav>
  );
}
