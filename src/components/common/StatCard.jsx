import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './StatCard.css';

/**
 * StatCard — dashboard metric widget
 * Props: title, value, subtitle, icon, trend (up/down/neutral), trendValue, color, accentLine
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  accentLine = false,
  onClick,
  loading = false,
}) {
  const colorMap = {
    blue:   { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  text: '#38bdf8' },
    purple: { bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', text: '#818cf8' },
    teal:   { bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.2)',  text: '#2dd4bf' },
    red:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#ef4444' },
    orange: { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  text: '#f97316' },
    green:  { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   text: '#22c55e' },
    yellow: { bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)',   text: '#eab308' },
  };

  const c = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="stat-card stat-card-loading">
        <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 40, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '80%' }} />
      </div>
    );
  }

  return (
    <div
      className={`stat-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--stat-color': c.text, '--stat-bg': c.bg, '--stat-border': c.border }}
    >
      {accentLine && <div className="stat-accent-line" />}

      <div className="stat-header">
        <div className="stat-title">{title}</div>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-value">{value}</div>

      {(subtitle || trend) && (
        <div className="stat-footer">
          {trend && (
            <span className={`stat-trend trend-${trend}`}>
              {trend === 'up'      && <TrendingUp size={12} />}
              {trend === 'down'    && <TrendingDown size={12} />}
              {trend === 'neutral' && <Minus size={12} />}
              {trendValue && <span>{trendValue}</span>}
            </span>
          )}
          {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
