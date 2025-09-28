import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, Brain, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Metric {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  category: 'performance' | 'efficiency' | 'safety' | 'operations';
  isPositiveTrend?: boolean;
}

interface MetricsGridProps {
  metrics: Metric[];
  className?: string;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, className = "" }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'primary';
      case 'efficiency': return 'success';
      case 'safety': return 'warning';
      case 'operations': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      case 'stable': return Minus;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string, isPositive: boolean = true) => {
    if (trend === 'stable') return 'text-muted-foreground';
    if (trend === 'up') return isPositive ? 'text-success' : 'text-destructive';
    if (trend === 'down') return isPositive ? 'text-destructive' : 'text-success';
    return 'text-muted-foreground';
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric) => {
        const TrendIcon = getTrendIcon(metric.trend);
        const MetricIcon = metric.icon;
        const categoryColor = getCategoryColor(metric.category);
        const trendColor = getTrendColor(metric.trend, metric.isPositiveTrend);

        return (
          <Card key={metric.id} className="glass-card border-primary/20 hologram-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-${categoryColor} border-${categoryColor}/20`}>
                  {metric.category}
                </Badge>
                <MetricIcon className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Main Value */}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-glow">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-sm text-muted-foreground">
                      {metric.unit}
                    </span>
                  )}
                </div>

                {/* Trend Information */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                    <span className={`text-sm font-medium ${trendColor}`}>
                      {formatChange(metric.change)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {metric.changeLabel}
                  </span>
                </div>

                {/* Visual Indicator */}
                <div className="mt-3">
                  <div className="w-full bg-muted/20 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full bg-gradient-to-r ${
                        metric.trend === 'up' 
                          ? 'from-success to-success/60' 
                          : metric.trend === 'down'
                          ? 'from-destructive to-destructive/60'
                          : 'from-muted-foreground to-muted-foreground/60'
                      }`}
                      style={{ width: `${Math.min(Math.abs(metric.change) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricsGrid;