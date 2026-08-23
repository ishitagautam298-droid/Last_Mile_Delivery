const nodemailer = require('nodemailer');
const NotificationLog = require('../models/NotificationLog');

class NotificationService {
  static transporter = null;
  static etherealAccount = null;
  static io = null;

  static setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  static async initializeTransporter() {
    if (this.transporter) return this.transporter;

    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('✅ SMTP Transporter initialized with custom credentials');
      } else {
        // Create an Ethereal test account for automated testing / demo preview URLs
        this.etherealAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: this.etherealAccount.user,
            pass: this.etherealAccount.pass
          }
        });
        console.log(`📧 Ethereal Test Email Account created: ${this.etherealAccount.user}`);
      }
    } catch (err) {
      console.warn('⚠️ Email transporter initialization fallback to console mock:', err.message);
      this.transporter = {
        sendMail: async (options) => ({
          messageId: 'mock-' + Date.now(),
          preview: 'https://ethereal.email/message/mock'
        })
      };
    }
    return this.transporter;
  }

  /**
   * Broadcast real-time event via WebSocket
   */
  static emitRealtimeEvent(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Dispatch Email and SMS notifications for Order status change
   */
  static async notifyStatusChange(order, previousStatus, newStatus, additionalInfo = {}) {
    await this.initializeTransporter();

    const trackingNumber = order.trackingNumber;
    const customerName = order.customerName || 'Valued Customer';
    const customerEmail = order.customerEmail;
    const customerPhone = order.customerPhone || '+91 98765 43210';

    let subject = `[${trackingNumber}] Order Update: ${newStatus}`;
    let emailHtml = '';
    let smsMessage = '';

    const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${trackingNumber}`;

    switch (newStatus) {
      case 'Created':
        subject = `📦 Order Confirmed: ${trackingNumber}`;
        smsMessage = `Hi ${customerName}, your delivery #${trackingNumber} is booked. Amount: ₹${order.pricing?.totalAmount}. Track live: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
              <h2>🚚 Order Confirmed!</h2>
              <p style="margin: 0; font-size: 16px;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Your order has been successfully created and pricing verified. Our auto-dispatch engine is assigning the nearest delivery agent.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px 0; color: #64748b;">Pickup:</td><td style="padding: 8px 0; font-weight: bold;">${order.pickupAddress.area}, ${order.pickupAddress.city}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Drop:</td><td style="padding: 8px 0; font-weight: bold;">${order.dropAddress.area}, ${order.dropAddress.city}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Chargeable Weight:</td><td style="padding: 8px 0; font-weight: bold;">${order.packageDetails?.chargeableWeightKg} kg</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Order Type / Payment:</td><td style="padding: 8px 0; font-weight: bold;">${order.orderType} / ${order.paymentType}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b;">Total Amount:</td><td style="padding: 8px 0; font-weight: bold; color: #16a34a; font-size: 18px;">₹${order.pricing?.totalAmount}</td></tr>
              </table>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Live Delivery</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Assigned':
        subject = `🛵 Delivery Agent Assigned: ${trackingNumber}`;
        smsMessage = `Your order #${trackingNumber} has been assigned to a delivery partner. Track: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #0284c7; color: #ffffff; padding: 20px; text-align: center;">
              <h2>🛵 Delivery Agent Assigned</h2>
              <p style="margin: 0; font-size: 16px;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>A delivery executive has been assigned and is heading to the pickup location.</p>
              <p style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
                <strong>Agent Note:</strong> Package pickup scheduled.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Live Status</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Picked Up':
        subject = `📦 Package Picked Up: ${trackingNumber}`;
        smsMessage = `Order #${trackingNumber} picked up successfully and is on its way. Track: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #7c3aed; color: #ffffff; padding: 20px; text-align: center;">
              <h2>📦 Package Picked Up</h2>
              <p style="margin: 0; font-size: 16px;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Your package has been collected by our delivery partner and is being transferred to the local delivery hub.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Timeline</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'In Transit':
        subject = `🛣️ Package In Transit: ${trackingNumber}`;
        smsMessage = `Order #${trackingNumber} is in transit to your area delivery hub. Track: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #d97706; color: #ffffff; padding: 20px; text-align: center;">
              <h2>🛣️ In Transit</h2>
              <p style="margin: 0;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Your shipment is actively moving between logistics hubs towards your delivery zone.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Live GPS Tracking</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Out for Delivery':
        subject = `🚚 Out For Delivery Today: ${trackingNumber}`;
        smsMessage = `Order #${trackingNumber} is Out for Delivery! Our agent will reach your drop address shortly. Track: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #ea580c; color: #ffffff; padding: 20px; text-align: center;">
              <h2>🚀 Out For Delivery!</h2>
              <p style="margin: 0;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Great news! Your package is out for delivery today to <strong>${order.dropAddress.street}, ${order.dropAddress.area}, ${order.dropAddress.city}</strong>.</p>
              ${order.paymentType === 'COD' ? `<p style="background: #fef3c7; color: #92400e; padding: 12px; border-radius: 6px;"><strong>Cash on Delivery:</strong> Please keep ₹${order.pricing?.totalAmount} ready.</p>` : ''}
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Driver on Map</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Delivered':
        subject = `🎉 Package Delivered: ${trackingNumber}`;
        smsMessage = `Order #${trackingNumber} has been successfully delivered. Thank you for choosing our logistics service!`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #16a34a; color: #ffffff; padding: 20px; text-align: center;">
              <h2>✅ Delivered Successfully!</h2>
              <p style="margin: 0;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Your package has been successfully delivered at ${new Date().toLocaleTimeString()}.</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0; color: #166534;"><strong>Delivered to:</strong> ${order.dropAddress.street}, ${order.dropAddress.area}, ${order.dropAddress.city} - ${order.dropAddress.pincode}</p>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Delivery Summary</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Failed':
        const failReason = additionalInfo.reason || order.failedDetails?.reason || 'Customer unavailable';
        subject = `⚠️ Delivery Attempt Failed: ${trackingNumber}`;
        smsMessage = `Delivery attempt for #${trackingNumber} failed (${failReason}). Please click here to reschedule a convenient delivery slot: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #dc2626; color: #ffffff; padding: 20px; text-align: center;">
              <h2>⚠️ Delivery Attempt Failed</h2>
              <p style="margin: 0;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>We attempted to deliver your shipment #${trackingNumber}, but the attempt was unsuccessful.</p>
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${failReason}</p>
                ${additionalInfo.notes ? `<p style="margin: 8px 0 0 0; color: #7f1d1d;"><strong>Agent Notes:</strong> ${additionalInfo.notes}</p>` : ''}
              </div>
              <p>Please select a new date or convenient delivery window so our auto-assignment engine can reschedule your delivery.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reschedule Delivery Now</a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Rescheduled':
        const reschedDate = additionalInfo.rescheduledDate || order.failedDetails?.rescheduledDate;
        const timeSlot = additionalInfo.rescheduledTimeSlot || order.failedDetails?.rescheduledTimeSlot || 'Standard Slot';
        subject = `📅 Delivery Rescheduled: ${trackingNumber}`;
        smsMessage = `Order #${trackingNumber} rescheduled for ${reschedDate ? new Date(reschedDate).toLocaleDateString() : 'selected date'} (${timeSlot}). Track: ${trackingUrl}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
              <h2>📅 Delivery Rescheduled</h2>
              <p style="margin: 0;">Tracking ID: <strong>${trackingNumber}</strong></p>
            </div>
            <div style="padding: 24px; color: #334155;">
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Your reschedule request has been received and confirmed!</p>
              <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0; color: #3730a3;"><strong>New Date:</strong> ${reschedDate ? new Date(reschedDate).toDateString() : 'Upcoming Slot'}</p>
                <p style="margin: 8px 0 0 0; color: #3730a3;"><strong>Time Slot:</strong> ${timeSlot}</p>
              </div>
              <p>A delivery executive is being reassigned for your rescheduled slot.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${trackingUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Updated Schedule</a>
              </div>
            </div>
          </div>
        `;
        break;

      default:
        smsMessage = `Order #${trackingNumber} status updated to ${newStatus}. Track: ${trackingUrl}`;
        emailHtml = `<p>Order #${trackingNumber} is now ${newStatus}.</p>`;
    }

    // 1. Send Email
    let previewUrl = null;
    try {
      const info = await this.transporter.sendMail({
        from: '"Last-Mile Logistics" <no-reply@lastmilelogistics.com>',
        to: customerEmail || 'customer@example.com',
        subject,
        html: emailHtml
      });

      if (nodemailer.getTestMessageUrl) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      await NotificationLog.create({
        order: order._id,
        trackingNumber,
        recipient: { name: customerName, email: customerEmail, phone: customerPhone },
        channel: 'email',
        type: `STATUS_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
        subject,
        message: emailHtml,
        previewUrl: previewUrl || null,
        status: 'sent'
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
      await NotificationLog.create({
        order: order._id,
        trackingNumber,
        recipient: { name: customerName, email: customerEmail, phone: customerPhone },
        channel: 'email',
        type: `STATUS_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
        subject,
        message: emailHtml,
        status: 'failed'
      });
    }

    // 2. Send / Log SMS
    try {
      await NotificationLog.create({
        order: order._id,
        trackingNumber,
        recipient: { name: customerName, phone: customerPhone },
        channel: 'sms',
        type: `STATUS_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
        message: smsMessage,
        status: 'delivered'
      });
    } catch (smsErr) {
      console.error('SMS log error:', smsErr.message);
    }

    // 3. Emit live WebSocket notification
    this.emitRealtimeEvent('order_updated', {
      orderId: order._id,
      trackingNumber,
      status: newStatus,
      previousStatus,
      timestamp: new Date(),
      notification: { subject, smsMessage, previewUrl }
    });
  }

  static async notifyAssignment(order, agent) {
    await this.notifyStatusChange(order, 'Created', 'Assigned', { agentName: agent.name });
  }
}

module.exports = NotificationService;
