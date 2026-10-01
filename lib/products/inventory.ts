/**
 * ============================================================
 * AURELLE — INVENTORY & COMBO AVAILABILITY UTILITIES
 * Authoritative stock extraction and component-derived availability
 * ============================================================
 */

/**
 * Safely extracts numeric stock quantity from a product's inventory relation.
 * Handles:
 * - 1-element arrays: [{ stock_quantity: 10, stock_status: 'in_stock' }]
 * - Object: { stock_quantity: 10, stock_status: 'in_stock' }
 * - Direct number or fallback
 */
export function getProductStockQuantity(inventory: unknown): number {
  if (!inventory) return 0;
  if (Array.isArray(inventory)) {
    if (inventory.length === 0) return 0;
    const first = inventory[0];
    if (typeof first === "object" && first !== null && "stock_quantity" in first) {
      const num = Number(first.stock_quantity);
      return isNaN(num) ? 0 : Math.max(0, num);
    }
    return 0;
  }
  if (typeof inventory === "object" && inventory !== null && "stock_quantity" in inventory) {
    const num = Number((inventory as Record<string, unknown>).stock_quantity);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
  return 0;
}

/**
 * Safely extracts stock status string from a product's inventory relation.
 */
export function getProductStockStatus(
  inventory: unknown,
  fallbackQuantity?: number
): "in_stock" | "out_of_stock" | "low_stock" {
  let status: string | undefined;
  if (Array.isArray(inventory) && inventory.length > 0) {
    status = inventory[0]?.stock_status;
  } else if (typeof inventory === "object" && inventory !== null) {
    status = (inventory as Record<string, unknown>).stock_status as string | undefined;
  }

  if (status === "out_of_stock" || status === "in_stock" || status === "low_stock") {
    return status;
  }

  const qty = fallbackQuantity !== undefined ? fallbackQuantity : getProductStockQuantity(inventory);
  return qty > 0 ? "in_stock" : "out_of_stock";
}

export interface ComponentStockSummary {
  product_id: string;
  name: string;
  sku?: string;
  required_quantity: number;
  available_quantity: number;
  max_combos: number;
  in_stock: boolean;
  status?: string;
  is_published?: boolean;
}

export interface ComboStockCalculation {
  in_stock: boolean;
  available_stock: number;
  components: ComponentStockSummary[];
}

/**
 * Authoritatively calculates combo availability from its component products.
 *
 * Formula:
 * For each component:
 *   available_combos_for_component = floor(component_available_stock / component_required_quantity)
 *
 * combo_available_stock = min(available_combos_for_component_1, available_combos_for_component_2, ...)
 *
 * If ANY required component has 0 available or stock < required_quantity:
 *   combo is out of stock (available_stock = 0, in_stock = false).
 */
export function calculateComboAvailability(
  items: Array<{
    quantity: number;
    product_id?: string;
    product?: {
      id?: string;
      name?: string;
      sku?: string;
      status?: string;
      is_published?: boolean;
      inventory?: unknown;
    } | null;
  }>
): ComboStockCalculation {
  if (!items || items.length === 0) {
    return { in_stock: false, available_stock: 0, components: [] };
  }

  const componentsSummary: ComponentStockSummary[] = [];
  let minCombos = Number.MAX_SAFE_INTEGER;
  let allComponentsInStock = true;

  for (const item of items) {
    const prod = item.product;
    const requiredQty = Math.max(1, Number(item.quantity) || 1);
    const stockQty = getProductStockQuantity(prod?.inventory);

    // Published status check: if status is specified, must be published / is_published true
    const isListed =
      prod === null || prod === undefined
        ? false
        : (prod.status === undefined || prod.status === "published") &&
          (prod.is_published === undefined || prod.is_published === true);

    const maxCombosForThisItem = isListed ? Math.floor(stockQty / requiredQty) : 0;
    const hasEnoughStock = isListed && stockQty >= requiredQty;

    if (!hasEnoughStock) {
      allComponentsInStock = false;
    }

    if (maxCombosForThisItem < minCombos) {
      minCombos = maxCombosForThisItem;
    }

    componentsSummary.push({
      product_id: item.product_id || prod?.id || "",
      name: prod?.name || "Product",
      sku: prod?.sku,
      required_quantity: requiredQty,
      available_quantity: stockQty,
      max_combos: maxCombosForThisItem,
      in_stock: hasEnoughStock,
      status: prod?.status,
      is_published: prod?.is_published,
    });
  }

  const finalAvailable = minCombos === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, minCombos);
  const isInStock = allComponentsInStock && finalAvailable > 0;

  return {
    in_stock: isInStock,
    available_stock: finalAvailable,
    components: componentsSummary,
  };
}
