const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    /**
     * Generate invoice PDF
     * @param {Object} invoice - Invoice object with all details
     * @param {Object} employer - Employer user object
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateInvoicePDF(invoice, employer) {
        return new Promise((resolve, reject) => {
            try {
                // Create uploads/invoices directory if it doesn't exist
                const invoicesDir = path.join(__dirname, '../../uploads/invoices');
                if (!fs.existsSync(invoicesDir)) {
                    fs.mkdirSync(invoicesDir, { recursive: true });
                }

                const filename = `${invoice.invoiceNumber}.pdf`;
                const filepath = path.join(invoicesDir, filename);

                // Create PDF document
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(filepath);

                doc.pipe(stream);

                // Company Header
                doc
                    .fontSize(20)
                    .font('Helvetica-Bold')
                    .text(process.env.COMPANY_NAME || 'Shramik Seva', 50, 50);

                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(process.env.COMPANY_ADDRESS || 'Your Company Address', 50, 80)
                    .text(`Email: ${process.env.SMTP_FROM || 'info@shramikseva.com'}`, 50, 95)
                    .text(`Phone: ${process.env.COMPANY_PHONE || '+91 XXXXXXXXXX'}`, 50, 110);

                if (process.env.COMPANY_GST) {
                    doc.text(`GSTIN: ${process.env.COMPANY_GST}`, 50, 125);
                }

                // Invoice Title
                doc
                    .fontSize(24)
                    .font('Helvetica-Bold')
                    .text('INVOICE', 400, 50, { align: 'right' });

                // Invoice Details (Right side)
                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
                    .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 95, { align: 'right' })
                    .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 110, { align: 'right' })
                    .text(`Status: ${invoice.status.toUpperCase()}`, 400, 125, { align: 'right' });

                // Bill To Section
                doc
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('BILL TO:', 50, 170);

                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(employer.name || 'N/A', 50, 190)
                    .text(employer.email || 'N/A', 50, 205)
                    .text(employer.phone || 'N/A', 50, 220);

                // Line separator
                doc
                    .strokeColor('#aaaaaa')
                    .lineWidth(1)
                    .moveTo(50, 260)
                    .lineTo(550, 260)
                    .stroke();

                // Table Header
                const tableTop = 280;
                doc
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Description', 50, tableTop)
                    .text('Qty', 300, tableTop, { width: 50, align: 'center' })
                    .text('Unit Price', 360, tableTop, { width: 80, align: 'right' })
                    .text('Amount', 450, tableTop, { width: 100, align: 'right' });

                // Table line
                doc
                    .strokeColor('#aaaaaa')
                    .lineWidth(1)
                    .moveTo(50, tableTop + 15)
                    .lineTo(550, tableTop + 15)
                    .stroke();

                // Table Items
                let yPosition = tableTop + 30;
                doc.font('Helvetica');

                invoice.items.forEach((item) => {
                    doc
                        .text(item.description, 50, yPosition, { width: 240 })
                        .text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'center' })
                        .text(`₹${item.unitPrice.toFixed(2)}`, 360, yPosition, { width: 80, align: 'right' })
                        .text(`₹${item.amount.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });

                    yPosition += 25;
                });

                // Subtotal, Tax, Total
                yPosition += 20;
                doc
                    .strokeColor('#aaaaaa')
                    .lineWidth(1)
                    .moveTo(350, yPosition)
                    .lineTo(550, yPosition)
                    .stroke();

                yPosition += 15;
                doc
                    .fontSize(10)
                    .text('Subtotal:', 350, yPosition)
                    .text(`₹${invoice.subtotal.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });

                if (invoice.taxAmount > 0) {
                    yPosition += 20;
                    doc
                        .text('Tax (GST):', 350, yPosition)
                        .text(`₹${invoice.taxAmount.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
                }

                yPosition += 20;
                doc
                    .strokeColor('#aaaaaa')
                    .lineWidth(1)
                    .moveTo(350, yPosition)
                    .lineTo(550, yPosition)
                    .stroke();

                yPosition += 15;
                doc
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Total:', 350, yPosition)
                    .text(`₹${invoice.totalAmount.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });

                // Footer
                const footerTop = 700;
                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text('Payment Terms: Payment is due within 30 days', 50, footerTop)
                    .text('Thank you for your business!', 50, footerTop + 20);

                doc
                    .fontSize(8)
                    .fillColor('#666666')
                    .text(
                        'This is a computer-generated invoice and does not require a signature.',
                        50,
                        footerTop + 50,
                        { align: 'center', width: 500 }
                    );

                // Finalize PDF
                doc.end();

                stream.on('finish', () => {
                    resolve(`/uploads/invoices/${filename}`);
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new PDFService();
