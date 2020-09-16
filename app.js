var mysql = require('mysql');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
const { Server } = require('http');
const express = require('express');
const fs = require('fs');
const app = express();
var cors = require('cors');

app.use(cors());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

var con = mysql.createConnection({
    host: "mysql",
    user: "root",
    password: "password",
    database: "series"
});

// var con = mysql.createConnection({
// 	host: 'localhost',
// 	user: 'root',
// 	password: 'SQLroot!23',
// 	database: 'series'
// });
con.connect(function(err){
    if(!err) {
        console.log("Database is connected...");
    } else {
        console.log(err);
    }
});

app.get('/showjson', (req, res) => {
    fs.readFile('shows.json', function (err, data) {
        var json = JSON.parse(data);
        res.json(json);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/register', function(req, res) {
    res.sendFile('register.html', { root: __dirname })
});

app.get('/showform', function(req, res) {
    res.sendFile('show-form.html', { root: __dirname })
});

app.get('/shows', (req, res) => {
    if (req.session.loggedin) {
        // con.query("select * from shows", function (error, result, fields) {
        //     result = JSON.stringify(result);
        //     if (error) throw error;
        //     console.log("Result: " + result);
        //     res.send(result);
        // });
        res.sendFile(path.join(__dirname + '/shows.html'));
    } else {
		res.send('Please login to view this page!');
    }
});

app.get('/home', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname + '/home.html'));
        con.query("select * from shows", function (error, result, fields) {
            // result = JSON.stringify(result);
            if (error) throw error;

            var json = [];
            for (var i = 0; i < result.length; i++) {
                json.push({
                    name: result[i].name,
                    season: result[i].Season,
                    episode: result[i].Episode,
                    time: result[i].SeriesTime
                });
            }

            console.log(json);
            fs.writeFile('shows.json', JSON.stringify(json), function (err, result) {
                if (err) {
                    console.log('error', err);
                }
            });
        });
    } else {
		res.send('Please login to view this page!');
    }
});

app.post('/auth', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
        con.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], (error, results, fields) => {
            // console.log(JSON.parse(results));
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

app.post('/addShow', (req, res) => {
    var name = req.body.name;
    var season = req.body.season;
    var episode = req.body.episode;
    var time = req.body.time;

    if (name && season && episode && time) {
        con.query('INSERT INTO shows(name, Season, Episode, SeriesTime) VALUES(?, ?, ?, ?);', [name, season, episode, time], (error, results, fields) => {
            if (error) {
                throw error;
            }
        });
        res.send('Show added!');
    }
});

app.post('/addUser', (req, res) => {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;

    if (email && username && password) {
        con.query('SELECT * FROM `accounts` WHERE `username` = ? OR `email` = ?', [username, email], (error, results, fields) => {
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
                con.query('INSERT INTO accounts(username, password, email) VALUES(?, ?, ?);', [username, password, email], (error, results, fields) => {
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

// app.get('/shows', (req, res) => {
//     con.connect(function (err) {
//         if (err) throw err;
//         console.log("Connected!");
//         con.query("select * from shows", function (error, result, fields) {
//             result = JSON.stringify(result);
//             if (error) throw error;
//             console.log("Result: " + result);
//             res.send(result);
//         });
//     });
// });



app.listen(80, () => {
    console.log('Rest Api- Running on port 80')
})