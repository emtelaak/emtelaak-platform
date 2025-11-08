import type { Invoice, Property, User } from "../drizzle/schema";

export interface InvoiceData {
  invoice: Invoice;
  user?: User;
  property?: Property;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { invoice, user, property } = data;
  
  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid #0f172a;
    }
    
    .company-info h1 {
      font-size: 32px;
      color: #0f172a;
      margin-bottom: 5px;
    }
    
    .company-info p {
      color: #64748b;
      font-size: 14px;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-meta h2 {
      font-size: 28px;
      color: #0f172a;
      margin-bottom: 10px;
    }
    
    .invoice-meta p {
      color: #64748b;
      font-size: 14px;
      margin: 5px 0;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .status-expired {
      background: #f3f4f6;
      color: #374151;
    }
    
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .party h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    
    .party p {
      color: #0f172a;
      font-size: 15px;
      margin: 5px 0;
    }
    
    .invoice-details {
      margin-bottom: 40px;
    }
    
    .invoice-details h3 {
      font-size: 18px;
      color: #0f172a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
    }
    
    .detail-label {
      color: #64748b;
      font-size: 14px;
    }
    
    .detail-value {
      color: #0f172a;
      font-weight: 600;
      font-size: 14px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table thead {
      background: #0f172a;
      color: white;
    }
    
    .items-table th {
      padding: 15px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 15px;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .text-right {
      text-align: right;
    }
    
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 15px;
    }
    
    .total-row.grand-total {
      border-top: 3px solid #0f172a;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .notes {
      margin-top: 40px;
      padding: 20px;
      background: #f8fafc;
      border-left: 4px solid #0f172a;
      border-radius: 4px;
    }
    
    .notes h4 {
      font-size: 14px;
      color: #0f172a;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .notes p {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>Emtelaak</h1>
        <p>Property Fractional Investment Platform</p>
        <p>www.emtelaak.com</p>
      </div>
      <div class="invoice-meta">
        <h2>PROFORMA INVOICE</h2>
        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
      </div>
    </div>
    
    <div class="parties">
      <div class="party">
        <h3>Bill To</h3>
        <p><strong>${user?.name || 'N/A'}</strong></p>
        <p>${user?.email || 'N/A'}</p>
      </div>
      <div class="party">
        <h3>From</h3>
        <p><strong>Emtelaak Platform</strong></p>
        <p>Property Investment Services</p>
        <p>support@emtelaak.com</p>
      </div>
    </div>
    
    <div class="invoice-details">
      <h3>Investment Details</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Property</span>
          <span class="detail-value">${property?.name || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Property Type</span>
          <span class="detail-value">${property?.propertyType || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Investment Type</span>
          <span class="detail-value">${property?.investmentType || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${property?.city || 'N/A'}, ${property?.country || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Shares</th>
          <th class="text-right">Price per Share</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Property Investment Shares</strong><br>
            <small style="color: #64748b;">${property?.name || 'Investment'}</small>
          </td>
          <td class="text-right">${invoice.shares.toLocaleString()}</td>
          <td class="text-right">${formatCurrency(invoice.sharePrice)}</td>
          <td class="text-right"><strong>${formatCurrency(invoice.amount)}</strong></td>
        </tr>
      </tbody>
    </table>
    
    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(invoice.amount)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Amount:</span>
        <span>${formatCurrency(invoice.amount)} ${invoice.currency}</span>
      </div>
    </div>
    
    ${invoice.notes ? `
    <div class="notes">
      <h4>Notes</h4>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}
    
    <div class="notes">
      <h4>Payment Instructions</h4>
      <p>
        Please complete the payment within the due date to confirm your investment. 
        You can pay through your wallet or via bank transfer. Once payment is received, 
        your investment will be confirmed and shares will be allocated to your portfolio.
      </p>
    </div>
    
    <div class="footer">
      <p>Thank you for investing with Emtelaak</p>
      <p>For questions about this invoice, please contact support@emtelaak.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
