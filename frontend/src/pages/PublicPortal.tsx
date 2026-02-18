import { useEffect, useState, useCallback } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, CANISTER_ID } from "@/lib/icp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Wallet,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Blocks,
  ChevronLeft,
  ChevronRight,
  Copy,
  ArrowLeft,
  RefreshCw,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTokenAmount } from "@/lib/dataTransformers";

const ICP_EXPLORER_CANISTER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

interface BarangayWallet {
  walletId: number;
  address: string;
  label: string;
  walletType: string;
  totalTransactions: number;
  totalSpent: number;
  totalReceived: number;
}

interface WalletTransaction {
  id: number;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenType: string;
  status: string;
  timestamp: Date;
  memo: string;
}

export default function PublicPortal() {
  const [actor, setActor] = useState<any>(null);
  const [wallets, setWallets] = useState<BarangayWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<BarangayWallet | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTx, setTotalTx] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const txPerPage = 10;

  // Create anonymous actor (no identity needed)
  useEffect(() => {
    const initActor = async () => {
      try {
        const isLocalHost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        const useMainnet =
          (import.meta.env.VITE_USE_MAINNET === "true" ||
            import.meta.env.VITE_USE_MAINNET === "1");

        const host =
          useMainnet || !isLocalHost
            ? "https://ic0.app"
            : "http://127.0.0.1:4943";

        const agent = new HttpAgent({ host });

        if (host.includes("127.0.0.1") || host.includes("localhost")) {
          try {
            await agent.fetchRootKey();
          } catch {
            console.warn("Unable to fetch root key");
          }
        }

        const canisterId =
          (import.meta.env.VITE_BACKEND_CANISTER_ID as string) || CANISTER_ID;

        const backendActor = Actor.createActor(idlFactory, {
          agent,
          canisterId,
        });
        setActor(backendActor);
      } catch (err) {
        console.error("Failed to create anonymous actor:", err);
        setLoading(false);
      }
    };
    initActor();
  }, []);

  const fetchWallets = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const result = await actor.getPublicBarangayWallets();
      setWallets(
        result.map((w: any) => ({
          walletId: Number(w.walletId),
          address: w.address,
          label: w.walletLabel,
          walletType: w.walletType,
          totalTransactions: Number(w.totalTransactions),
          totalSpent: Number(w.totalSpent),
          totalReceived: Number(w.totalReceived),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch wallets:", err);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor) fetchWallets();
  }, [actor, fetchWallets]);

  const fetchWalletTransactions = useCallback(
    async (address: string, page: number) => {
      if (!actor) return;
      setTxLoading(true);
      try {
        const result = await actor.getPublicWalletTransactions(
          address,
          BigInt(page),
          BigInt(txPerPage)
        );
        setWalletTransactions(
          result.transactions.map((tx: any) => ({
            id: Number(tx.id),
            hash: tx.hash,
            fromAddress: tx.fromAddress,
            toAddress: tx.toAddress,
            amount: Number(tx.amount),
            tokenType: tx.tokenType,
            status: tx.status,
            timestamp: new Date(Number(tx.timestamp) / 1_000_000),
            memo: tx.memo,
          }))
        );
        setTotalTx(Number(result.total));
        setHasMore(result.hasMore);
      } catch (err) {
        console.error("Failed to fetch wallet transactions:", err);
      } finally {
        setTxLoading(false);
      }
    },
    [actor]
  );

  const handleSelectWallet = (wallet: BarangayWallet) => {
    setSelectedWallet(wallet);
    setCurrentPage(1);
    setSearchQuery("");
    fetchWalletTransactions(wallet.address, 1);
  };

  const handleBack = () => {
    setSelectedWallet(null);
    setWalletTransactions([]);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const handlePageChange = (newPage: number) => {
    if (!selectedWallet) return;
    setCurrentPage(newPage);
    fetchWalletTransactions(selectedWallet.address, newPage);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatAmount = (amount: number) => {
    return formatTokenAmount(amount, "ICP" as any);
  };

  const totalPages = Math.ceil(totalTx / txPerPage);

  const filteredWallets = wallets.filter(
    (w) =>
      w.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTx = walletTransactions.filter(
    (tx) =>
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-flow/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-flow flex items-center justify-center shadow-glow">
                <Blocks className="w-5 h-5 text-flow-foreground" />
              </div>
              <div>
                <span className="font-bold text-xl text-white tracking-tight">
                  eSihagBa
                </span>
                <span className="hidden sm:inline text-white/40 text-sm ml-2">
                  Public Transparency Portal
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={ICP_EXPLORER_CANISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                ICP Explorer
              </a>
              <a href="#/" className="text-sm text-flow hover:text-flow/80 font-medium transition-colors">
                Admin Login
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-flow text-sm font-medium">
              <Shield className="w-4 h-4" />
              Public Access - No Login Required
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Barangay Budget{" "}
              <span className="text-gradient-flow">Transparency</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              View barangay wallet expenditures, verify transactions on the
              blockchain, and audit public spending in real-time.
            </p>
          </div>

          {/* Blockchain Info Banner */}
          <Card className="border-accent/30 bg-accent/5 animate-slide-up">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">
                      Blockchain Verified
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      All data stored immutably on the Internet Computer.
                      Click any transaction hash to verify on-chain.
                    </p>
                  </div>
                </div>
                <a
                  href={ICP_EXPLORER_CANISTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">View Canister</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {!selectedWallet ? (
            /* ============================================
               WALLET LIST VIEW
               ============================================ */
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search barangay wallets..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-flow/20">
                        <Users className="h-5 w-5 text-flow" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {wallets.length}
                        </p>
                        <p className="text-xs text-white/50">
                          Registered Barangays
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/20">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {wallets.reduce((s, w) => s + w.totalTransactions, 0)}
                        </p>
                        <p className="text-xs text-white/50">
                          Total Transactions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-success/20">
                        <Wallet className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {formatAmount(
                            wallets.reduce((s, w) => s + w.totalSpent, 0)
                          )}
                        </p>
                        <p className="text-xs text-white/50">
                          Total Expenditure
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Cards Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-52 bg-white/10 rounded-2xl"
                    />
                  ))}
                </div>
              ) : filteredWallets.length === 0 ? (
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="py-16 text-center">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-white/20" />
                    <h3 className="font-semibold text-white/80 mb-2">
                      No Barangay Wallets Found
                    </h3>
                    <p className="text-sm text-white/40">
                      {searchQuery
                        ? "No wallets match your search."
                        : "No barangay wallets have been registered yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWallets.map((wallet, index) => (
                    <Card
                      key={wallet.walletId}
                      className="bg-white/[0.03] border-white/10 hover:border-flow/30 hover:shadow-lg hover:shadow-flow/5 transition-all cursor-pointer group animate-slide-up"
                      style={{ animationDelay: `${index * 60}ms` }}
                      onClick={() => handleSelectWallet(wallet)}
                    >
                      <CardContent className="p-6 space-y-4">
                        {/* Wallet Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-flow flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                              <Wallet className="w-5 h-5 text-flow-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-sm">
                                {wallet.label}
                              </h3>
                              <p className="text-xs text-white/40">
                                {wallet.walletType}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-flow border-flow/30 text-[10px]"
                          >
                            {wallet.totalTransactions} txns
                          </Badge>
                        </div>

                        {/* Wallet Address */}
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <code className="text-xs font-mono text-white/60 flex-1 truncate">
                            {wallet.address}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(wallet.address);
                            }}
                            className="text-white/30 hover:text-white/60 transition-colors shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-success/5 border border-success/10">
                            <p className="text-[10px] text-success/60 font-medium uppercase tracking-wider">
                              Received
                            </p>
                            <p className="text-sm font-bold text-success">
                              {formatAmount(wallet.totalReceived)}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                            <p className="text-[10px] text-warning/60 font-medium uppercase tracking-wider">
                              Spent
                            </p>
                            <p className="text-sm font-bold text-warning">
                              {formatAmount(wallet.totalSpent)}
                            </p>
                          </div>
                        </div>

                        {/* View Details */}
                        <div className="flex items-center justify-center gap-2 text-xs text-flow/70 group-hover:text-flow transition-colors pt-1">
                          <span>View Transactions</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ============================================
               WALLET DETAIL VIEW (Transactions)
               ============================================ */
            <div className="space-y-6 animate-fade-in">
              {/* Back Button & Wallet Header */}
              <div className="flex items-start gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0 mt-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-white">
                      {selectedWallet.label}
                    </h2>
                    <Badge variant="outline" className="text-flow border-flow/30">
                      {selectedWallet.walletType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-white/50">
                      {selectedWallet.address}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(selectedWallet.address)
                      }
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchWalletTransactions(
                      selectedWallet.address,
                      currentPage
                    )
                  }
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 mr-1.5",
                      txLoading && "animate-spin"
                    )}
                  />
                  Refresh
                </Button>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-flow">
                      {selectedWallet.totalTransactions}
                    </p>
                    <p className="text-xs text-white/50">Transactions</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-success">
                      {formatAmount(selectedWallet.totalReceived)}
                    </p>
                    <p className="text-xs text-white/50">Total Received</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-warning">
                      {formatAmount(selectedWallet.totalSpent)}
                    </p>
                    <p className="text-xs text-white/50">Total Spent</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search Transactions */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by hash, address, or memo..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Transaction Cards */}
              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-24 bg-white/10 rounded-2xl"
                    />
                  ))}
                </div>
              ) : filteredTx.length === 0 ? (
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="py-16 text-center">
                    <Blocks className="h-12 w-12 mx-auto mb-4 text-white/20" />
                    <h3 className="font-semibold text-white/80 mb-2">
                      No Transactions Found
                    </h3>
                    <p className="text-sm text-white/40">
                      {searchQuery
                        ? "No transactions match your search."
                        : "This wallet has no confirmed transactions yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredTx.map((tx, index) => {
                    const isOutgoing =
                      tx.fromAddress === selectedWallet.address;
                    return (
                      <Card
                        key={tx.id}
                        className="bg-white/[0.03] border-white/10 hover:border-white/20 transition-all animate-slide-up"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Direction Icon */}
                            <div
                              className={cn(
                                "p-2.5 rounded-xl shrink-0 self-start",
                                isOutgoing
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
                              )}
                            >
                              {isOutgoing ? (
                                <ArrowUpRight className="h-5 w-5" />
                              ) : (
                                <ArrowDownLeft className="h-5 w-5" />
                              )}
                            </div>

                            {/* Transaction Info */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Hash + Audit Link */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <a
                                  href={ICP_EXPLORER_CANISTER_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-sm font-medium text-flow hover:text-flow/80 transition-colors underline decoration-flow/30 hover:decoration-flow/60"
                                  title="View on ICP Explorer"
                                >
                                  {truncateHash(tx.hash)}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(tx.hash)}
                                  className="text-white/30 hover:text-white/60 transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px]",
                                    isOutgoing
                                      ? "text-warning border-warning/30"
                                      : "text-success border-success/30"
                                  )}
                                >
                                  {isOutgoing ? "Outgoing" : "Incoming"}
                                </Badge>
                              </div>

                              {/* Addresses */}
                              <div className="grid sm:grid-cols-2 gap-1 text-xs text-white/40">
                                <div className="truncate">
                                  <span className="text-white/30">From:</span>{" "}
                                  <span className="font-mono">
                                    {truncateHash(tx.fromAddress)}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-white/30">To:</span>{" "}
                                  <span className="font-mono">
                                    {truncateHash(tx.toAddress)}
                                  </span>
                                </div>
                              </div>

                              {tx.memo && (
                                <p className="text-xs text-white/30 truncate">
                                  {tx.memo}
                                </p>
                              )}
                            </div>

                            {/* Amount & Time */}
                            <div className="flex items-center gap-4 lg:text-right">
                              <div>
                                <p
                                  className={cn(
                                    "text-lg font-bold",
                                    isOutgoing
                                      ? "text-warning"
                                      : "text-success"
                                  )}
                                >
                                  {isOutgoing ? "-" : "+"}
                                  {formatAmount(tx.amount)}
                                </p>
                                <p className="text-[10px] text-white/40">
                                  {tx.tokenType}
                                </p>
                              </div>
                              <div className="text-xs text-white/40 hidden sm:block">
                                <p>
                                  {tx.timestamp.toLocaleDateString()}
                                </p>
                                <p>
                                  {tx.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              <a
                                href={ICP_EXPLORER_CANISTER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 hover:text-flow transition-colors shrink-0"
                                title="Audit on ICP Explorer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/40">
                    Showing{" "}
                    {(currentPage - 1) * txPerPage + 1} -{" "}
                    {Math.min(currentPage * txPerPage, totalTx)} of{" "}
                    {totalTx} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || txLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-white/60">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasMore || txLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-white/[0.02] mt-12">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
              <p>
                eSihagBa - Transparent City Budget Tracker on the Internet
                Computer
              </p>
              <a
                href={ICP_EXPLORER_CANISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-flow/60 hover:text-flow/80 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Verify on ICP Dashboard
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
