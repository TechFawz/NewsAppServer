const express = require('express');
const mysql = require("mysql");
const app = express();
const port = 8000;
const fs = require("fs");
var cors = require('cors');
var Jwt = require('jsonwebtoken');
const { verify } = require('crypto');
var jwtKey = "Key-NewsApp";
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer');

app.use(cors());
app.use(express.json())

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "project20222402",
    insecureAuth: true
});

connection.connect();

app.get('/', (req, res) => {
    res.send("server working")
})

app.get("/check_login", (req, res) => {

    const data = req.query;
    connection.query(`select UserId from userdetails where MailId = "${data.id}" && Password = "${data.password}"; `, (err, result) => {
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

                connection.query(`INSERT INTO userdetails (FirstName, MailId , Password , UserId,profile_url) VALUES ('${data.name}', '${data.email}', 'Google Login', "GI-${data.googleId}","${data.imageUrl}");`, (errr, resu) => {

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
                connection.query(`INSERT INTO userdetails (FirstName, MailId , Password , UserId) VALUES ('${data.FirstName}', '${data.MailId}', '${data.Password}', "NA-${data.MailId}");`, (errr, results) => {
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
        connection.query(`UPDATE userdetails SET Password="${data.NewPassword}" WHERE UserId="${data.UserId}";`, (errr, results) => {
            if (errr) {
                res.status(401).send();
            }
            else {
                res.send({ message: "successfully" })
            }
        });

    }
    else {

        connection.query(`UPDATE userdetails SET Password="${data.NewPassword}" WHERE UserId="${data.UserId}" and Password="${data.OldPassword}";`, (errr, results) => {
            if (errr) {
                res.status(401).send();
            }
            else {
                res.send({ changedRows: results.changedRows })
            }
        });

    }
})

app.post("/rate", (req, res) => {
    const data = req.body
    const query = `INSERT INTO news_cards (ratings, watchList, url, urlToImage, UserId, author, content, description, publishedAt, title) VALUES (${data.ratings}, ${data.watchList}, "${data.url}", "${data.urlToImage}", "${data.UserId}","${data.author}", "${data.content}", "${data.description}", "${data.publishedAt}", "${data.title}");`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send({ msg: results })
        }
    });
})

app.get("/rate", (req, res) => {
    const UserId = req.query.UserId;
    connection.query(`SELECT * FROM news_cards WHERE UserId="${UserId}" AND ratings>0;`, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send({ msg: results })
        }
    });
})

app.post("/watch", (req, res) => {
    const data = req.body
    const query = `INSERT INTO news_cards (ratings, watchList, url, urlToImage, UserId, author, content, description, publishedAt, title) VALUES (${data.ratings}, ${data.watchList}, "${data.url}", "${data.urlToImage}", "${data.UserId}","${data.author}", "${data.content}", "${data.description}", "${data.publishedAt}", "${data.title}");`
    console.log(query)
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }
        else {
            res.status(200).send({ msg: results })
        }
    });
})

app.get("/watch", (req, res) => {
    const UserId = req.query.UserId;
    const query = `SELECT * FROM news_cards WHERE UserId="${UserId}" AND watchList=1;`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            console.log(results);
            res.status(200).send({ msg: results })
        }
    });
})

app.post("/send_invite", async (req, res) => {
    const sender = req.body.senderMail;
    const receiver = req.body.receiverMail;
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
    let info = await transporter.sendMail({
        from: `${sender}`, // sender address
        to: `${receiver}`, // list of receivers
        subject: "Join News App", // Subject line
        html: "<b>Accept NewsApp invite </b>", // html body
    });
    console.log("Message sent: %s", info.messageId);
    res.status(200).send({ msg: "Email Sent" })
})


app.post("/user-category", (req, res) => {
    const newsCategories = (req.body.newsCategories).join();
    const UserId = req.body.UserId;
    console.log(newsCategories)
    console.log(UserId)
    const query = `UPDATE userdetails SET newsCategories="${newsCategories}" WHERE UserId="${UserId}";`
    console.log(query)
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send({ msg: results })
        }
    })
})

app.get("/user-category", (req, res) => {
    const UserId = req.query.UserId;
    const query = `SELECT newsCategories from userdetails WHERE UserId="${UserId}";`
    let newsCategories
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            if (results[0].newsCategories) {
                newsCategories = (results[0].newsCategories).split(',');
            } else {
                newsCategories = ['IT', 'Drone', 'Electronics']
            }

            res.status(200).send({ msg: newsCategories })
        }
    })
})

app.post("/follow", (req, res) => {
    const follower = req.body.followerId;
    const UserId = req.body.UserId;
    const query = `SELECT followerCount from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, followerCount) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            followerCount = followerCount[0].followerCount
            if (isNaN(followerCount)) {
                followerCount = 0;
            }
            followerCount++;
            console.log(followerCount)
            const query = `UPDATE userdetails SET followerCount = "${followerCount}" WHERE UserId="${UserId}";`
            connection.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    const query = `UPDATE userdetails SET followers = CONCAT(followers, ",${follower}") WHERE UserId="${UserId}";`
                    connection.query(query, (err, followerCount) => {
                        if (err) {
                            res.status(500).send(err);
                        }
                        else {
                            res.status(200).send({ msg: results })

                        }
                    })
                }
            })

        }
    })
})

app.get("/followers", (req, res) => {
    const UserId = req.query.UserId;
    const query = `SELECT followers from userdetails WHERE UserId="${UserId}";`
    connection.query(query, async (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            const followers = []
            const promises = []
            const result = (results[0].followers).split(',');
            const result_size = result.length
            console.log(result_size)
            for (const element of result) {
                const query = `SELECT * from userdetails WHERE UserId="${element}";`
                connection.query(query, async (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        followers.push(result[0])
                        console.log(followers)
                        if (result_size === followers.length) {
                            res.status(200).send({ msg: followers })
                        }
                    }
                })
            }
        }
    })
})

//API to check if a person is already a follower or not 
app.get("/is-follower", (req, res) => {
    const followerId = req.query.followerId;
    const UserId = req.query.UserId;
    const query = `SELECT followers from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            results = results[0].followers
            if (results.includes(followerId)) {
                res.status(200).send({ msg: 1 })
            } else {
                res.status(200).send({ msg: 0 })
            }
        }
    })
})

app.get("/is-pending", (req, res) => {
    const connectionId = req.query.connectionId;
    const UserId = req.query.UserId;
    const query = `SELECT pendingRequests from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            results = results[0].pendingRequests
            if (results.includes(connectionId)) {
                res.status(200).send({ msg: 1 })
            } else {
                res.status(200).send({ msg: 0 })
            }
        }
    })
})

//API to post friendRequest
app.post("/connect", (req, res) => {
    const connectionId = req.body.connectionId;
    const UserId = req.body.UserId;
    const query = `UPDATE userdetails SET pendingRequests = CONCAT(pendingRequests, ",${connectionId}") WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send({ msg: results })

        }
    })
})

//API to check if a person is already a friend or not 
app.get("/is-friend", (req, res) => {
    const connectionId = req.query.connectionId;
    const UserId = req.query.UserId;
    const query = `SELECT friends from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            console.log(results)
            results = results[0].friends
            if (results.includes(connectionId)) {
                res.status(200).send({ msg: 1 })
            } else {
                res.status(200).send({ msg: 0 })
            }
        }
    })
})

app.post("/accept-request", (req, res) => {
    const UserId = req.body.UserId;
    const connectionId = req.body.connectionId;
    const query = `UPDATE userdetails SET friends = CONCAT(friends, ",${connectionId}") WHERE UserId="${UserId}";`
    console.log(query)
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            const query = `UPDATE userdetails SET friends = CONCAT(friends, ",${UserId}") WHERE UserId="${connectionId}";`
            connection.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    const query = `UPDATE userdetails SET pendingRequests = REPLACE(pendingRequests, "${connectionId}", '') WHERE UserId="${UserId}";`
                    connection.query(query, (err, results) => {
                        if (err) {
                            res.status(500).send(err);
                        }
                        else {
                            res.status(200).send({ msg: results })                
                            }
                        })
                    }                
            })
        }
    })
})

app.post("/reject-request", (req, res) => {
    const UserId = req.body.UserId;
    const connectionId = req.body.connectionId;
    const query = `UPDATE userdetails SET pendingRequests = REPLACE(pendingRequests, "${connectionId}", '') WHERE UserId="${UserId}";`
    console.log(query)
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send({ msg: results })
        }
    })
})

//API to get pending friendRequests
app.get("/connection-requests", (req, res) => {
    const UserId = req.query.UserId;
    const query = `SELECT pendingRequests from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            const requests = []
            const result = (results[0].pendingRequests).split(',');
            const result_size = result.length;
            result.forEach(element => {
                const query = `SELECT * from userdetails WHERE UserId="${element}";`
                connection.query(query, (err, results) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        requests.push(results)
                        if (result_size == requests.length) {
                            res.status(200).send({ msg: requests })
                        }
                    }
                })
            })

        }
    })
})

//API to get friends
app.get("/friends", (req, res) => {
    const UserId = req.query.UserId;
    const query = `SELECT friends from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            const friends = []
            const result = (results[0].friends).split(',');
            const result_size = result.length;
            result.forEach(element => {
                const query = `SELECT * from userdetails WHERE UserId="${element}";`
                connection.query(query, (err, results) => {
                    friends.push(results)
                    if (result_size === friends.length) {
                        res.status(200).send({ msg: friends })
                    }
                })
            })
        }
    })
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

app.get('/userDetails', (req, res) => {
    const UserId = req.query.UserId;
    const query = `SELECT * from userdetails WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            console.log(results)
            res.status(200).send({ msg: results[0] })
        }
    })
})

app.post('/block', (req, res) => {
    const UserId = req.body.UserId;
    const connectionId = req.body.connectionId;
    const query = `UPDATE userdetails SET friends = REPLACE(friends, "${connectionId}", '') WHERE UserId="${UserId}";`
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            const query = `UPDATE userdetails SET followers = REPLACE(followers, "${connectionId}", '') WHERE UserId="${UserId}";`
            connection.query(query, (err, results) => {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    res.status(200).send({ msg: 'blocked' })
                }
            })
        }
    })

})

app.get('/users/name', (req, res) => {
    const FirstName = req.query.UserName
    const query = `SELECT * FROM userdetails WHERE FirstName LIKE '%${FirstName}%'`
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).send({ msg: results })
        }
    })
})

app.get('/users/location', (req, res) => {
    const location = req.query.location
    const query = `SELECT * FROM userdetails WHERE location LIKE '%${location}%'`
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).send({ msg: results })
        }
    })
})

app.get('/users/news', (req, res) => {
    const title = req.query.title
    const query = `SELECT * FROM news_cards WHERE title LIKE '%${title}%'`
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).send({ msg: results })
        }
    })
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})



