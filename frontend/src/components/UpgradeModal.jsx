import { useState } from "react";
import { X, Check, CreditCard, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function UpgradeModal({ onClose, user, downloadsUsed }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  const plans = [
    {
      id: "professional",
      name: "Professional",
      price: "£8.99",
      period: "/month",
      features: [
        "Unlimited downloads",
        "All document types",
        "Payment integration",
        "Custom branding",
        "Priority support"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "£59.99",
      period: "/month",
      features: [
        "Everything in Professional",
        "Multi-user access",
        "API access",
        "Advanced analytics",
        "Dedicated account manager"
      ]
    }
  ];

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const originUrl = window.location.origin;

      const response = await fetch(`${BACKEND_URL}/api/payments/stripe/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: selectedPlan,
          origin_url: originUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-space-mono text-xl font-bold text-slate-900">Download Limit Reached</h2>
              <p className="text-sm text-slate-500">You've used all {downloadsUsed} free downloads</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="close-upgrade-modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> The free download limit is <strong>permanent</strong>, not monthly. 
              Upgrade to continue downloading unlimited invoices.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">What you'll get:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-slate-600">
                <Check className="w-5 h-5 text-emerald-500" />
                Unlimited downloads (PDF & JPEG)
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Check className="w-5 h-5 text-emerald-500" />
                Payment integration (Stripe, PayPal)
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Check className="w-5 h-5 text-emerald-500" />
                Custom branding
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Check className="w-5 h-5 text-emerald-500" />
                Priority support
              </li>
            </ul>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Select Payment Method:</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "stripe" 
                    ? "border-[#0066cc] bg-blue-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                data-testid="payment-method-stripe"
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2 text-[#0066cc]" />
                <p className="text-sm font-medium">Credit Card</p>
                <p className="text-xs text-slate-500">via Stripe</p>
              </button>
              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "paypal" 
                    ? "border-[#0066cc] bg-blue-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                disabled
                data-testid="payment-method-paypal"
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-[#003087] rounded text-white text-xs flex items-center justify-center font-bold">P</div>
                <p className="text-sm font-medium text-slate-400">PayPal</p>
                <p className="text-xs text-slate-400">Coming soon</p>
              </button>
              <button
                onClick={() => setPaymentMethod("gpay")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "gpay" 
                    ? "border-[#0066cc] bg-blue-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                disabled
                data-testid="payment-method-gpay"
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-white rounded border text-xs flex items-center justify-center font-bold">G</div>
                <p className="text-sm font-medium text-slate-400">Google Pay</p>
                <p className="text-xs text-slate-400">Coming soon</p>
              </button>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.id 
                    ? "border-[#0066cc] bg-blue-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                data-testid={`plan-${plan.id}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-space-mono font-bold text-slate-900">{plan.name}</h4>
                  {selectedPlan === plan.id && (
                    <div className="w-6 h-6 bg-[#0066cc] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <span className="font-space-mono text-2xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* CTA */}
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white py-6 text-lg"
            disabled={loading}
            data-testid="upgrade-now-btn"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Processing...
              </>
            ) : (
              <>
                Upgrade to {selectedPlan === "professional" ? "Professional" : "Enterprise"}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
            <Lock className="w-4 h-4" />
            <span>Secure payment · Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
