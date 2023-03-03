// 웹프레임워크 epress 사용하기위한 선언 코드 
const express = require('express');
const app = express();
//===========================
// 게시글 업로드 날짜 넣기 위해 사용한 라이브러리
const dayjs = require('dayjs');
const day = dayjs();
//===========================
// socket.io 셋팅코드
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
//===========================
app.use(express.urlencoded({ extended: true })) // POST 요청시 필요
app.set('view engine', 'ejs');
app.use('/public', express.static('public'))
// ObjectId 라이브러리
const ObjectId = require('mongodb').ObjectId;
//===========================
// 비밀번호 암호화하기위한 라이브러리 crypto
const crypto = require('crypto');
const createHashedPassword = (password) => {
  return crypto.createHash("sha512").update(password).digest("base64");
};
//===========================
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
//===========================
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
          응답.render(__dirname + '/views/index.ejs', { totalPage: totalPage, posts: 퍼페이지결과, perPage: perPage})
        })
    })
  })
});
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
          응답.render(__dirname + '/views/userIndex.ejs', { 사용자: 요청.user, totalPage: totalPage, posts: 퍼페이지결과, perPage: perPage})
        })
    })
  })
});
//=====================================

//상세보기 페이지
// 로그인 X 사람들에게 보여주는 게시글 목록
app.get('/NoLogIndetail/:id', function (요청, 응답) {
  var title;
  var PostContent;
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    title = 결과.title;
    PostContent = 결과.PostContent;
    응답.render('NoLogIndetail.ejs', { postNum: 결과._id, postTitle: title, postContent: PostContent })
  })
})
//==========================================
// 로그인 O 사람들에게 보여주는 게시글 목록
app.get('/detail/:id', 로그인했냐, function (요청, 응답) {
  var title;
  var PostContent;
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    if(결과.imagename){
      title = 결과.title;
      PostContent = 결과.PostContent;
      imagename = 결과.imagename
      응답.render('detail.ejs', { 사용자: 요청.user, postNum: 결과._id, postTitle: title, postContent: PostContent, imagename: imagename})
    }else{
      title = 결과.title;
      PostContent = 결과.PostContent;
      응답.render('detail.ejs', { 사용자: 요청.user, postNum: 결과._id, postTitle: title, postContent: PostContent })
    }
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
    응답.write("<script>alert('Please Login')</script>")
    응답.write("<script>window.location=\"/login\"</script>")
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


//이미지 업로드
let multer = require('multer');
var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/image') // 이미지가 저장될 경로
    },
    filename : function(req, file,  cb){
        cb(null, file.originalname) // 이미지 저장될때 기존 이름 그대로 사용하겠다는 의미 
    },
    // filefilter를 이용해 업로드한 파일 확장자를 정해주기위한 코드
    // path는 node.js 내장 라이브러리 파일의 경로, 이름, 확장자 등을 알아낼 수 있음.
    filefilter : function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('PNG, JPG만 업로드하세요'))
        }
        callback(null, true)
    },
    // limit는 파일의 사이즈 제한 걸고싶을때 (1024*1024는 1MB)
    limits:{
        fileSize: 1024 * 1024
    }
})
var upload = multer({storage : storage});
//==========================================


// 글 작성페이지 DB에 저장 / 이미지 업로드 기능 추가
app.post('/write', 로그인했냐, upload.single('profile'), function (요청, 응답) {
  db.collection('counter').findOne({ name: '게시물개수' }, function (에러, 결과) {
    // var date = day.format('YYYY-MM-DD HH:mm:ss')
    if (에러) { return console.log(에러) }
    var 총게시물개수 = 결과.totalPost;
    if(요청.file){
      var 저장할거 = {
        _id: 총게시물개수 + 1,
        userId: 요청.user.userId,
        userNick: 요청.user.userNick,
        title: 요청.body.Title,
        imagename: 요청.file.originalname,
        PostContent: 요청.body.PostContent,
        date: day.format('YYYY-MM-DD HH:mm:ss')
      }
    } else{
      var 저장할거 = {
        _id: 총게시물개수 + 1,
        userId: 요청.user.userId,
        userNick: 요청.user.userNick,
        title: 요청.body.Title,
        PostContent: 요청.body.PostContent,
        date: day.format('YYYY-MM-DD HH:mm:ss')
      }
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

//검색기능
var searchWord = 0;
// 누군가 /search 경로로 진입시 List에서 검색했던 검색어와 DB에서 일치하는 title 다 찾아줌
app.get('/search',(요청, 응답) => {
  console.log("1번글 입력 = "+요청.query.value);
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: 요청.query.value,
          path: 'title'  // title, date 둘다 찾고 싶으면 ['title', 'date']
        }
      }
    },
    // { $sort : {_id : 1}}, // _id 순서로 오름차순, -1은 내림차순
    // { $limit : 10 }, // 10개만 가져와주세요
    // { $project : { title : 1, _id : 0, score: { $meta: "searchScore"}}} // 1은 가져오고 0은 안가져오고, score는 mongoDB가 검색어 적합도에대한 점수를 나타내줌
  ]
  console.log(검색조건)
  db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
    searchWord = 결과;
    console.log("서치워드 = "+ 결과)
    응답.redirect('/indexList');
  })
})

// 누군가 /usersearch 경로로 진입시 List에서 검색했던 검색어와 DB에서 일치하는 title 다 찾아줌
app.get('/usersearch',(요청, 응답) => {
  console.log("1번글 입력 = "+요청.query.value);
  var 검색조건 = [
      {
          $search: {
            index: 'titleSearch',
            text: {
              query: 요청.query.value,
              path: 'title'  // title, date 둘다 찾고 싶으면 ['title', 'date']
            }
          }
        },
        // { $sort : {_id : 1}}, // _id 순서로 오름차순, -1은 내림차순
        // { $limit : 10 }, // 10개만 가져와주세요
        // { $project : { title : 1, _id : 0, score: { $meta: "searchScore"}}} // 1은 가져오고 0은 안가져오고, score는 mongoDB가 검색어 적합도에대한 점수를 나타내줌
  ]
  console.log(검색조건)
  db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
      searchWord = 결과;
      console.log("서치워드 = "+ 결과)
  응답.redirect('/userindexList');
  })
})

// 누군가 /indexList 경로로 진입하면 indexList 페이지 보여줌
app.get('/indexList', function(요청,응답){
    응답.render('indexList.ejs', { searchWord: searchWord })
})
// 누군가 /userindexList 경로로 진입하면 indexList 페이지 보여줌
app.get('/userindexList', function(요청,응답){
    응답.render('userindexList.ejs', {사용자: 요청.user , searchWord: searchWord })
})
//==========================================


