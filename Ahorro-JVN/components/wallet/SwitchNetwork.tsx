'use client';

import {useAccount} from 'wagmi';
import {useSwitchChain} from 'wagmi';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

// Simple in-file replacements for missing UI components
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};
function Button({ variant = 'default', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md transition-all';
  const variants = variant === 'default'
    ? 'bg-gradient-to-r from-primary to-pink-500 text-white hover:from-primary/90 hover:to-pink-500/90'
    : 'border border-white/20 text-white hover:bg-white/10';
  const sizes = size === 'sm' ? 'h-7 px-2 py-1 text-xs' : size === 'lg' ? 'h-10 px-4 py-2 text-base' : 'h-9 px-3 py-2 text-sm';
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...props} />;
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${className}`}>{children}</span>;
}

export const SwitchNetwork = () => {
  const {chain} = useAccount();
  const {chains, error: switchNetworkError, switchChain} = useSwitchChain();

  return (
    <div className="flex items-center gap-2 text-white">
      {chain && (
        <Badge className="font-mono text-xs border-white/20 text-white">
          {chain.name}
        </Badge>
      )}
      <div className="flex gap-1">
        {chains.map((x) => (
          <Button
            disabled={!switchChain || x.id === chain?.id}
            key={x.id}
            onClick={() => switchChain?.({chainId: x.id})}
            variant={x.id === chain?.id ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-7"
          >
            {x.name}
          </Button>
        ))}
      </div>
      {switchNetworkError && (
        <div className="text-red-400 text-xs mt-2">
          Error: {switchNetworkError.message}
        </div>
      )}
    </div>
  );
};

export default SwitchNetwork;
