require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();

// AWS Configuration
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'Users';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// List Users
app.get('/', async (req, res) => {
    const params = {
        TableName: TABLE_NAME
    };
    try {
        const data = await dynamoDB.scan(params).promise();
        res.render('index', { users: data.Items });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error retrieving users");
    }
});

// Create User Form
app.get('/create', (req, res) => {
    res.render('create');
});

// Create User
app.post('/create', async (req, res) => {
    const { username, password, phone, email } = req.body;
    const params = {
        TableName: TABLE_NAME,
        Item: {
            user_id: Date.now(), // This will create a numeric timestamp for user_id
            username,
            password_hash: password, // In real app, hash this password
            created_at: new Date().toISOString(),
            phone,
            email,
            account_status: 'A'
        }
    };
    try {
        await dynamoDB.put(params).promise();
        res.redirect('/');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error creating user");
    }
});

// Edit User Form
app.get('/edit/:id', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            user_id: parseInt(req.params.id) // Convert id to number
        }
    };
    try {
        const data = await dynamoDB.get(params).promise();
        res.render('edit', { user: data.Item });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error retrieving user");
    }
});

// Update User
app.post('/edit/:id', async (req, res) => {
    const { username, phone, email, account_status } = req.body;
    const params = {
        TableName: TABLE_NAME,
        Key: {
            user_id: parseInt(req.params.id) // Convert id to number
        },
        UpdateExpression: 'set username = :u, phone = :p, email = :e, account_status = :s',
        ExpressionAttributeValues: {
            ':u': username,
            ':p': phone,
            ':e': email,
            ':s': account_status
        }
    };
    try {
        await dynamoDB.update(params).promise();
        res.redirect('/');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error updating user");
    }
});

// Delete User
app.post('/delete/:id', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            user_id: parseInt(req.params.id) // Convert id to number
        }
    };
    try {
        await dynamoDB.delete(params).promise();
        res.redirect('/');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error deleting user");
    }
});
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));