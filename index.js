const express = require('express');
const mysql = require("mysql");
const app = express();
const port = 8000;
const fs = require("fs");
var cors = require('cors');
app.use(cors());

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "project20222402",
    insecureAuth: true
});

connection.connect();





app.get('/', (req, res) => {
    res.send("server working")
})

app.get("/check_login", (req, res) => {

    const data = req.query;
    connection.query(`select UserId from userdetails where MailId = "${data.id}" && Passsword = "${data.password}"; `, (err, result) => {
        if (err) throw err

        else {
            if (result.length != 0) {
                res.send({ status: 200, UserId: result[0].UserId });
            }
            else {
                res.send({ status: 401, UserId: "" });
            }
        }

    })
})


app.get("/sign_up", (req, res) => {

    const data = req.query;

    connection.query(`INSERT INTO userdetails (FirstName, MailId , Passsword , UserId) VALUES ('${data.FirstName}', '${data.MailId}', '${data.Password}', "${data.FirstName}");`, (err, result) => {
        if (err) {
            console.log(err);
            res.send({ status: 401 });

        }

        else {
            res.send({ status: 200 });
        }

    })
})



app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

