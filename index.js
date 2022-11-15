const express = require('express');
const mysql = require("mysql");
const app = express();
const port = 3232;
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


    connection.query(`select UserId from userdetails where MailId = "${data.MailId}";`, (err, result) => {
        if (err) {
            res.status(401).send();
        }
        else {
            if (result.length == 0) {
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
                                res.send({ UserId: UserId, token: token });
                            }
                        })
                    }

                })

            }

            else {
                res.send({ UserId: "Email Id Used", token: "" });
            }
        }
    })

})

app.get("/user_name", VerifyToken, (req, res) => {
    const data = req.query;
    const UserId = data.UserId;
    connection.query(`select * from userdetails where UserId = "${UserId}"; `, (err, result) => {
        if (err) {
            res.status(401).send();
        }
        else {
            if (result.length == 0) {
                res.status(401).send();

            }

            else {
                res.send(result[0]);

            }
        }
    })



})


app.get("/edit_user_data", VerifyToken, (req, res) => {

    const data = req.query;

    connection.query(`select UserId from userdetails where MailId = "${data.mail}" and UserId != "${data.UserId}";`, (err, result) => {
        if (err) {
            res.status(401).send();
        }
        else {
            if (result.length == 0) {
                if (data.profile_url == undefined) {
                    connection.query(`UPDATE userdetails SET FirstName="${data.name}",MailId="${data.mail}" WHERE UserId="${data.UserId}";`, (errr, results) => {
                        if (errr) {

                            res.status(401).send();

                        }

                        else {
                            res.send({ message: "successfully" })
                        }

                    })

                }
                else {
                    connection.query(`UPDATE userdetails SET FirstName="${data.name}",MailId="${data.mail}",profile_url="${data.profile_url}" WHERE UserId="${data.UserId}";`, (errr, results) => {
                        if (errr) {

                            res.status(401).send();

                        }

                        else {
                            res.send({ message: "successfully" })
                        }

                    })

                }


            }

            else {
                res.send({ message: "Email Id Used" });
            }
        }
    })
})

app.get("/edit_password", (req, res) => {
    const data = req.query;
    if (data.UserId.split("-")[0] == "GI") {
        connection.query(`UPDATE userdetails SET Passsword="${data.NewPassword}" WHERE UserId="${data.UserId}";`, (errr, results) => {
            if(errr)
            {
                res.status(401).send();
            }
            else
            {
                res.send({ message: "successfully" })
            }
        });

    }
    else {

        connection.query(`UPDATE userdetails SET Passsword="${data.NewPassword}" WHERE UserId="${data.UserId}" and Passsword="${data.OldPassword}";`, (errr, results) => {
            if(errr)
            {
                res.status(401).send();
            }
            else
            {
                res.send({ changedRows: results.changedRows })
            }
        });

    }
})


function VerifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        Jwt.verify(token, jwtKey, (err, vaild) => {
            if (err) {
                res.status(401).send({ result: "Please Add Correct Token With Header" });

            }
            else {
                next();
            }

        })
    }

    else {
        res.status(403).send({ result: "Please Add Token With Header" });
    }
}

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

