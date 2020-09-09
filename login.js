var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const { Server } = require('http');

// var connection = mysql.createConnection({
//     host: "abhinav-mysqlserver.mysql.database.azure.com",
//     user: "azure_root@abhinav-mysqlserver",
//     password: "mysqlpass!23",
//     database: "nodelogin",
//     port: 3306,
//     ssl: true
// });
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'SQLroot!23',
	database: 'nodelogin'
});
connection.connect(function(err){
    if(!err) {
        console.log("Database is connected...");
    } else {
        console.log(err);
    }
});

var app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/register', function(req, res) {
    res.sendFile('register.html', { root: __dirname })
});

app.get('/home', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile('home.html', { root: __dirname });
        // res.send('Welcome back, ' + req.session.username + '!');
    } else {
		res.send('Please login to view this page!');
    }
});

app.post('/auth', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], (error, results, fields) => {
            console.log(JSON.parse(results));
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/home');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send('Please enter Username and Password!');
		res.end();
    }
});

app.post('/addUser', (req, res) => {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;

    if (email && username && password) {
        connection.query('SELECT * FROM `accounts` WHERE `username` = ? OR `email` = ?', [username, email], (error, results, fields) => {
            if (error) throw error;
            // check if username or email matches
            if (results.length > 0) {
                var usedUsername = false;
                var usedEmail = false;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].username == username) {
                        usedUsername = true;
                        break;
                    }
                }
                for (var i = 0; i < results.length; i++) {
                    if (results[i].email == email) {
                        usedEmail = true;
                        break;
                    }
                }

                if (usedUsername && usedEmail) {
                    res.send('A user has already registered with this username and email.');
                    res.end();
                }
                else if (usedUsername) {
                    res.send('A user has already registered with this username.');
                    res.end();
                }
                else {
                    res.send('A user has already registered with this email.');
                    res.end();
                }
            }
            else {
                connection.query('INSERT INTO accounts(username, password, email) VALUES(?, ?, ?);', [username, password, email], (error, results, fields) => {
                    if (error) throw error;
                });
                res.send('You have been registered!');
            }
            res.end();
        });
    }
    else {
        res.send('Please enter Email, Username and Password!');
		res.end();
    }
});

app.get('/test', pyTest);

function pyTest(req, res) {
    var spawn = require("child_process").spawn;
    var process = spawn('python',["./url-crawler.py"]);

    process.stdout.on('data', function(data) { 
        console.log(data.toString());
        res.send(data.toString());
    });
}

var PORT = process.env.PORT || 5555;
app.listen(PORT, () => {
    console.log('Listening on port 5555...');
});

// Helpful Link: https://codeshack.io/basic-login-system-nodejs-express-mysql/