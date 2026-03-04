import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PartnerStats {
    comissaoMes: number;
    comissaoAnterior: number;
    volumeProcessado: number;
    clientesAtivos: number;
    margemMedia: number;
    totalOrders: number;
}

interface PartnerConfig {
    id: string;
    companyName: string | null;
    markupPercent: number;
    markupType: string | null;
    priceSource: string | null;
    tradingVolumeMonthly: number | null;
    isActive: boolean;
}

interface PartnerOrder {
    id: string;
    amount: number;
    total: number;
    locked_price: number;
    status: string;
    created_at: string;
    network: string;
}

interface QuoteClient {
    id: string;
    slug: string;
    client_name: string;
    spread_percent: number;
    is_active: boolean;
}

export function usePartnerDashboard() {
    const [stats, setStats] = useState<PartnerStats>({
        comissaoMes: 0,
        comissaoAnterior: 0,
        volumeProcessado: 0,
        clientesAtivos: 0,
        margemMedia: 0,
        totalOrders: 0,
    });
    const [config, setConfig] = useState<PartnerConfig | null>(null);
    const [orders, setOrders] = useState<PartnerOrder[]>([]);
    const [quoteClients, setQuoteClients] = useState<QuoteClient[]>([]);
    const [chartData, setChartData] = useState<{ data: string; comissao: number; volume: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            // Fetch partner B2B config
            const { data: configData } = await supabase
                .from("partner_b2b_config")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_active", true)
                .maybeSingle();

            if (configData) {
                setConfig({
                    id: configData.id,
                    companyName: configData.company_name,
                    markupPercent: configData.markup_percent,
                    markupType: configData.markup_type,
                    priceSource: configData.price_source,
                    tradingVolumeMonthly: configData.trading_volume_monthly,
                    isActive: configData.is_active ?? false,
                });
            }

            // Fetch orders for this user (B2B partner orders)
            const { data: ordersData } = await supabase
                .from("orders")
                .select("id, amount, total, locked_price, status, created_at, network")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            const allOrders = ordersData || [];
            setOrders(allOrders);

            // Calculate stats from real orders
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const thisMonthOrders = allOrders.filter(
                (o) => new Date(o.created_at) >= startOfMonth && (o.status === "completed" || o.status === "paid")
            );
            const prevMonthOrders = allOrders.filter(
                (o) => {
                    const d = new Date(o.created_at);
                    return d >= startOfPrevMonth && d <= endOfPrevMonth && (o.status === "completed" || o.status === "paid");
                }
            );

            const markup = configData?.markup_percent || 1.0;
            const thisMonthVolume = thisMonthOrders.reduce((sum, o) => sum + o.amount, 0);
            const prevMonthVolume = prevMonthOrders.reduce((sum, o) => sum + o.amount, 0);
            const comissaoMes = thisMonthVolume * (markup / 100);
            const comissaoAnterior = prevMonthVolume * (markup / 100);

            setStats({
                comissaoMes,
                comissaoAnterior,
                volumeProcessado: thisMonthVolume,
                clientesAtivos: 0, // Will be calculated from quote clients
                margemMedia: markup,
                totalOrders: thisMonthOrders.length,
            });

            // Build chart data from last 90 days
            const last90 = new Date();
            last90.setDate(last90.getDate() - 90);

            const recentOrders = allOrders.filter(
                (o) => new Date(o.created_at) >= last90 && (o.status === "completed" || o.status === "paid")
            );

            // Group by week
            const weekMap = new Map<string, { comissao: number; volume: number }>();
            recentOrders.forEach((order) => {
                const d = new Date(order.created_at);
                const weekKey = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
                const cur = weekMap.get(weekKey) || { comissao: 0, volume: 0 };
                cur.volume += order.amount;
                cur.comissao += order.amount * (markup / 100);
                weekMap.set(weekKey, cur);
            });

            const chart = Array.from(weekMap.entries()).map(([data, vals]) => ({
                data,
                comissao: Math.round(vals.comissao),
                volume: Math.round(vals.volume),
            }));
            setChartData(chart);

            // Fetch OTC quote clients for this user
            const { data: clientsData } = await supabase
                .from("otc_quote_clients")
                .select("*")
                .eq("created_by", user.id);

            if (clientsData) {
                setQuoteClients(clientsData);
                setStats((prev) => ({
                    ...prev,
                    clientesAtivos: clientsData.filter((c) => c.is_active).length,
                }));
            }
        } catch (err: any) {
            console.error("Dashboard error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        config,
        orders,
        quoteClients,
        chartData,
        isLoading,
        error,
        refetch: fetchDashboardData,
    };
}
