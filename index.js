const express = require('express');
const mysql = require("mysql");
const app = express();
const port = 8000;
const fs = require("fs");
var cors = require('cors');
var Jwt = require('jsonwebtoken');
const { verify } = require('crypto');
var jwtKey = "Key-NewsApp";


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
        if (err) {
            res.status(401).send();
        }

        else {
            if (result.length != 0) {
                var UserId = result[0].UserId;
                Jwt.sign({ UserId }, jwtKey, (e, token) => {
                    if (e) {
                        res.status(401).send();
                    }

                    else {
                        res.send({ UserId: UserId, token: token });
                    }
                })
            }
            else {
                res.status(401).send();
            }
        }

    })
})


app.get("/check_google_login", (req, res) => {

    const data = req.query;
    connection.query(`select MailId from userdetails where UserId="GI-${data.googleId}"; `, (err, result) => {
        if (err) {
            res.status(401).send();
        }

        else {
            var UserId = `GI-${data.googleId}`;
            if (result.length == 0) {

                connection.query(`INSERT INTO userdetails (FirstName, MailId , Passsword , UserId,profile_url) VALUES ('${data.name}', '${data.email}', 'Google Login', "GI-${data.googleId}","${data.imageUrl}");`, (errr, resu) => {

                    if (errr) {
                        res.status(401).send();

                    }

                    else {
                        Jwt.sign({ UserId }, jwtKey, (e, token) => {
                            if (e) {
                                res.status(401).send();
                            }

                            else {
                                res.send({ status: 200, UserId: UserId, token: token });
                            }
                        })
                    }
                })

            }
            else {
                Jwt.sign({ UserId }, jwtKey, (e, token) => {
                    if (e) {
                        res.status(401).send();
                    }

                    else {
                        res.send({ UserId: UserId, token: token });
                    }
                })
            }
        }

    })
})


app.get("/sign_up", (req, res) => {

    const data = req.query;


    connection.query(`select UserId from userdetails where MailId = "${data.MailId}";` , (err,result)=>{
        if(err)
        {
            res.status(401).send();
        }
        else
        {
            if(result.length==0)
            {
                connection.query(`INSERT INTO userdetails (FirstName, MailId , Passsword , UserId) VALUES ('${data.FirstName}', '${data.MailId}', '${data.Password}', "NA-${data.MailId}");`, (errr, results) => {
                    if (errr) {
                        res.status(401).send();
            
                    }
            
                    else {
                        var UserId = `NA-${data.MailId}`;
                        Jwt.sign({ UserId }, jwtKey, (e, token) => {
                            if (e) {
                                res.status(401).send();
                            }
            
                            else {
                                res.send({UserId: UserId, token: token });
                            }
                        })
                    }
            
                })

            }

            else
            {
                res.send({UserId: "Email Id Used", token: "" });
            }
        }
    })
   
})

app.get("/user_name",VerifyToken,(req,res)=>{
    const data = req.query;
    const UserId = data.UserId;
    connection.query(`select FirstName,profile_url from userdetails where UserId = "${UserId}"; `, (err, result) => {
        if(err)
        {
            res.status(401).send();   
        }
        else
        {
            if(result.length==0)
            {
                res.status(401).send();   

            }

            else
            {
                res.send(result[0]);   

            }
        }
    })



})




function VerifyToken(req,res,next)
{
    let token = req.headers['authorization'];
    if(token)
    {
        Jwt.verify(token,jwtKey,(err,vaild)=>{
            if(err)
            {
                res.status(401).send({result: "Please Add Correct Token With Header"});

            }
            else
            {
                next();
            }

        })
    }

    else
    {
        res.status(403).send({result: "Please Add Token With Header"});
    }
}

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

