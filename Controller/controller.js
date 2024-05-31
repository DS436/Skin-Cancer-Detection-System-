const express = require('express');
const app = express();
const path = require('path');

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/home.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/about.html'));
});

app.get('/detection', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/detection.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/faq.html'));
});

app.get('/ethics', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/ethics.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/contact.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});


// Start the server
const port = process.env.PORT ||  3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 