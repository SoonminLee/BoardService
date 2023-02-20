const express = require('express');
const app = express();

// socket.io 셋팅코드
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.urlencoded({ extended: true })) // POST 요청시 필요
app.set('view engine', 'ejs');
app.use('/public', express.static('public'))
const ObjectId = require('mongodb').ObjectId;
const crypto = require('crypto');
const createHashedPassword = (password) => {
  return crypto.createHash("sha512").update(password).digest("base64");
};

// passport 라이브러리 사용하기위한 코드
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
//===========================


// mongoDB 접속 코드
var db;
const url = `mongodb+srv://admin:xkfanem1!@cluster0.8wei56h.mongodb.net/?retryWrites=true&w=majority`
const options = { useUnifiedTopology: true };
const MongoClient = require('mongodb').MongoClient
MongoClient.connect(url, function (에러, client) {

  db = client.db('BoardService');

  http.listen(8080, function () {
    console.log('listening on 8080');
  })
})

// 홈페이지로 이동
app.get('/', function (요청, 응답) {
  응답.render(__dirname + '/views/index.ejs')
});
//===========================

// 작성페이지로 이동
app.get('/write', function (요청, 응답) {
  응답.render(__dirname + '/views/write.ejs')
});
//=====================================

// /signUp 페이지로 이동
app.get('/signUp', function (요청, 응답) {
  응답.render('signUp.ejs')
})
//=====================================
// /login 페이지로 이동
app.get('/login', function (요청, 응답) {
  응답.render('login.ejs')
})
//=====================================

// 작성페이지 DB에 저장
app.post('/write', function (요청, 응답) {
  db.collection('counter').findOne({ name: '게시물개수' }, function (에러, 결과) {
    if (에러) { return console.log(에러) }
    var 총게시물개수 = 결과.totalPost;
    var 저장할거 = { _id: 총게시물개수 + 1, title: 요청.body.Title, PostContent: 요청.body.PostContent }
    db.collection('post').insertOne(저장할거, function (에러, 결과) {
      console.log('저장완료');
      db.collection('counter').updateOne({ name: '게시물개수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) { return console.log(에러) }
        console.log('게시물 개수 + 1')
        응답.redirect('/')
      })
    });
  });
});
//==========================================

// 회원가입하면 DB에 저장
app.post('/signUp', function (요청, 응답) {
  var 이름 = 요청.body.이름;
  var 아이디 = 요청.body.아이디;
  var 비밀번호 = 요청.body.비밀번호;
  var 닉네임 = 요청.body.닉네임;
  var 이메일 = 요청.body.이메일;
  console.log('서버단 아디닉넴이멜' + 아이디, 닉네임, 이메일);
  // console.log(이름,아이디,비밀번호,닉네임,이메일)
  db.collection('user').findOne({ userId: 아이디 }, function (에러, 아이디결과) {
    console.log('아이디결과' + 아이디결과)
    db.collection('user').findOne({ userNick: 닉네임 }, function (에러, 닉네임결과) {
      console.log('닉네임결과' + 닉네임결과)
      db.collection('user').findOne({ userEmail: 이메일 }, function (에러, 이메일결과) {
        console.log('이메일결과' + 이메일결과)
        if (아이디결과 == null && 닉네임결과 == null && 이메일결과 == null) {
          db.collection('user').insertOne({ userName: 이름, userId: 아이디, userPw: createHashedPassword(비밀번호), userNick: 닉네임, userEmail: 이메일 }, function (에러, 결과) { });
          응답.send("성공")
        } else if (아이디결과 != null) {
          응답.send("중복ID")
        } else if (닉네임결과 != null) {
          응답.send("중복Nick")
        } else if (이메일결과 != null) {
          응답.send("중복Email")
        }
      })
    })
  })
})
//==========================================
