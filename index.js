const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
require('dotenv').config(); // Loads environment variables

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
    origin: "*", // Add your frontend URLs
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
}));

app.use(express.json());

// Default Route
app.get("/", (req, res) => {
    res.send("Hello World!");
});
// Create an Order (Razorpay)
app.post('/orders', async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = {
            amount: req.body.amount * 100, // Convert to paise
            currency: req.body.currency || "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const response = await razorpay.orders.create(options);

        res.json({
            success: true,
            order_id: response.id,
            currency: response.currency,
            amount: response.amount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating order", error });
    }
});

// Fetch Payment Details
app.get('/payment/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const payment = await razorpay.payments.fetch(paymentId);

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        res.json({
            success: true,
            status: payment.status,
            method: payment.method,
            amount: payment.amount,
            currency: payment.currency
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch payment", error });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Export for Vercel
module.exports = app;
