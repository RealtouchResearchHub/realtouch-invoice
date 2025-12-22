import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Redirect to Emergent Auth but user sees Realtouch branding
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute font-mono text-[80px] font-bold text-slate-900 select-none"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              £
            </div>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-[#0066cc] to-[#0052a3] p-8 text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_77cf16cd-eadc-4d0e-b24f-9448ffa83e9e/artifacts/8fhvo7zu_image.png"
              alt="Realtouch Invoice"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="font-space-mono text-2xl font-bold text-white">
              Realtouch Invoice
            </h1>
            <p className="text-blue-100 text-sm mt-2">
              Professional Invoicing, Simplified Globally
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-500 text-sm">
                Sign in to access your invoicing dashboard
              </p>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              data-testid="login-btn"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"></span>
                  Connecting...
                </>
              ) : (
                'Sign In with Google'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400">Secure Authentication</span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>No password required</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Your data is encrypted and secure</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>5 free downloads to start</span>
              </div>
            </div>

            {/* Back Link */}
            <button 
              onClick={handleBack}
              className="w-full mt-6 flex items-center justify-center gap-2 text-slate-500 hover:text-[#0066cc] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to homepage
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs">
            Realtouch Global Ventures Ltd • Company No. 16578193
          </p>
          <p className="text-slate-400 text-xs mt-1">
            © 2025 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
