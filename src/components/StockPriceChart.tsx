import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface PricePoint {
  price: number;
  time: string;
}

interface StockPriceChartProps {
  stockId: string;
  currentPrice: number;
  previousPrice: number;
}

export function StockPriceChart({ stockId, currentPrice, previousPrice }: StockPriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceHistory();
  }, [stockId, currentPrice]);

  const fetchPriceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_price_history")
        .select("price, recorded_at")
        .eq("stock_id", stockId)
        .order("recorded_at", { ascending: true })
        .limit(20);

      if (error) throw error;

      const history: PricePoint[] = (data || []).map(d => ({
        price: Number(d.price),
        time: d.recorded_at
      }));

      // Add current price as the latest point
      history.push({ price: currentPrice, time: new Date().toISOString() });

      setPriceHistory(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      // Fallback to just showing current and previous
      setPriceHistory([
        { price: previousPrice, time: "prev" },
        { price: currentPrice, time: "now" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isUp = currentPrice >= previousPrice;
  const strokeColor = isUp ? "#22c55e" : "#ef4444"; // green-500 / red-500

  if (loading || priceHistory.length < 2) {
    return (
      <div className="h-12 w-20 flex items-center justify-center">
        <div className="h-[2px] w-full bg-muted rounded" />
      </div>
    );
  }

  const minPrice = Math.min(...priceHistory.map(p => p.price)) * 0.95;
  const maxPrice = Math.max(...priceHistory.map(p => p.price)) * 1.05;

  return (
    <div className="h-12 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={priceHistory}>
          <YAxis domain={[minPrice, maxPrice]} hide />
          <Line
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
