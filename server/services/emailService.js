const nodemailer = require('nodemailer');
const Product = require('../models/Product');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendLowStockAlert = async (products) => {
  if (!process.env.EMAIL_USER || !process.env.ALERT_EMAIL) {
    console.log('Email not configured, skipping alert');
    return;
  }

  const productList = products.map(p => 
    `• ${p.name} (Barcode: ${p.barcode}) - Current: ${p.quantity}, Threshold: ${p.threshold}`
  ).join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: '⚠️ Shelf Sense - Low Stock Alert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">🚨 Low Stock Alert</h2>
        <p>The following items are running low and need restocking:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #F3F4F6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #E5E7EB;">Product</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #E5E7EB;">Barcode</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #E5E7EB;">Current Stock</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #E5E7EB;">Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td style="padding: 12px; border: 1px solid #E5E7EB;">${p.name}</td>
                <td style="padding: 12px; border: 1px solid #E5E7EB;">${p.barcode}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #E5E7EB; color: #EF4444; font-weight: bold;">${p.quantity}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #E5E7EB;">${p.threshold}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="color: #6B7280; font-size: 14px;">This is an automated alert from Shelf Sense Inventory Manager.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Low stock alert email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const checkLowStock = async () => {
  try {
    const lowStockProducts = await Product.find({ isLowStock: true });
    if (lowStockProducts.length > 0) {
      await sendLowStockAlert(lowStockProducts);
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
};

module.exports = { sendLowStockAlert, checkLowStock };
