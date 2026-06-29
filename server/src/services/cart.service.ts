import { Cart, ICartItem } from '../models/cart.model';
import { MenuItem } from '../models/menuItem.model';
import { CustomerSession } from '../models/customerSession.model';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Cart lives for 4 hours (same as session)
const CART_TTL_MS = 4 * 60 * 60 * 1000;

export interface AddToCartInput {
  menuItemId: string;
  quantity: number;
  variantName?: string;
  addons?: { name: string; price: number }[];
  notes?: string;
}

function calcItemSubtotal(price: number, quantity: number, addons: { price: number }[]): number {
  const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
  return parseFloat(((price + addonsTotal) * quantity).toFixed(2));
}

export class CartService {
  /** Get or create cart for a session */
  async getCart(sessionId: string) {
    const session = await CustomerSession.findOne({ sessionId, isActive: true });
    if (!session) throw new NotFoundError('Session not found or expired');

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({
        sessionId,
        restaurantId: session.restaurantId,
        tableId: session.tableId,
        tableNumber: session.tableNumber,
        items: [],
        totalItems: 0,
        subtotal: 0,
        expiresAt: new Date(Date.now() + CART_TTL_MS),
      });
    }
    return cart;
  }

  /** Add item to cart (or increment qty if same item+variant+addons) */
  async addItem(sessionId: string, input: AddToCartInput) {
    const session = await CustomerSession.findOne({ sessionId, isActive: true });
    if (!session) throw new NotFoundError('Session not found');

    const menuItem = await MenuItem.findOne({
      _id: input.menuItemId,
      restaurantId: session.restaurantId,
      isAvailable: true,
    });
    if (!menuItem) throw new NotFoundError('Menu item not found or unavailable');
    if (menuItem.isOutOfStock) throw new BadRequestError(`${menuItem.name} is currently out of stock`);

    // Resolve effective price
    let effectivePrice = menuItem.discountPrice ?? menuItem.price;
    if (input.variantName) {
      const variant = menuItem.variants.find(v => v.name === input.variantName && v.isAvailable);
      if (!variant) throw new BadRequestError('Selected variant is not available');
      effectivePrice = variant.discountPrice ?? variant.price;
    }

    // Validate addons
    const validatedAddons: { name: string; price: number }[] = [];
    if (input.addons?.length) {
      for (const reqAddon of input.addons) {
        const addonDef = menuItem.addons.find(a => a.name === reqAddon.name && a.isAvailable);
        if (!addonDef) throw new BadRequestError(`Addon "${reqAddon.name}" is not available`);
        validatedAddons.push({ name: addonDef.name, price: addonDef.price });
      }
    }

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({
        sessionId,
        restaurantId: session.restaurantId,
        tableId: session.tableId,
        tableNumber: session.tableNumber,
        items: [],
        totalItems: 0,
        subtotal: 0,
        expiresAt: new Date(Date.now() + CART_TTL_MS),
      });
    }

    // Check if same item+variant already in cart
    const existingIdx = cart.items.findIndex(
      i =>
        i.menuItemId.toString() === input.menuItemId &&
        (i.variantName ?? '') === (input.variantName ?? '')
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += input.quantity;
      cart.items[existingIdx].subtotal = calcItemSubtotal(
        cart.items[existingIdx].price,
        cart.items[existingIdx].quantity,
        cart.items[existingIdx].addons
      );
      if (input.notes) cart.items[existingIdx].notes = input.notes;
    } else {
      const newItem: ICartItem = {
        menuItemId: menuItem._id as unknown as typeof cart.items[0]['menuItemId'],
        name: menuItem.name,
        price: effectivePrice,
        quantity: input.quantity,
        variantName: input.variantName,
        addons: validatedAddons,
        notes: input.notes,
        subtotal: calcItemSubtotal(effectivePrice, input.quantity, validatedAddons),
      };
      cart.items.push(newItem);
    }

    this.recalcCart(cart);
    await cart.save();
    return cart;
  }

  /** Update quantity of a specific cart item (0 = remove) */
  async updateItem(sessionId: string, cartItemId: string, quantity: number, notes?: string) {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) throw new NotFoundError('Cart not found');

    const idx = cart.items.findIndex(i => i._id?.toString() === cartItemId);
    if (idx === -1) throw new NotFoundError('Cart item not found');

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
      cart.items[idx].subtotal = calcItemSubtotal(
        cart.items[idx].price,
        quantity,
        cart.items[idx].addons
      );
      if (notes !== undefined) cart.items[idx].notes = notes;
    }

    this.recalcCart(cart);
    await cart.save();
    return cart;
  }

  /** Remove item from cart */
  async removeItem(sessionId: string, cartItemId: string) {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) throw new NotFoundError('Cart not found');

    const before = cart.items.length;
    cart.items = cart.items.filter(i => i._id?.toString() !== cartItemId) as typeof cart.items;
    if (cart.items.length === before) throw new NotFoundError('Cart item not found');

    this.recalcCart(cart);
    await cart.save();
    return cart;
  }

  /** Clear entire cart */
  async clearCart(sessionId: string) {
    const cart = await Cart.findOne({ sessionId });
    if (!cart) return { cleared: true };
    cart.items = [] as typeof cart.items;
    cart.totalItems = 0;
    cart.subtotal = 0;
    await cart.save();
    return { cleared: true };
  }

  private recalcCart(cart: { items: ICartItem[]; totalItems: number; subtotal: number }) {
    cart.totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
    cart.subtotal = parseFloat(
      cart.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2)
    );
  }
}

export const cartService = new CartService();
