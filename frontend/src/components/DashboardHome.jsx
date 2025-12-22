import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Users, BarChart3, Settings, LogOut, Plus, 
  DollarSign, AlertCircle, TrendingUp, ArrowRight, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function DashboardHome({ user, stats, invoices, onNavigate, onCreateInvoice, onAddCustomer }) {
  const navigate = useNavigate();
  
  // Get recent invoices (last 5)
  const recentInvoices = invoices?.slice(0, 5) || [];
  
  // Count overdue invoices
  const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0;
  const paidCount = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const unpaidCount = invoices?.filter(inv => inv.status !== 'paid').length || 0;

  // Calculate percentage change (mock for now)
  const revenueChange = stats?.total_revenue > 0 ? 12.5 : 0;

  return (
    <div data-testid="dashboard-home">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="font-space-mono text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            {revenueChange > 0 && (
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                {revenueChange}%
              </div>
            )}
          </div>
          <p className="font-space-mono text-3xl font-bold text-slate-900 mb-1">
            £{(stats?.total_revenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-slate-500 text-sm">Total Revenue</p>
        </div>

        {/* Total Invoices */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="font-space-mono text-3xl font-bold text-slate-900 mb-1">
            {stats?.invoice_count || 0}
          </p>
          <p className="text-slate-500 text-sm">Total Invoices</p>
          <button 
            onClick={() => onNavigate('invoices')}
            className="text-emerald-600 text-sm hover:underline mt-1"
          >
            {paidCount} paid
          </button>
        </div>

        {/* Unpaid Invoices */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="font-space-mono text-3xl font-bold text-slate-900 mb-1">
            {unpaidCount}
          </p>
          <p className="text-slate-500 text-sm">Unpaid Invoices</p>
          {overdueCount > 0 && (
            <button 
              onClick={() => onNavigate('invoices')}
              className="text-amber-600 text-sm hover:underline mt-1"
            >
              {overdueCount} overdue
            </button>
          )}
        </div>

        {/* Total Customers */}
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="font-space-mono text-3xl font-bold text-slate-900 mb-1">
            {stats?.customer_count || 0}
          </p>
          <p className="text-slate-500 text-sm">Total Customers</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Invoices - Takes 2 columns */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-space-mono text-xl font-bold text-slate-900">Recent Invoices</h2>
            <button 
              onClick={() => onNavigate('invoices')}
              className="text-[#0066cc] text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
              <Button 
                onClick={onCreateInvoice}
                className="mt-4 bg-[#0066cc] hover:bg-[#0052a3] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div 
                  key={invoice.invoice_id}
                  className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => onNavigate('invoices')}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900">
                          {invoice.invoice_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          invoice.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{invoice.customer_name}</p>
                      <p className="text-xs text-slate-400">{invoice.invoice_date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-slate-900">
                      £{invoice.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-space-mono text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                onClick={onCreateInvoice}
                className="w-full justify-start bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-[#0066cc]"
                variant="outline"
              >
                <Plus className="w-5 h-5 mr-3 text-[#0066cc]" />
                New Invoice
              </Button>
              <Button 
                onClick={onAddCustomer}
                className="w-full justify-start bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-[#0066cc]"
                variant="outline"
              >
                <Plus className="w-5 h-5 mr-3 text-[#0066cc]" />
                Add Customer
              </Button>
              <Button 
                onClick={() => onNavigate('reports')}
                className="w-full justify-start bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-[#0066cc]"
                variant="outline"
              >
                <BarChart3 className="w-5 h-5 mr-3 text-[#0066cc]" />
                View Reports
              </Button>
            </div>
          </div>

          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <div className="card p-6 bg-red-50 border-red-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Overdue Invoices</h3>
                  <p className="text-sm text-red-700 mt-1">
                    You have {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''} requiring attention.
                  </p>
                  <button 
                    onClick={() => onNavigate('invoices')}
                    className="text-red-700 text-sm font-medium hover:underline mt-2 flex items-center gap-1"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* This Month Summary */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0066cc]" />
              This Month
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Revenue</span>
                <span className="font-mono font-medium">
                  £{(stats?.this_month_revenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recurring</span>
                <span className="font-mono font-medium">{stats?.recurring_invoices || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
