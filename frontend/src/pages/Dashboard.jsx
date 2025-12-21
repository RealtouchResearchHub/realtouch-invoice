import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FileText, Users, BarChart3, Settings, LogOut, Plus, Search,
  Download, Edit, Trash2, Eye, ChevronDown, X, AlertCircle,
  DollarSign, Clock, TrendingUp, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import InvoiceEditor from "@/components/InvoiceEditor";
import CustomerManager from "@/components/CustomerManager";
import UpgradeModal from "@/components/UpgradeModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DOCUMENT_TYPES = [
  "Invoice", "Tax Invoice", "Proforma Invoice", "Receipt", 
  "Sales Receipt", "Cash Receipt", "Quote", "Credit Memo",
  "Credit Note", "Purchase Order", "Delivery Note"
];

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Modals
  const [showEditor, setShowEditor] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchInvoices();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const fetchInvoices = async () => {
    try {
      let url = `${BACKEND_URL}/api/invoices`;
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("document_type", typeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    navigate('/');
  };

  const handleDownload = async (invoice) => {
    // Check download limit before attempting
    if (user?.plan === "starter" && (stats?.downloads_used || 0) >= 5) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/invoices/${invoice.invoice_id}/download?format=pdf`,
        { credentials: 'include' }
      );

      if (response.status === 403) {
        const error = await response.json();
        if (error.detail?.requires_upgrade) {
          setShowUpgradeModal(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // Refresh stats to update download count
      fetchStats();
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success("Invoice deleted");
        fetchInvoices();
        fetchStats();
        setShowDeleteConfirm(null);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleInvoiceSaved = () => {
    setShowEditor(false);
    setEditingInvoice(null);
    fetchInvoices();
    fetchStats();
  };

  // Filter invoices by search query
  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate download progress
  const downloadProgress = stats?.downloads_limit === -1 
    ? 0 
    : ((stats?.downloads_used || 0) / 5) * 100;
  
  const downloadProgressColor = downloadProgress >= 100 
    ? "danger" 
    : downloadProgress >= 80 
      ? "warning" 
      : "normal";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]" data-testid="dashboard">
      {/* Sidebar */}
      <aside className="w-64 sidebar text-white flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <img 
            src="https://customer-assets.emergentagent.com/job_77cf16cd-eadc-4d0e-b24f-9448ffa83e9e/artifacts/8fhvo7zu_image.png"
            alt="Realtouch Invoice"
            className="h-10 w-auto brightness-0 invert"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "invoices" 
                ? "bg-[#0066cc] text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            data-testid="nav-invoices-btn"
          >
            <FileText size={20} />
            <span>Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "customers" 
                ? "bg-[#0066cc] text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            data-testid="nav-customers-btn"
          >
            <Users size={20} />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "reports" 
                ? "bg-[#0066cc] text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            data-testid="nav-reports-btn"
          >
            <BarChart3 size={20} />
            <span>Reports</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "settings" 
                ? "bg-[#0066cc] text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            data-testid="nav-settings-btn"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Download Limit (for Starter plan) */}
        {user?.plan === "starter" && (
          <div className="p-4 mx-4 mb-4 bg-slate-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Downloads Used</span>
              <span className="font-mono text-sm text-white">{stats?.downloads_used || 0}/5</span>
            </div>
            <div className="download-progress mb-2">
              <div 
                className={`download-progress-bar ${downloadProgressColor}`}
                style={{ width: `${Math.min(downloadProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {5 - (stats?.downloads_used || 0)} downloads left<br/>
              <span className="text-amber-400">(total, not monthly)</span>
            </p>
            {downloadProgress >= 100 && (
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white text-sm"
                size="sm"
                data-testid="sidebar-upgrade-btn"
              >
                Upgrade Now
              </Button>
            )}
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0066cc] flex items-center justify-center font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-1 rounded-full ${
              user?.plan === "starter" 
                ? "bg-slate-700 text-slate-300" 
                : "bg-[#0066cc] text-white"
            }`}>
              {user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1)} Plan
            </span>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-white flex items-center gap-1"
              data-testid="logout-btn"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {activeTab === "invoices" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm">Total Revenue</span>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="font-space-mono text-2xl font-bold text-slate-900">
                  £{(stats?.total_revenue || 0).toFixed(2)}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm">Unpaid</span>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="font-space-mono text-2xl font-bold text-slate-900">
                  £{(stats?.total_unpaid || 0).toFixed(2)}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm">Downloads Left</span>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="font-space-mono text-2xl font-bold text-slate-900">
                  {stats?.downloads_limit === -1 
                    ? "Unlimited" 
                    : `${Math.max(0, 5 - (stats?.downloads_used || 0))}`}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm">This Month</span>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="font-space-mono text-2xl font-bold text-slate-900">
                  £{(stats?.this_month_revenue || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-invoices-input"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="type-filter">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={() => { setEditingInvoice(null); setShowEditor(true); }}
                className="bg-[#0066cc] hover:bg-[#0052a3] text-white"
                data-testid="create-invoice-btn"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Invoice
              </Button>
            </div>

            {/* Invoices Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-striped">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Invoice #</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Customer</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Total</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Tax</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <div className="animate-spin h-8 w-8 border-4 border-[#0066cc] border-t-transparent rounded-full mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          No invoices found. Create your first invoice!
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono text-sm text-[#0066cc]">
                            {invoice.invoice_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {invoice.customer_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {invoice.document_type}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {invoice.invoice_date}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-right text-slate-900">
                            £{invoice.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-center text-slate-600">
                            {invoice.tax_rate}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-mono uppercase ${
                              invoice.status === "paid" 
                                ? "badge-paid" 
                                : invoice.status === "overdue"
                                  ? "badge-overdue"
                                  : "badge-pending"
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingInvoice(invoice)}
                                className="p-2 text-slate-400 hover:text-[#0066cc] transition-colors"
                                title="View"
                                data-testid={`view-invoice-${invoice.invoice_id}`}
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => { setEditingInvoice(invoice); setShowEditor(true); }}
                                className="p-2 text-slate-400 hover:text-[#0066cc] transition-colors"
                                title="Edit"
                                data-testid={`edit-invoice-${invoice.invoice_id}`}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDownload(invoice)}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Download"
                                data-testid={`download-invoice-${invoice.invoice_id}`}
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(invoice)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete"
                                data-testid={`delete-invoice-${invoice.invoice_id}`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "customers" && (
          <CustomerManager />
        )}

        {activeTab === "reports" && (
          <div className="card p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Reports Coming Soon</h2>
            <p className="text-slate-500">Advanced analytics and reporting features will be available soon.</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <h2 className="font-space-mono text-2xl font-bold text-slate-900 mb-6">Settings</h2>
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-slate-900 mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <Input value={user?.name || ''} disabled className="bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input value={user?.email || ''} disabled className="bg-slate-50" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Subscription</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {user?.plan === "starter" ? "Starter Plan" : 
                     user?.plan === "professional" ? "Professional Plan" : "Enterprise Plan"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {user?.plan === "starter" 
                      ? "5 downloads total (permanent limit)" 
                      : "Unlimited downloads"}
                  </p>
                </div>
                {user?.plan === "starter" && (
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-[#0066cc] hover:bg-[#0052a3] text-white"
                    data-testid="settings-upgrade-btn"
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invoice Editor Modal */}
      {showEditor && (
        <InvoiceEditor 
          invoice={editingInvoice}
          onClose={() => { setShowEditor(false); setEditingInvoice(null); }}
          onSaved={handleInvoiceSaved}
        />
      )}

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-space-mono">
                {viewingInvoice.document_type} - {viewingInvoice.invoice_number}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-medium">{viewingInvoice.customer_name}</p>
                  {viewingInvoice.customer_address && (
                    <p className="text-sm text-slate-600">{viewingInvoice.customer_address}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium">{viewingInvoice.invoice_date}</p>
                  {viewingInvoice.due_date && (
                    <p className="text-sm text-slate-500">Due: {viewingInvoice.due_date}</p>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm">Description</th>
                      <th className="text-right px-4 py-2 text-sm">Qty</th>
                      <th className="text-right px-4 py-2 text-sm">Rate</th>
                      <th className="text-right px-4 py-2 text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right font-mono">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-mono">£{item.rate.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono">£{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-mono">£{viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax ({viewingInvoice.tax_rate}%)</span>
                    <span className="font-mono">£{viewingInvoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span className="font-mono text-[#0066cc]">£{viewingInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-600">{viewingInvoice.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                Close
              </Button>
              <Button 
                onClick={() => handleDownload(viewingInvoice)}
                className="bg-[#0066cc] hover:bg-[#0052a3] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Are you sure you want to delete invoice <span className="font-mono font-medium">{showDeleteConfirm.invoice_number}</span>? 
              This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDeleteInvoice(showDeleteConfirm.invoice_id)}
                data-testid="confirm-delete-btn"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal 
          onClose={() => setShowUpgradeModal(false)} 
          user={user}
          downloadsUsed={stats?.downloads_used || 0}
        />
      )}
    </div>
  );
}
