const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    // Create transporter with SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send invoice email with PDF attachment
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email
   * @param {string} params.employerName - Employer name
   * @param {Object} params.invoice - Invoice object
   * @param {string} params.pdfPath - Path to PDF file
   * @returns {Promise<Object>} - Email send result
   */
  async sendInvoiceEmail({ to, employerName, invoice, pdfPath }) {
    try {
      const absolutePdfPath = path.join(__dirname, '..', pdfPath);

      // Check if PDF exists
      if (!fs.existsSync(absolutePdfPath)) {
        throw new Error(`PDF file not found: ${absolutePdfPath}`);
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@shramikseva.com',
        to,
        subject: `Invoice ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME || 'Shramik Seva'}`,
        html: this.getInvoiceEmailTemplate(employerName, invoice),
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            path: absolutePdfPath,
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Invoice email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  /**
   * Get HTML email template for invoice
   * @param {string} employerName - Employer name
   * @param {Object} invoice - Invoice object
   * @returns {string} - HTML email template
   */
  getInvoiceEmailTemplate(employerName, invoice) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .invoice-details {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #4F46E5;
          }
          .invoice-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .invoice-details td {
            padding: 8px 0;
          }
          .invoice-details td:first-child {
            font-weight: bold;
            width: 40%;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.COMPANY_NAME || 'Shramik Seva'}</h1>
            <p>Invoice Notification</p>
          </div>
          <div class="content">
            <h2>Hello ${employerName},</h2>
            <p>Thank you for your subscription! Your invoice is ready.</p>
            
            <div class="invoice-details">
              <table>
                <tr>
                  <td>Invoice Number:</td>
                  <td>${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td>Invoice Date:</td>
                  <td>${new Date(invoice.issueDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td>Due Date:</td>
                  <td>${new Date(invoice.dueDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td>Amount:</td>
                  <td><strong>₹${invoice.totalAmount.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td>Status:</td>
                  <td><span style="color: ${invoice.status === 'paid' ? 'green' : 'orange'};">${invoice.status.toUpperCase()}</span></td>
                </tr>
              </table>
            </div>

            <p>Your invoice is attached to this email as a PDF file. You can also view and download it from your dashboard.</p>
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <div class="footer">
              <p>${process.env.COMPANY_NAME || 'Shramik Seva'}</p>
              <p>${process.env.COMPANY_ADDRESS || 'Your Company Address'}</p>
              <p>Email: ${process.env.SMTP_FROM || 'info@shramikseva.com'}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send payment reminder email for an overdue/pending invoice
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.employerName - Employer name
   * @param {Object} params.invoice - Invoice object
   */
  async sendPaymentReminderEmail({ to, employerName, invoice }) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@shramikseva.com',
      to,
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME || 'Shramik Seva'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;color:#333;line-height:1.6;">
          <div style="max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#dc2626;color:white;padding:20px;border-radius:5px 5px 0 0;text-align:center;">
              <h1 style="margin:0;">${process.env.COMPANY_NAME || 'Shramik Seva'}</h1>
              <p style="margin:4px 0 0;">Payment Reminder</p>
            </div>
            <div style="background:#f9f9f9;padding:30px;border-radius:0 0 5px 5px;">
              <h2>Hello ${employerName},</h2>
              <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> is pending payment.</p>
              <div style="background:white;padding:20px;border-radius:5px;border-left:4px solid #dc2626;margin:20px 0;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="font-weight:bold;width:40%;padding:6px 0;">Invoice Number:</td><td>${invoice.invoiceNumber}</td></tr>
                  <tr><td style="font-weight:bold;padding:6px 0;">Amount Due:</td><td><strong>₹${invoice.totalAmount.toFixed(2)}</strong></td></tr>
                  <tr><td style="font-weight:bold;padding:6px 0;">Due Date:</td><td>${new Date(invoice.dueDate).toLocaleDateString()}</td></tr>
                  <tr><td style="font-weight:bold;padding:6px 0;">Status:</td><td style="color:#dc2626;font-weight:bold;">${invoice.status.toUpperCase()}</td></tr>
                </table>
              </div>
              <p>Please make the payment at your earliest convenience to continue enjoying uninterrupted service.</p>
              <p>If you have already made the payment, please disregard this email.</p>
              <div style="text-align:center;margin-top:30px;font-size:12px;color:#666;border-top:1px solid #ddd;padding-top:20px;">
                <p>${process.env.COMPANY_NAME || 'Shramik Seva'}</p>
                <p>Email: ${process.env.SMTP_FROM || 'info@shramikseva.com'}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);
    return info;
  }

  /**
   * Verify SMTP connection

   * @returns {Promise<boolean>} - Connection status
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
