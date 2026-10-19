export function areaForSize(size: string): number
export function shippingForArea(area: number): number
export function shippingForLines(lines: readonly {size: string}[]): number
export function shippingAllocation(lines: readonly {size: string}[]): number[]
