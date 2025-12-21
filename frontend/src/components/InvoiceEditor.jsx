import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DOCUMENT_TYPES = [
  "Invoice", "Tax Invoice", "Proforma Invoice", "Receipt", 
  "Sales Receipt", "Cash Receipt", "Quote", "Credit Memo",
  "Credit Note", "Purchase Order", "Delivery Note"
];

export default function InvoiceEditor({ invoice, onClose, onSaved }) {
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    document_type: "Invoice",
    customer_name: "",
    customer_address: "",
    customer_email: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    tax_rate: 0,
    notes: "",
    status: "unpaid",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }]
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        document_type: invoice.document_type || "Invoice",
        customer_name: invoice.customer_name || "",
        customer_address: invoice.customer_address || "",
        customer_email: invoice.customer_email || "",
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || "",
        tax_rate: invoice.tax_rate || 0,
        notes: invoice.notes || "",
        status: invoice.status || "unpaid",
        items: invoice.items || [{ description: "", quantity: 1, rate: 0, amount: 0 }]
      });
    }
  }, [invoice]);

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0);
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (formData.items.some(item => !item.description.trim())) {
      toast.error("All items must have a description");
      return;
    }

    setSaving(true);

    try {
      const url = invoice 
        ? `${BACKEND_URL}/api/invoices/${invoice.invoice_id}`
        : `${BACKEND_URL}/api/invoices`;
      
      const method = invoice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save invoice');
      }

      toast.success(invoice ? "Invoice updated!" : "Invoice created!");
      onSaved();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white rounded-t-2xl border-b">
          <h2 className="font-space-mono text-xl font-bold text-slate-900">
            {invoice ? `Edit ${invoice.document_type}` : 'Create New Document'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="close-editor-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper-like Invoice Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl paper-shadow p-8">
              {/* Document Type & Company Info */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <Select 
                    value={formData.document_type} 
                    onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                  >
                    <SelectTrigger className="w-[200px] font-space-mono text-lg font-bold text-[#0066cc] border-0 p-0 h-auto" data-testid="document-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500 mt-2">Realtouch Global Ventures Ltd</p>
                  <p className="text-sm text-slate-500">Company No. 16578193</p>
                </div>
                <div className="text-right">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Invoice Date</label>
                      <Input 
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                        className="w-40 text-right font-mono text-sm"
                        data-testid="invoice-date-input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Due Date</label>
                      <Input 
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-40 text-right font-mono text-sm"
                        data-testid="due-date-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Bill To</label>
                  <Input 
                    placeholder="Customer Name *"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="mb-2"
                    data-testid="customer-name-input"
                  />
                  <Textarea 
                    placeholder="Customer Address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    rows={2}
                    className="mb-2"
                    data-testid="customer-address-input"
                  />
                  <Input 
                    type="email"
                    placeholder="Customer Email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    data-testid="customer-email-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 block mb-3">Line Items</label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Description</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 w-24">Qty</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 w-32">Rate (£)</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 w-32">Amount</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">
                            <Input 
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              className="border-0 p-0 h-auto focus:ring-0"
                              data-testid={`item-description-${index}`}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input 
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              className="border-0 p-0 h-auto text-right font-mono focus:ring-0"
                              data-testid={`item-quantity-${index}`}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                              className="border-0 p-0 h-auto text-right font-mono focus:ring-0"
                              data-testid={`item-rate-${index}`}
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-slate-900">
                            £{item.amount.toFixed(2)}
                          </td>
                          <td className="px-2 py-2">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-1 text-slate-400 hover:text-red-500"
                                data-testid={`remove-item-${index}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="mt-3"
                  data-testid="add-item-btn"
                >
                  <Plus size={16} className="mr-1" />
                  Add Item
                </Button>
              </div>

              {/* Tax Rate & Totals */}
              <div className="flex justify-between items-start">
                <div className="w-64">
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Tax Rate (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-24 font-mono"
                      data-testid="tax-rate-input"
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter tax rate (e.g., 20 for 20% VAT, or 0 for no tax)
                  </p>
                </div>

                <div className="w-64 space-y-2 text-right">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-mono">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax ({formData.tax_rate}%)</span>
                    <span className="font-mono">£{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="font-mono text-[#0066cc]">£{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-8">
                <label className="text-sm font-medium text-slate-700 block mb-2">Notes</label>
                <Textarea 
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="notes-input"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#0066cc] hover:bg-[#0052a3] text-white"
                disabled={loading}
                data-testid="save-invoice-btn"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Saving...
                  </>
                ) : (
                  invoice ? 'Update Invoice' : 'Save Invoice'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
