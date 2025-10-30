import { useEffect, useRef } from 'react';
import { createChart, IChartApi, LineData } from 'lightweight-charts';
import { CandleData } from './useBinanceCandles';

interface ChartConfig {
  container: HTMLDivElement | null;
  candleData: CandleData[];
  tkbData: LineData[];
}

export const useTradingViewChart = ({ container, candleData, tkbData }: ChartConfig) => {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const tkbSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!container || candleData.length === 0) return;

    // Criar gráfico com tema dark
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
    });

    // Série Candlestick (velas verde/vermelho)
    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Série TKB (linha verde tracejada)
    const tkbSeries = (chart as any).addLineSeries({
      color: '#10B981',
      lineWidth: 2,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    candleSeries.setData(candleData);
    tkbSeries.setData(tkbData);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    tkbSeriesRef.current = tkbSeries;

    // Responsive resize
    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [container]);

  // Update data em tempo real
  useEffect(() => {
    if (!candleSeriesRef.current || !tkbSeriesRef.current) return;
    
    if (candleData.length > 0) {
      candleSeriesRef.current.setData(candleData);
    }
    if (tkbData.length > 0) {
      tkbSeriesRef.current.setData(tkbData);
    }
  }, [candleData, tkbData]);

  return { chart: chartRef.current };
};
