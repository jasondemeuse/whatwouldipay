export const usd = (n: number, opts: { sign?: boolean; decimals?: number } = {}) => {
  const { sign = false, decimals = 0 } = opts
  const abs = Math.abs(n)
  const s = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  if (n < 0) return `−${s}`
  if (sign && n > 0) return `+${s}`
  return s
}

export const pct = (n: number, decimals = 1) => `${(n * 100).toFixed(decimals)}%`
