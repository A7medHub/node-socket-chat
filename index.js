


const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
var mysql      = require('mysql');

const port = 3000;
const URL = 'http://127.0.0.1:8000';




server.listen(port, () => {
    console.log('listening on *:3000');
});

// انشاء الاتصال مع قاعدة البيانات
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'meetUp'
});

connection.connect();



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
                         id     : chat.id,
                         message: chat.type === 'map' ? JSON.parse(chat.message) : chat.message,
                         user   : {
                             name  : chat.name,
                             avatar: `https://${URL}/storage/images/users/${chat.avatar}`
                         },
                         time     :     new Date().toLocaleTimeString(),
                         type     : chat.type ,
                         alignItem: 'right'
                     };

                     //io.sockets.emit('sendMessage',response);

                     io.sockets.to(roomId).emit('sendMessage', response);
                     res.json({ key: 'success' , 'msg' : '' , 'data' : response });
                 });
             });
    })
})




app.get('/', (req, res) => {
    io.on('connection', (socket) => {
        socket.on('subscribe',function (room){
            socket.join(room);
            io.sockets.in(room).emit('entered',{mes:"you are added into " + room})
        });
    });
    res.sendFile(__dirname + '/index.html');
});

app.get('/private', (req, res) => {
    io.on('connection', (socket) => {
        socket.on('subscribe',function (room){
            socket.join(room);
            io.sockets.in(room).emit('entered',{mes:"you are added into " + room})
        });
    });
    res.sendFile(__dirname + '/private.html');
});



 
