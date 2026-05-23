export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

let scriptLoadingPromise: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    // If already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      scriptLoadingPromise = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

export const openRazorpayCheckout = async (options: RazorpayOptions): Promise<void> => {
  if (options.key === 'mock_key') {
    // Simulate Razorpay UI delay
    setTimeout(() => {
      options.handler({
        razorpay_order_id: options.order_id,
        razorpay_payment_id: `mock_payment_${Date.now()}`,
        razorpay_signature: 'mock_signature_valid'
      });
    }, 1500);
    return;
  }

  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay script. Please check your internet connection.');
  }

  const razorpay = new (window as any).Razorpay(options);
  
  razorpay.on('payment.failed', function (response: any) {
    console.error('Payment Failed:', response.error);
    // Let the caller handle failure via their own mechanisms, or add an explicit failure callback
  });

  razorpay.open();
};
