var mysql = require('mysql');
var bodyParser = require('body-parser')
const express = require('express');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('hello node js'));

app.get('/shows', (req, res) => {
    var con = mysql.createConnection({
        host: "mysql",
        user: "root",
        password: "password",
        database: "series"
    });

    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        con.query("select * from shows", function (error, result, fields) {
            result = JSON.stringify(result);
            if (error) throw error;
            console.log("Result: " + result);
            res.send(result);
        });
    });
    
})

app.listen(80, () => {
    console.log('Rest Api- Running on port 80')

})