"use client"

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("Checking connection...");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "/api/v1";
        const response = await fetch(`${backendUrl}/status`);
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(data.message || "Connected");
          setIsConnected(true);
        } else {
          setBackendStatus("Failed to connect: " + response.statusText);
          setIsConnected(false);
        }
      } catch (error) {
        setBackendStatus("Error connecting to backend");
        setIsConnected(false);
        console.error("Connection error:", error);
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Backend Status
          </h1>
          <div className={`p-4 rounded-lg border ${isConnected ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
            <p className="font-medium">{backendStatus}</p>
          </div>

          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This page now checks the connection to the Spring Boot backend on <code>/api/v1/status</code>.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {/* Links preserved but simplified for focus */}
        </div>
      </main>
    </div>
  );
}
