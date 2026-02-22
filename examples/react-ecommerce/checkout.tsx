import React, { useState, useEffect } from 'react';
import { useCrashSense, useRenderTracker } from '@crashsense/react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function Checkout() {
  const { captureException, addBreadcrumb, core } = useCrashSense();
  useRenderTracker('Checkout');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      core?.setUser({ id: user.id, plan: user.plan });
    }
  }, [core]);

  useEffect(() => {
    core?.setContext('cart', {
      itemCount: cart.length,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });
  }, [cart, core]);

  async function handleCheckout() {
    addBreadcrumb({
      type: 'click',
      message: 'User clicked checkout',
      data: { itemCount: cart.length },
    });

    setLoading(true);

    try {
      addBreadcrumb({ type: 'network', message: 'Initiating payment request' });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });

      if (!response.ok) {
        throw new Error(
          'Checkout failed: ' + response.status + ' ' + response.statusText,
        );
      }

      const result = await response.json();

      addBreadcrumb({
        type: 'navigation',
        message: 'Payment successful, redirecting to order ' + result.orderId,
      });

      window.location.href = '/orders/' + result.orderId;
    } catch (error) {
      captureException(error, {
        action: 'checkout',
        cartSize: String(cart.length),
        cartTotal: String(
          cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        ),
      });

      addBreadcrumb({
        type: 'custom',
        message: 'Checkout failed, showing error to user',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Checkout</h1>
      {cart.map((item) => (
        <div key={item.id}>
          {item.name} x{item.quantity} -- ${item.price * item.quantity}
        </div>
      ))}
      <button onClick={handleCheckout} disabled={loading || cart.length === 0}>
        {loading ? 'Processing...' : 'Complete Purchase'}
      </button>
    </div>
  );
}
