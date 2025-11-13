"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSwitchChain } from 'wagmi';
import { useAuth } from "@/hooks";
import { Wallet, LogOut, ChevronDown, Network, Copy, Check, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

// Simple helpers/components to replace missing UI imports
function shortenAddress(addr: string, left: number = 6, right: number = 4) {
  if (!addr) return "";
  if (addr.length <= left + right) return addr;
  return `${addr.slice(0, left)}...${addr.slice(-right)}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
};
function Button({ variant = "default", size = "md", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md transition-all";
  const variants = variant === "default"
    ? "bg-gradient-to-r from-primary to-pink-500 text-white hover:from-primary/90 hover:to-pink-500/90"
    : "border border-white/20 text-white hover:bg-white/10";
  const sizes = size === "sm" ? "h-7 px-2 py-1 text-xs" : size === "lg" ? "h-10 px-4 py-2 text-base" : "h-9 px-3 py-2 text-sm";
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...props} />;
}

function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${className}`}>{children}</span>;
}

export function ConnectWalletButton() {
  // State for copy functionality and dropdown
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Privy hooks
  const { ready, authenticated} = usePrivy();
  // WAGMI hooks
  const { chain } = useAccount();
  const { chains, error: switchNetworkError, switchChain } = useSwitchChain();
  //Auth Hooks
  const { userAddress: walletAddress, login, privyLogout } = useAuth();

  // Handler functions for new functionality
  const handleCopyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <Button disabled className="gap-2 bg-gradient-to-r from-primary to-pink-500 text-white font-semibold shadow-glow opacity-75 cursor-not-allowed border-0">
        <Wallet className="h-4 w-4 animate-spin" />
        Loading Auth...
      </Button>
    );
  }

  // If wallet is connected and user is authenticated
  if (walletAddress && authenticated) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white font-semibold shadow-glow hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/10"
        >
          <Wallet className="h-4 w-4" />
          <span className="flex items-center gap-1">
            {shortenAddress(walletAddress)}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Custom Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/20 bg-gradient-to-br from-gray-700 to-gray-500 shadow-2xl z-50 text-white animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Network Section */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between text-sm font-semibold text-white/90 mb-2">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network
                </div>
                {chain && (
                  <Badge className="font-mono text-xs border-white/20 text-white">
                    {chain.name}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {chains.map((x) => (
                  <Button
                    disabled={!switchChain || x.id === chain?.id}
                    key={x.id}
                    onClick={() => switchChain?.({chainId: x.id})}
                    variant={x.id === chain?.id ? "default" : "outline"}
                    size="sm"
                    className={`text-xs px-2 py-1 h-7 transition-all duration-200 ${
                      x.id === chain?.id 
                        ? "bg-gradient-to-r from-primary to-pink-500 text-white shadow-md" 
                        : "hover:bg-white/10"
                    }`}
                  >
                    {x.name}
                  </Button>
                ))}
              </div>
              
              {/* Error Section */}
              {switchNetworkError && (
                <div className="mt-2">
                  <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
                    Error: {switchNetworkError.message}
                  </div>
                </div>
              )}
            </div>

            {/* Copy Address Section */}
            {walletAddress && (
              <div className="px-4 py-3 border-b border-white/10">
                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {copied ? "Copied!" : "Copy Address"}
                    </span>
                  </div>
                  <span className="text-xs text-white/60">
                    {shortenAddress(walletAddress)}
                  </span>
                </button>
              </div>
            )}

            {/* Dashboard Section */}
            <div className="px-4 py-3 border-b border-white/10">
              <Link 
                href="/dashboard" 
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition-colors duration-200"
                onClick={() => setIsDropdownOpen(false)}
              >
                <User className="h-4 w-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
            </div>
            
            {/* Disconnect Section */}
            <div className="px-4 py-3">
              <button
                onClick={() => {
                  privyLogout();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Disconnect Wallet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If wallet is connected but user is not authenticated (should not happen much with Privy)
  if (walletAddress && !authenticated) {
    return (
      <Button
        onClick={privyLogout}
        variant="outline"
        className="gap-2 bg-transparent"
      >
        <Wallet className="h-4 w-4" />
        {shortenAddress(walletAddress)}
      </Button>
    );
  }

  // Default: not connected, show connect button
  return (
    <Button 
      onClick={login}
      className="gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white font-semibold shadow-glow hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/10"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
