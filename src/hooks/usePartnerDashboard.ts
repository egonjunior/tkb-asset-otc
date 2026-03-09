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
    quote_client_id: string | null;
    commission?: number;
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

            // Fetch OTC quote clients for this user FIRST so we can use them for commission calculation
            const { data: clientsData } = await supabase
                .from("otc_quote_clients")
                .select("*")
                .eq("created_by", user.id);

            const activeClients = clientsData ? clientsData.filter((c) => c.is_active) : [];
            const clientsMap = new Map((clientsData || []).map(c => [c.id, c.spread_percent]));

            if (clientsData) {
                setQuoteClients(clientsData);
            }

            // Fetch orders for this user (B2B partner orders)
            const { data: ordersData } = await supabase
                .from("orders")
                .select("id, amount, total, locked_price, status, created_at, network, quote_client_id")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            const allOrders = ordersData || [];

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

            const partnerBaseMarkup = configData?.markup_percent || 1.0;

            // Helper to calculate commission based on spread diff
            const calcOrderCommission = (order: PartnerOrder) => {
                if (!order.quote_client_id) return 0; // Trata como volume próprio (sem comissão)
                const clientSpread = clientsMap.get(order.quote_client_id);
                if (clientSpread === undefined) return 0;

                const spreadDiff = clientSpread - partnerBaseMarkup;
                if (spreadDiff <= 0) return 0; // Sem margem de lucro neste cliente

                return order.amount * (spreadDiff / 100);
            };

            const enrichedOrders = allOrders.map(o => ({
                ...o,
                commission: calcOrderCommission(o)
            }));
            setOrders(enrichedOrders);

            const thisMonthVolume = thisMonthOrders.reduce((sum, o) => sum + o.amount, 0);
            const prevMonthVolume = prevMonthOrders.reduce((sum, o) => sum + o.amount, 0);

            const comissaoMes = thisMonthOrders.reduce((sum, o) => sum + calcOrderCommission(o), 0);
            const comissaoAnterior = prevMonthOrders.reduce((sum, o) => sum + calcOrderCommission(o), 0);

            const avgClientSpread = activeClients.length > 0
                ? activeClients.reduce((sum, c) => sum + c.spread_percent, 0) / activeClients.length
                : partnerBaseMarkup;

            setStats({
                comissaoMes,
                comissaoAnterior,
                volumeProcessado: thisMonthVolume,
                clientesAtivos: activeClients.length,
                margemMedia: avgClientSpread,
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
                // "DD/MM" week format
                const weekKey = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
                const cur = weekMap.get(weekKey) || { comissao: 0, volume: 0 };
                cur.volume += order.amount;
                cur.comissao += calcOrderCommission(order);
                weekMap.set(weekKey, cur);
            });

            const chart = Array.from(weekMap.entries()).map(([data, vals]) => ({
                data,
                comissao: Math.round(vals.comissao),
                volume: Math.round(vals.volume),
            }));

            setChartData(chart);

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
