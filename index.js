const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors');

const crypto = require('crypto');
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");

const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    })
);

app.get('/', async (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.post('/payu-payment', async (req, res) => {
    const referenceCode = `${Math.round(
        new Date().getTime() + Math.random() * 100
    )}`;
    const email = 'juancamilo6556@gmail.com';

    let res_details = {
        merchantId: process.env.PAYU_MERCHANT_ID,
        accountId: process.env.PAYU_ACCOUNT_ID,
        description: 'Test Payment',
        referenceCode: referenceCode,
        amount: 500,
        tax: '0',
        taxReturnBase: '0',
        currency: 'COP',
        signature: '',
        test: '1',
        buyerEmail: email,
    };

    const string = `${process.env.PAYU_API_KEY}~${process.env.PAYU_MERCHANT_ID}~${referenceCode}~${res_details.amount}~${res_details.currency}`;
    const signature = crypto.createHash('md5').update(string).digest('hex');
    res_details.signature = signature;

    return res.json({
        info: res_details,
    });
});

app.get('/payment/success', async (req, res) => {
    res.send('Payment Success')
});

app.post('/payment/confirmation', async (req, res) => {
    console.log(req.body.orderId);
    const templateBody = {
        "test": true,
        "language": 'es',
        "command": 'ORDER_DETAIL',
        "merchant": {
            "apiKey": process.env.PAYU_API_KEY,
            "apiLogin": process.env.PAYU_API_LOGIN,
        },
        "details": {
            orderId: req.body.orderId,
        },
    };
    const response = await fetch(
        'https://sandbox.api.payulatam.com/reports-api/4.0/service.cgi',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateBody),
        }
    );

    if (response.ok) {
        const data = await response.text();
        const parser = new XMLParser();
        const dataJson = parser.parse(data);
        console.log(dataJson.reportingResponse.result.payload.transactions.transaction.transactionResponse.state);
        res.send(dataJson);
    }
});


app.use('/webhook', async (req, res) => {
    console.log('Webhook');
    res.send('Webhook');
});

app.listen(port, () => {
    console.log(`Now listening on port ${port} `);
});
