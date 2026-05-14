"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import FanzToken from "../../src/abis/FanzToken.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function DelegatePage() {
  const [address, setAddress] = useState("");
  
  const { data: hash, isPending, writeContract } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error("Please enter an address");
      return;
    }

    if (!process.env.NEXT_PUBLIC_FZ_TOKEN_ADDRESS) {
      toast.error("Token address not configured");
      return;
    }

    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_FZ_TOKEN_ADDRESS as `0x${string}`,
        abi: FanzToken.abi,
        functionName: "delegate",
        args: [address as `0x${string}`],
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate delegation");
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Delegate Votes</CardTitle>
          <CardDescription>
            Delegate your voting power to another address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDelegate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Delegate Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isPending || isConfirming}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isPending || isConfirming}
            >
              {(isPending || isConfirming) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? "Confirm in Wallet..." : "Confirming Transaction..."}
                </>
              ) : (
                "Delegate"
              )}
            </Button>

            {hash && (
              <div className="text-sm text-muted-foreground break-all">
                <p>Transaction Hash:</p>
                <code className="text-xs bg-muted p-1 rounded">{hash}</code>
              </div>
            )}

            {isSuccess && (
              <div className="text-sm text-green-600 font-medium">
                Delegation confirmed successfully!
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
