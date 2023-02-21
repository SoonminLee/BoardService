const express = require('express');
const app = express();
const dayjs = require('dayjs');
const day = dayjs();


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

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
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
  var page = Number(요청.query.pageNum || 1);
  var perPage = Number(요청.query.perPage || 10);

  var TotalPost;
  var totalPage;
  db.collection('post').find().toArray(function(에러,결과){
    TotalPost = 결과.length
    db.collection('counter').updateOne({name:"게시물개수"}, {$set: {totalPost: TotalPost}},function(에러,결과){
      // console.log('index에서 총게시물수 업데이트 완료')
      db.collection('post').find().
        skip(perPage * (page - 1)).
        limit(perPage).toArray(function (에러, 퍼페이지결과) {
          totalPage = Math.ceil(TotalPost / perPage);
          응답.render(__dirname + '/views/index.ejs', { totalPage: totalPage, posts: 퍼페이지결과, })
        })
    })
  })
});
//===========================

// 홈페이지로 이동
// app.get('/', function (요청, 응답) {
//   db.collection('post').find().toArray(function (에러, 결과) {
//     응답.render(__dirname + '/views/index.ejs',{ posts: 결과 })
// });
// });
//===========================

// 작성페이지로 이동
app.get('/write', 로그인했냐, function (요청, 응답) {
  응답.render(__dirname + '/views/write.ejs', { 사용자: 요청.user })
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
// /userIndex 페이지로 이동(로그인한사람만 입장)

app.get('/userIndex', 로그인했냐, function (요청, 응답) {
  var page = Number(요청.query.pageNum || 1);
  var perPage = Number(요청.query.perPage || 10);
  var totalPage;
  var TotalPost;
  db.collection('post').find().toArray(function(에러,결과){
    TotalPost = 결과.length
    db.collection('counter').updateOne({name:"게시물개수"}, {$set: {totalPost: TotalPost}},function(에러,결과){
      // console.log('userIndex에서 총게시물수 업데이트 완료')
      db.collection('post').find().
        skip(perPage * (page - 1)).
        limit(perPage).toArray(function (에러, 퍼페이지결과) {
          totalPage = Math.ceil(TotalPost / perPage);
          응답.render(__dirname + '/views/userIndex.ejs', { 사용자: 요청.user, totalPage: totalPage, posts: 퍼페이지결과, })
        })
    })
  })
});
//=====================================


//상세보기 페이지
// detail로 접속하면 detail.ejs 보여주십쇼
app.get('/detail/:id', 로그인했냐, function (요청, 응답) {
  var title;
  var PostContent;
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    title = 결과.title;
    PostContent = 결과.PostContent;
    응답.render('detail.ejs', { 사용자: 요청.user, postNum: 결과._id, postTitle: title, postContent: PostContent })
  })
})
//==========================================
// 글 삭제하기 기능
app.delete('/delete', 로그인했냐, function (요청, 응답) {
  // console.log('유저아이디' + 요청.user.userId)
  var 삭제할글번호 = parseInt(요청.body._id);
  var 삭제할데이터 = { _id: 삭제할글번호, userId: 요청.user.userId }
  db.collection('post').deleteOne(삭제할데이터, function (에러, 결과) {
    if (에러) { return console.log(에러) }
    응답.send('삭제완료')
  })
})
//==========================================
// 글 수정하기 기능
app.put('/edit', 로그인했냐, function (요청, 응답) {
  // 폼에 담긴 제목과 날짜 데이터를 db.collection에 업데이트함
  var 수정할글번호 = parseInt(요청.body._id)
  var 수정할데이터 = { 
    title: 요청.body.editTitle,
    PostContent: 요청.body.editPostContent
  }
  db.collection('post').
  updateOne({ _id: 수정할글번호, userId: 요청.user.userId },
    { $set: 수정할데이터 }, function (에러, 결과) {
      if (에러) { return console.log(에러) }
      응답.send('수정완료');
      })
})
//==========================================

// login 기능
app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (요청, 응답) {
  // 1. 로그인하면 아이디 비번 검사
  응답.redirect('/userIndex')

})
// logout 기능
app.get('/logout', function (req, res) {
  // req.logout();
  // res.redirect('/');

  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
})
//==========================================

function 로그인했냐(요청, 응답, next) {
  if (요청.user) {
    next()
  } else {
    응답.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    응답.write("<script>alert('로그인하고 오십시오')</script>")
    응답.write("<script>window.location=\"http://localhost:8080/login\"</script>")
  }
}

// LocalStrategy 인증방법
passport.use(new LocalStrategy({
  usernameField: 'userId',
  passwordField: 'userPw', //  유저가 입력한 아이디/비번 항목이 뭔지 정의(name속성)
  session: true, // 로그인 후 세션을 저장할것인지
  passReqToCallback: false, // 아이디/비번 말고도 다른 정보 검증시 true로 바꾸고 사용가능
}, function (입력한아이디, 입력한비번, done) {  // 여기부터 끝까지는 아이디/비번을 DB와 비교하여 검증하는 코드
  // console.log('입력한아이디랑입력한비번'+입력한아이디, 입력한비번);
  db.collection('user').findOne({ userId: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)
    // 여기부터 중요! DB에 아이디가 없을때 실행하고, 있긴한데 비번이 틀렸을때 실행(if문으로 분기)
    // done(서버에러 : 보통 null , 성공시사용자DB데이터 : 아이디/비번 안맞을때 false, 에러메세지)
    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })

    if (createHashedPassword(입력한비번) == 결과.userPw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

// id를 이용하여 세션을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
  done(null, user.userId)
})

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요(마이페이지 접속시 발동)
passport.deserializeUser(function (아이디, done) {
  // deserializeUser() : DB에서 위에 있던 user.id로 유저를 찾은 뒤에 유저 정보를 아래 done의 중괄호에 넣음
  db.collection('user').findOne({ userId: 아이디 }, function (에러, 아이디결과) {
    done(null, 아이디결과)
  })
})
passport.deserializeUser(function (닉네임, done) {
  db.collection('user').findOne({ userNick: 닉네임 }, function (에러, 닉네임결과) {
    done(null, 닉네임결과)
  })
})
//==========================================

// 글 작성페이지 DB에 저장
app.post('/write', 로그인했냐, function (요청, 응답) {
  db.collection('counter').findOne({ name: '게시물개수' }, function (에러, 결과) {
    // var date = day.format('YYYY-MM-DD HH:mm:ss')
    if (에러) { return console.log(에러) }
    var 총게시물개수 = 결과.totalPost;

    var 저장할거 = {
      _id: 총게시물개수 + 1,
      userId: 요청.user.userId,
      userNick: 요청.user.userNick,
      title: 요청.body.Title,

      PostContent: 요청.body.PostContent,
      date: day.format('YYYY-MM-DD HH:mm:ss')
    }
    db.collection('post').insertOne(저장할거, function (에러, 결과) {
      console.log('저장완료');
      db.collection('counter').updateOne({ name: '게시물개수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) { return console.log(에러) }
        console.log('게시물 개수 + 1')
        응답.redirect('/userIndex')
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
    // console.log('아이디결과' + 아이디결과)
    db.collection('user').findOne({ userNick: 닉네임 }, function (에러, 닉네임결과) {
      // console.log('닉네임결과' + 닉네임결과)
      db.collection('user').findOne({ userEmail: 이메일 }, function (에러, 이메일결과) {
        // console.log('이메일결과' + 이메일결과)
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



