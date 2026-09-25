const transporter = require("./email.service");

const SHIPPING_COST = 2;

const sendDeliveredEmail = async (email, firstname, order) => {
    const {
        id,
        track_id,
        trackId, // Fallback if Drizzle returns camelCase
        created_at,
        createdAt,
        address,
        apartment,
        city,
        country,
        order_items: orderItems = []   // Matches SQL alias, not camelCase
    } = order;

    // Fallback order tracking number if track_id isn't present
    const displayTrackId = track_id || trackId || `ORD-${id}`;

    let subtotal = 0;
    const attachments = [];

    const formattedItems = orderItems.map((item, index) => {
        const product = item.product || {};

        const imageUrl = product.main_image || '';
        const title = product.title || 'Product';
        const quantity = Number(item.quantity || 1);
        const price = Number(product.price || product.original_price || 0);

        subtotal += price * quantity;

        let imgTag = '';

        if (imageUrl.startsWith('data:image')) {
            const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
                const mimeType = match[1];
                const base64Data = match[2];
                const cid = `product-image-${index}@niwali`;

                attachments.push({
                    filename: `product-${index}.${mimeType.split('/')[1]}`,
                    content: base64Data,
                    encoding: 'base64',
                    cid,
                });

                imgTag = `<img src="cid:${cid}" width="60" height="60" style="border-radius:6px;object-fit:cover;" />`;
            }
        } else if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
            imgTag = `<img src="${imageUrl}" width="60" height="60" style="border-radius:6px;object-fit:cover;" />`;
        }

        return `
            <tr>
              <td style="padding:10px 0;">
                ${imgTag}
              </td>
              <td style="padding:10px;color:#333;">${title}</td>
              <td style="text-align:center;color:#333;">${quantity}</td>
              <td style="text-align:right;color:#e63946;font-weight:bold;">$${price.toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    const orderDate = new Date(created_at || createdAt || Date.now()).toLocaleDateString();
    const shipping = SHIPPING_COST;
    const finalTotal = subtotal + shipping;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your NIWALI Order Has Delivered",
        html: `
            <div style="max-width:500px;margin:auto;font-family:Arial,sans-serif;border:1px solid #eee;padding:20px;">
              <div style="text-align:center;">
                <h1 style="color:#333;margin-bottom:5px;">NIWALI</h1>
                <h3 style="color:#555;">Your order has been delivered.</h3>
              </div>
              <div style="display:flex;justify-content:space-between;padding:15px 0;background:#f9f9f9;margin:15px 0;">
                <div style="padding:0 10px;font-size:14px;">
                  <strong>SUMMARY</strong><br/>
                  Order #: ${displayTrackId}<br/>
                  Date: ${orderDate}<br/>
                  Total: $${finalTotal.toFixed(2)}
                </div>
                <div style="padding:0 10px;font-size:14px;">
                  <strong>SHIPPING</strong><br/>
                  ${firstname} ${order.lastname || ''}<br/>
                  ${address} ${apartment ? `<br/>Apt: ${apartment}` : ''}<br/>
                  ${city}, ${country}
                </div>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="text-align:left;color:#888;font-size:12px;border-bottom:1px solid #eee;">
                    <th></th><th>ITEM</th><th style="text-align:center;">QTY</th><th style="text-align:right;">PRICE</th>
                  </tr>
                </thead>
                <tbody>${formattedItems}</tbody>
              </table>
              <div style="padding:15px 0;text-align:right;border-top:1px solid #eee;margin-top:15px;font-size:14px;">
                Subtotal: $${subtotal.toFixed(2)}<br/>
                Shipping: $${shipping.toFixed(2)}<br/>
                <strong style="font-size:16px;">Total: $${finalTotal.toFixed(2)}</strong>
              </div>
              <p style="text-align:center;color:#777;font-size:13px;margin-top:20px;">Thank you for shopping with <b>NIWALI</b>, ${firstname}!</p>
            </div>
        `,
        attachments,
    });
};

module.exports = sendDeliveredEmail;