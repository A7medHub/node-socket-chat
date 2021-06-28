
const express       = require('express');
const app           = express();
const http          = require('http');
const fs            = require('fs');
const https         = require('https');
var socketIO        = require('socket.io');
var bodyParser      = require("body-parser");
var mysql           = require('mysql');
const port          = 4576;
const URL           = 'wsslna.4hoste.com';

var FCM             = require('fcm-node');
var serverKey       = "AAAA4wXI_9Q:APA91bGaQG1degoGjb2LQNGDHHMjysP27Ur4vf-2rYCJNp-5WKaxEHf43BY5hN_-Zl9o0iq9w3TC22J-ND5y8xijiV5LYCgUBF2u_b33p3GxnVXGHWIpLi8WpOu8uDs4ra6CPu84wL1K";
var fcm             = new FCM(serverKey);

const privateKey    = fs.readFileSync('/var/cpanel/ssl/apache_tls/voo.4hoste.com/combined', 'utf8');
const certificate   = fs.readFileSync('/var/cpanel/ssl/apache_tls/voo.4hoste.com/certificates', 'utf8');
const ca            = fs.readFileSync('/var/cpanel/ssl/apache_tls/voo.4hoste.com/combined', 'utf8');

const httpsServer   = https.createServer({
    key             : privateKey,
    cert            : certificate,
    ca              : ca
}, app).listen(4576, () => {
    console.log('HTTPS Server running on port 4576');
});

const httpServer    = http.createServer(app).listen(9036, (req,res) => {
    console.log('HTTP Server running on port 9036');
});

const io            = socketIO(httpsServer);


/*
For localhost
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var bodyParser      = require("body-parser");
var FCM = require('fcm-node');
var serverKey       = "AAAA4wXI_9Q:APA91bGaQG1degoGjb2LQNGDHHMjysP27Ur4vf-2rYCJNp-5WKaxEHf43BY5hN_-Zl9o0iq9w3TC22J-ND5y8xijiV5LYCgUBF2u_b33p3GxnVXGHWIpLi8WpOu8uDs4ra6CPu84wL1K";
var fcm = new FCM(serverKey);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
var mysql      = require('mysql');
const port = 3000;
const URL = 'http://127.0.0.1:8000';

*/



server.listen(port, () => {
    console.log('listening on *:3000');
});

var subscriptions   = [];
// انشاء الاتصال مع قاعدة البيانات
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'meetUp'
});

connection.connect();

app.use(bodyParser.urlencoded({extended: false, limit: '500mb', parameterLimit: 100000000000}));
    app.use(bodyParser.json());

// ميثود ارسال رسالة
app.post('/send-message',express.urlencoded() ,function (req, res) {
    let userId          = req.body.userId;
    let rId             = req.body.rId;
    let message         =  JSON.stringify(req.body.message);
    if(req.body.type === 'map')
    {
        message = message.replace(/\\n/g, "\\n")
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, "\\&")
            .replace(/\\r/g, "\\r")
            .replace(/\\t/g, "\\t")
            .replace(/\\b/g, "\\b")
            .replace(/\\f/g, "\\f");
         // remove non-printable and other non-valid JSON chars
        message = message.replace(/[\u0000-\u0019]+/g,"");

    }else {
        message =  req.body.message ;
    }
    let seen            = 0;
    let type            = req.body.type === 'map' ? 'map': 'text';
    let roomId          = null;
        //سنتاكد اذا كان هناك محادثه سابقة بين الطرفين او لا
         connection.query("select * from `rooms` where (`s_id` = "+userId+" and `r_id` =  "+rId+") or (`s_id` =  "+rId+" and `r_id` =  "+userId+") order by `id` desc",function (error, results, fields){
            if (error) throw error;

            if(results.length === 0)
            {
                // اذا لم يوجد محادثات سابقة سوف ننشئ واحدة جديدة
                connection.query("INSERT INTO rooms (s_id, r_id) VALUES ("+userId+", "+rId+");", function (err, result) {
                    if (err) throw err;

                    connection.query("SELECT * FROM `rooms` WHERE `id`= LAST_INSERT_ID()", function (err, result) {
                        if (err) throw err;

                         roomId =  JSON.parse(JSON.stringify(result[0]));
                        // connection.end();
                    });
                });

            }else{
                // لكن اذا وجدت محادثة سابقة سنقوم باسترجاعها
                let prepare =  JSON.parse(JSON.stringify(results[0]));
                roomId = prepare.id
            }

            // اذا كان احد الاعضاء قد حظر الاخر سيتم ارسال رسالة ان المحادثة محظورة
             // ممكن تستغني عن دا لو مش عندك ارشيف شات
             connection.query("select * from `deleted_rooms`  WHERE room_id ="+roomId+" ", function (err, result) {
                 if (err) throw err;

                 if(result.length > 0)
                     res.json({ key: 'failed' , 'msg' : 'هذه المحادثة محظورة' });

             });

            //اذا كانت المحادثة في الارشيف سيتم حذفها من الارشيف قبل ارسال الرسالة
             // ممكن تستغني عن دا لو مش عندك حذف شات
             connection.query("delete  from `archived_rooms`  WHERE room_id ="+roomId+" ", function (err, result) {
                 if (err) throw err;
             });

             // الان كل شي بقي جاخز هانرسل فقط الرساله ونرجع النتيجة

             connection.query(`INSERT INTO chats (s_id,message,seen,type,room_id) VALUES ("${userId}","${message}","${seen}","${type}","${roomId}")`, function (err, result) {
                 if (err) throw err;

                 connection.query("SELECT * FROM `chats` LEFT JOIN users   On chats.s_id = users.id   WHERE chats.id= LAST_INSERT_ID() ", function (err, result) {
                     if (err) throw err;

                       let chat   =   JSON.parse(JSON.stringify(result[0]));

                     let response = {
                         id        : chat.id,
                         message   : chat.type === 'map' ? JSON.parse(chat.message) : chat.message,
                         user      : {
                             name  : chat.name,
                             avatar: `https://${URL}/storage/images/users/${chat.avatar}`
                         },
                         time      : new Date().toLocaleTimeString(),
                         type      : chat.type ,
                         alignItem : 'right'
                     };


                     let found = subscriptions.some(item => {
                       return   item.room_id == roomId && item.user_id == userId
                     });

                     if(found)
                     {
                         io.sockets.to(roomId).emit('sendMessage', response);
                     }else{
                         connection.query("SELECT * FROM `user_tokens`   WHERE user_id="+userId+"  ", function (err, results) {
                             if (err) throw err;

                             results.forEach((row) => {
                                 if(chat.type === 'map'){
                                     body_ar  = 'قام بارسال الموقع';
                                     body_en  = 'Send you a location';
                                 }else{
                                     body_ar  = chat.message;
                                     body_en  = chat.message;
                                 }
                             });

                                 var message   = {
                                     to           : row.device_id,
                                     notification : row.device_type === 'ios' ?{
                                         title    : chat.name,
                                         message  : body_ar,
                                         sound    : "default"
                                     } : null,
                                     data: {
                                         title    : chat.name,
                                         body_ar  : body_ar,
                                         body_en  : body_en,
                                         avatar   : `https://${URL}/storage/images/users/${chat.avatar}`,
                                         room_id  : roomId,
                                         key      : 'new_message'
                                     }
                                 };

                             fcm.send(message, function(err, response){
                                 if (err) {
                                      console.log("Something has gone wrong!");
                                 } else {
                                      console.log("Successfully sent with response: ", response);
                                 }
                             });
                         });
                     }
                     res.json({ key: 'success' , 'msg' : '' , 'data' : response });
                 });
             });
    })
})





app.get('/', (req, res) => {
    io.on('connection', (socket) => {
        socket.on('subscribe',function (item){
                if(!containsObject(item,subscriptions))
                {
                     subscriptions.push(item);
                     socket.join(item.room_id);
                    io.sockets.in(item).emit('entered',{
                        msg: item
                    })
                }
            });

            socket.on('unsubscribe',function (item){
                subscriptions.splice(item, 1);
            });
        });
    res.sendFile(__dirname + '/index.html');
});


app.get('/private', (req, res) => {
    io.on('connection', (socket) => {
         socket.on('subscribe',function (item){
            if(!containsObject(item,subscriptions))
            {
                socket.join(item);
                subscriptions.push(item);
                console.log('subscript' , subscriptions);
                io.sockets.in(item).emit('entered',{
                    msg: item
                })
            }
        });
    });
    res.sendFile(__dirname + '/private.html');
});

function containsObject(obj, list) {
    let i;
    for (i = 0; i < list.length; i++)
    {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

 
