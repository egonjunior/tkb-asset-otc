import { useEffect, useRef } from 'react';
import { createChart, IChartApi, LineData, LineSeries } from 'lightweight-charts';

interface ChartConfig {
  container: HTMLDivElement;
  data: LineData[];
  tkbData: LineData[];
}

export const useTradingViewChart = ({ container, data, tkbData }: ChartConfig) => {
  const chartRef = useRef<IChartApi | null>(null);
  const binanceSeriesRef = useRef<any>(null);
  const tkbSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!container) return;

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
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
    });

    // Série Binance (linha azul sólida)
    const binanceSeries = chart.addSeries(LineSeries, {
      color: '#3B82F6',
      lineWidth: 3,
      title: 'Mercado',
    });

    // Série TKB (linha verde tracejada)
    const tkbSeries = chart.addSeries(LineSeries, {
      color: '#10B981',
      lineWidth: 3,
      lineStyle: 2,
      title: 'TKB Asset (+1%)',
    });

    binanceSeries.setData(data);
    tkbSeries.setData(tkbData);

    chartRef.current = chart;
    binanceSeriesRef.current = binanceSeries;
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
    if (!binanceSeriesRef.current || !tkbSeriesRef.current) return;
    
    if (data.length > 0) {
      binanceSeriesRef.current.setData(data);
    }
    if (tkbData.length > 0) {
      tkbSeriesRef.current.setData(tkbData);
    }
  }, [data, tkbData]);

  return { chart: chartRef.current };
};
