// Integration placeholders: no alert controls, original catalog price retained.
import type { ShoppingProduct } from '../../data/shopping-catalog';
export function PriceAlertsBell() { return null; }
export function PriceAlertsLayer() { return null; }
export function PriceDropTrigger(_props: { product: ShoppingProduct; themeBrandId?: string }) { return null; }
export function AlertProductPrice({ product }: { product: ShoppingProduct }) { return <>{product.price}</>; }
