import { useSettings } from '../contexts/SettingsContext'

interface PriceDisplayProps {
  price: number
  precision?: number
  unit?: string
  className?: string
  showTaxBreakdown?: boolean
}

export default function PriceDisplay({ 
  price, 
  precision = 4, 
  unit, 
  className = '',
  showTaxBreakdown = false 
}: PriceDisplayProps) {
  const { calculatePriceWithTax, salesTaxEnabled, salesTaxRate } = useSettings()
  
  const finalPrice = calculatePriceWithTax(price)
  const taxAmount = finalPrice - price

  return (
    <div className={className}>
      <span className="font-medium">
        ${finalPrice.toFixed(precision)}
        {unit && ` / ${unit}`}
      </span>
      {showTaxBreakdown && salesTaxEnabled && salesTaxRate > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Pre-tax: ${price.toFixed(precision)} + Tax: ${taxAmount.toFixed(precision)} ({(salesTaxRate * 100).toFixed(2)}%)
        </div>
      )}
    </div>
  )
}

// Helper component for inline price display without breakdown
export function InlinePrice({ price, precision = 4, unit }: Omit<PriceDisplayProps, 'className' | 'showTaxBreakdown'>) {
  const { calculatePriceWithTax } = useSettings()
  const finalPrice = calculatePriceWithTax(price)
  
  return (
    <>
      ${finalPrice.toFixed(precision)}
      {unit && ` / ${unit}`}
    </>
  )
}
