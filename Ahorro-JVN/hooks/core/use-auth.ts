"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useLogin } from "@privy-io/react-auth";
import { useAccount, useDisconnect, useChainId } from "wagmi";
import { useCallback, useMemo, useEffect, useState } from "react";

/**
 * Enhanced authentication hook using Privy
 * Provides a unified interface for authentication across the application
 * Automatically detects if user is registered as a company on-chain
 */
export function useAuth() {
  const { wallets, ready: walletsReady } = useWallets();
  const { ready, authenticated, user, logout } = usePrivy();

  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const [isLoading, setIsLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const [privyAddress, setPrivyAddress] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);


  //const userCheck = UserManager.isUserRegistered(privyAddress as `0x${string}`);

  const info = useCallback(() => {
    /*console.log("*********************************");
    console.log("walletReady", walletsReady);
    console.log("isConnected", isConnected);
    console.log("ready", ready);
    console.log("Wallet", wallets?.[0]?.address)*/
    if (walletsReady && isConnected && wallets?.[0]?.address && user) {
      const adress = wallets?.[0]?.address;
      const emmail = user?.email?.address || null;
      const usserId = user?.id;
      setPrivyAddress(adress as `0x${string}`);
      setEmail(emmail as string);
      setUserId(usserId as string);
    }
  }, [walletsReady, isConnected, wallets, user, ready]);

  useEffect(() => {
    info();
  }, [info]);


  
  // Función para desconectar tanto Wagmi como Privy
  const privyLogout = async () => {
    try {

      setPrivyAddress(null);
      setEmail(null);
      setUserId(null);

      // Luego desconectar Privy
      await logout();
      // Desconectar Wagmi primero
      await disconnect();
    } catch (error) {
      console.error("Error during disconnect:", error);
    }
  };
  //Login - Register
  const { login } = useLogin({
    onComplete: (loginData: any) => {
      console.log("👤 LinkedAccounts:", loginData?.linkedAccounts?.length);
      // Verificar si hay una wallet conectada recientemente (últimos 3 minutos)
      const hasRecentWalletConnection = loginData?.linkedAccounts?.some(
        (account: any) => {
          if (account.type === "wallet" && account.verifiedAt) {
            const verifiedTime = new Date(account.verifiedAt);
            const currentTime = new Date();
            const timeDifferenceInMinutes =
              (currentTime.getTime() - verifiedTime.getTime()) / (1000 * 60);
            /*console.log('🔍 Wallet verification check:', {
              type: account.type,
              verifiedAt: account.verifiedAt,
              timeDifferenceInMinutes: timeDifferenceInMinutes.toFixed(2),
              isRecent: timeDifferenceInMinutes <= 3
            });*/
            return timeDifferenceInMinutes <= 3;
          }
          return false;
        }
      );

      if (hasRecentWalletConnection) {
        //console.log("✅ Wallet conectada recientemente detectada!");
        // Mostrar modal de registro cuando se detecte una conexión reciente
        setShowRegistrationModal(true);
      } else {
        /*console.log(
          "⏰ No se detectó creacion de wallet reciente (últimos 3 minutos)"
        );*/
      }
    },
    onError: (error: any) => {
      console.error("❌ Login failed:", error);
    },
  });

  return {
    // status loading
    isLoading,
    // Core authentication state
    userAddress: privyAddress,
    email,
    userId,
    authenticated,
    ready,
    chainId,
    // Authentication actions
    login,
    privyLogout,
    // Registration modal state
    showRegistrationModal,
    setShowRegistrationModal,
  };
}
