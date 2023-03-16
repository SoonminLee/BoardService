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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
//===========================
//이메일 전송을위한 라이브러리(비밀번호찾기에 사용)
const nodemailer = require('nodemailer');
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
app.get('/', async function (요청, 응답) {
  var page = Number(요청.query.pageNum || 1);
  var perPage = Number(요청.query.perPage || 10);
  var totalPage;
  var TotalPost;
  TotalPost = await db.collection('post').estimatedDocumentCount();
  db.collection('post').find().
    skip(perPage * (page - 1)).
    limit(perPage).toArray(function (에러, 퍼페이지결과) {
      totalPage = Math.ceil(TotalPost / perPage);
      var num = page === 1 ? 0 : (page - 1) * perPage;
      응답.render(__dirname + '/views/index.ejs', { totalPage: totalPage, num: num + 1, posts: 퍼페이지결과, perPage: perPage })
    })
})

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

// app.get('/userIndex', 로그인했냐, function (요청, 응답) {
//   var page = Number(요청.query.pageNum || 1);
//   var perPage = Number(요청.query.perPage || 10);
//   db.collection('counter').findOne({ name: "게시물개수" }, function (에러, 결과) {
//     TotalPost = 결과.totalPost;
//     db.collection('post').find().
//       skip((page - 1) * perPage).
//       limit(perPage).toArray(function (에러, 퍼페이지결과) {
//         var totalPage = Math.ceil(TotalPost / perPage)
//         var num = page === 1 ? 0 : (page - 1) * perPage;
//         응답.render(__dirname + '/views/userIndex.ejs', { 사용자: 요청.user, num: num + 1, totalPage: totalPage, posts: 퍼페이지결과, perPage: perPage })
//       })
//   })
// })
//=====================================
// /userIndex 페이지로 이동(로그인한사람만 입장)

app.get('/userIndex', 로그인했냐, async function (요청, 응답) {
  var page = Number(요청.query.pageNum || 1);
  var perPage = Number(요청.query.perPage || 10);
  var TotalPost;
  TotalPost = await db.collection('post').estimatedDocumentCount();
  db.collection('post').find().
    skip((page - 1) * perPage).
    limit(perPage).toArray(function (에러, 퍼페이지결과) {
      var totalPage = Math.ceil(TotalPost / perPage)
      var num = page === 1 ? 0 : (page - 1) * perPage;
      응답.render(__dirname + '/views/userIndex.ejs', { 사용자: 요청.user, num: num + 1, totalPage: totalPage, posts: 퍼페이지결과, perPage: perPage })
    })
})

//=====================================

//상세보기 페이지
// 로그인 X 사람들에게 보여주는 게시글 목록
app.get('/NoLogIndetail/:id', function (요청, 응답) {
  var title;
  var PostContent;
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 포스트결과) {
    db.collection('comment').find({ PostId: parseInt(요청.params.id) }).toArray(function (댓글에러, 댓글결과) {

      if (댓글결과) {
        if (포스트결과.imagename) {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          imagename = 포스트결과.imagename;
          응답.render(__dirname + '/views/NoLogIndetail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/' + imagename,
              comment: 댓글결과,
            })
        } else {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          응답.render(__dirname + '/views/NoLogIndetail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/이미지없음.png',
              comment: 댓글결과,
            })
        }
      } else {
        if (포스트결과.imagename) {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          imagename = 포스트결과.imagename;
          응답.render(__dirname + '/views/NoLogIndetail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/' + imagename,
              comment: 댓글결과,
            })
        } else {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          응답.render(__dirname + '/views/NoLogIndetail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/이미지없음.png',
              comment: 댓글결과,
            })
        }
      }
    })
  })
})
//==========================================
// 로그인 O 사람들에게 보여주는 게시글 목록
app.get('/detail/:id', 로그인했냐, function (요청, 응답) {
  var title;
  var PostContent;
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 포스트결과) {
    if (에러) { return console.log(에러) }
    db.collection('comment').find({ PostId: parseInt(요청.params.id) }).toArray(function (댓글에러, 댓글결과) {
      if (댓글결과) {
        if (포스트결과.imagename) {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          imagename = 포스트결과.imagename;
          응답.render(__dirname + '/views/detail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              WriterId: 포스트결과.userId,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/' + imagename,
              comment: 댓글결과,
            })
        } else {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          응답.render(__dirname + '/views/detail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              WriterId: 포스트결과.userId,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/이미지없음.png',
              comment: 댓글결과,
            })
        }
      } else {
        if (포스트결과.imagename) {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          imagename = 포스트결과.imagename;
          응답.render(__dirname + '/views/detail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              WriterId: 포스트결과.userId,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/' + imagename,
              comment: 댓글결과,
            })
        } else {
          title = 포스트결과.title;
          PostContent = 포스트결과.PostContent;
          응답.render(__dirname + '/views/detail.ejs',
            {
              사용자: 요청.user,
              postNum: 포스트결과._id,
              WriterId: 포스트결과.userId,
              postTitle: title,
              postContent: PostContent,
              imagename: '/public/image/이미지없음.png',
              comment: 댓글결과,
            })
        }
      }
    })
  })
})
//==========================================
// 댓글기능
app.post('/commentWrite', 로그인했냐, async function (요청, 응답) {
  // var TotalComment;
  // TotalComment = await db.collection('comment').estimatedDocumentCount();
  db.collection('counter').findOne({ name: "댓글개수" }, function (에러, 결과) {
    var 댓글총개수 = 결과.totalComment;
    var 저장할거 = {
      _id: 댓글총개수 + 1,
      PostId: parseInt(요청.body.postId),
      comment: 요청.body.comment,
      userId: 요청.user.userId,
      userNick: 요청.user.userNick,
      date: day.format('YYYY-MM-DD HH:mm:ss')
    }
    db.collection('comment').insertOne(저장할거, function (에러, 결과) {
      db.collection('counter').updateOne({ name: '댓글개수' }, { $inc: { totalComment: 1 } }, function (에러, 결과) {
        console.log('저장완료');
        응답.send('댓글작성완료')
      })
    })
  });
})
//==========================================
//댓글 수정 기능
app.put('/commentEdit', 로그인했냐, function (요청, 응답) {
  var 글번호 = parseInt(요청.body.postId);
  var 댓글내용 = 요청.body.comment
  var 댓글번호 = parseInt(요청.body.commentNum)
  var 수정할데이터 = {
    comment: 댓글내용
  }
  db.collection('comment').updateOne({ PostId: 글번호, _id: 댓글번호, userId: 요청.user.userId }, { $set: 수정할데이터 }, function (에러, 결과) {
    if (결과.modifiedCount == 1) {
      응답.send('댓글수정완료')
    } else {
      응답.send('댓글수정실패')
    }
  })
})

//==========================================
//댓글 삭제 기능
app.delete('/commentDelete', 로그인했냐, function (요청, 응답) {
  var 글번호 = parseInt(요청.body.postId);
  var 댓글번호 = parseInt(요청.body.commentNum)
  var 삭제할댓글 = { PostId: 글번호, _id: 댓글번호, userId: 요청.user.userId }
  db.collection('comment').deleteOne(삭제할댓글, function (에러, 결과) {
    if (결과.deletedCount == 1) {
      응답.send('댓글삭제완료')
    } else {
      응답.send('댓글삭제실패')
    }
  })
})

//==========================================
// 글 삭제하기 기능
app.delete('/delete', 로그인했냐, function (요청, 응답) {
  // console.log('유저아이디' + 요청.user.userId)
  var 삭제할글번호 = parseInt(요청.body._id);
  console.log('삭제할 글번호 = ' + 삭제할글번호)
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
  db.collection('post').updateOne({ _id: 수정할글번호, userId: 요청.user.userId },
    { $set: 수정할데이터 }, function (에러, 결과) {
      if (에러) { return console.log(에러) }
      응답.send('수정완료');
    })
})
//==========================================

// login 기능
app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login'
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

// 인증관련

// id를 이용하여 세션을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
  done(null, user.userId)
})

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요
passport.deserializeUser(function (아이디, done) {
  // deserializeUser() : DB에서 위에 있던 user.id로 유저를 찾은 뒤에 유저 정보를 아래 done의 중괄호에 넣음
  db.collection('user').findOne({ userId: 아이디 }, function (에러, 아이디결과) {
    done(null, 아이디결과)
  })
})

// 로컬로그인
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



//구글 로그인
// GoogleStrategy 인증방법
passport.use(
  new GoogleStrategy({
    clientID: '403235330551-kicomc6gug5h9b19f07jpbo5pp96g2g6.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:8080/auth/google/callback',
  },
  function (request, accessToken, refreshToken, profile, done) {
    const { email, name } = profile._json;
      // console.log('구글이메일 = ' + email)
      // console.log('구글네임 = ' + name)
      var user;
      db.collection('user').findOne({ userEmail: email }, function (에러, 결과) {
        // console.log('결과 = '+JSON.stringify(결과))
        user = 결과;
        if (user) {
          // 이미 가입된 구글 프로필이면 성공
          return done(null, user);
        } else {
          // 가입되지 않는 유저면 회원가입 시키고 로그인을 시킨다
          db.collection('counter').findOne({ name: "유저수" }, function (에러, 유저수결과) {
            var 유저수 = 유저수결과.totalUser;
            db.collection('counter').updateOne({ name: '유저수' }, { $inc: { totalUser: 1 } }, function (에러, 결과) {
              db.collection('user').insertOne({ 
                _id: 유저수 + 1, 
                userName: name, 
                userId: email, 
                userNick: name, 
                userEmail: email });
              })
            })
          }
          return done(null, user);
        })
      }
      )
      );
      
// 프로파일과 이메일 정보를 받는다.
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
      
//위에서 구글 서버 로그인이 되면, redirect url 설정에 따라 이쪽 라우터로 오게 된다. 인증 코드를 박게됨
app.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/userIndex',
  failureRedirect: '/login',
}))

//==========================================

//이미지 업로드
let multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/image') // 이미지가 저장될 경로
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // 이미지 저장될때 기존 이름 그대로 사용하겠다는 의미 
  },
  // filefilter를 이용해 업로드한 파일 확장자를 정해주기위한 코드
  // path는 node.js 내장 라이브러리 파일의 경로, 이름, 확장자 등을 알아낼 수 있음.
  filefilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(new Error('PNG, JPG만 업로드하세요'))
    }
    callback(null, true)
  },
  // limit는 파일의 사이즈 제한 걸고싶을때 (1024*1024는 1MB)
  limits: {
    fileSize: 1024 * 1024
  }
})
var upload = multer({ storage: storage });
//==========================================


// 글 작성페이지 DB에 저장 / 이미지 업로드 기능 추가
app.post('/write', 로그인했냐, upload.single('profile'), function (요청, 응답) {
  db.collection('counter').findOne({ name: '게시물개수' }, function (에러, 결과) {
    // var date = day.format('YYYY-MM-DD HH:mm:ss')
    if (에러) { return console.log(에러) }
    var 총게시물개수 = 결과.totalPost;
    if (요청.file) {
      var 저장할거 = {
        _id: 총게시물개수 + 1,
        userId: 요청.user.userId,
        userNick: 요청.user.userNick,
        title: 요청.body.Title,
        imagename: 요청.file.originalname,
        PostContent: 요청.body.PostContent,
        date: day.format('YYYY-MM-DD HH:mm:ss')
      }
    } else {
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
  db.collection('counter').findOne({ name: "유저수" }, function (에러, 유저수결과) {
    var 유저수 = 유저수결과.totalUser;
    db.collection('user').findOne({ userId: 아이디 }, function (에러, 아이디결과) {
      db.collection('user').findOne({ userNick: 닉네임 }, function (에러, 닉네임결과) {
        db.collection('user').findOne({ userEmail: 이메일 }, function (에러, 이메일결과) {
          db.collection('counter').updateOne({ name: '유저수' }, { $inc: { totalUser: 1 } }, function (에러, 결과) {
            if (아이디결과 == null && 닉네임결과 == null && 이메일결과 == null) {
              db.collection('user').insertOne({ _id: 유저수 + 1, userName: 이름, userId: 아이디, userPw: createHashedPassword(비밀번호), userNick: 닉네임, userEmail: 이메일 }, function (에러, 결과) { });
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
  })
})
//==========================================

//검색기능
var searchWord = 0;
// 누군가 /search 경로로 진입시 List에서 검색했던 검색어와 DB에서 일치하는 title 다 찾아줌
app.get('/search', (요청, 응답) => {
  console.log("1번글 입력 = " + 요청.query.value);
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
  db.collection('post').aggregate(검색조건).toArray((에러, 결과) => {
    searchWord = 결과;
    console.log("서치워드 = " + 결과)
    응답.redirect('/indexList');
  })
})

// 누군가 /usersearch 경로로 진입시 List에서 검색했던 검색어와 DB에서 일치하는 title 다 찾아줌
app.get('/usersearch', (요청, 응답) => {
  console.log("1번글 입력 = " + 요청.query.value);
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
  db.collection('post').aggregate(검색조건).toArray((에러, 결과) => {
    searchWord = 결과;
    console.log("서치워드 = " + 결과)
    응답.redirect('/userindexList');
  })
})

// 누군가 /indexList 경로로 진입하면 indexList 페이지 보여줌
app.get('/indexList', function (요청, 응답) {
  응답.render('indexList.ejs', { searchWord: searchWord })
})
// 누군가 /userindexList 경로로 진입하면 indexList 페이지 보여줌
app.get('/userindexList', function (요청, 응답) {
  응답.render('userindexList.ejs', { 사용자: 요청.user, searchWord: searchWord })
})
//==========================================

//회원정보페이지
app.get('/userEdit', function (요청, 응답) {
  db.collection('user').findOne({ userId: 요청.user.userId }, function (에러, 결과) {
    응답.render('userEdit.ejs', { 사용자: 요청.user, 유저아이디: 결과.userId, 유저네임: 결과.userName, 유저닉: 결과.userNick, 유저이메일: 결과.userEmail })
  })
})
//==========================================

//회원정보 수정
app.put('/userEdit', 로그인했냐, function (요청, 응답) {
  var 이름 = 요청.body.이름;
  var 비밀번호 = 요청.body.비밀번호;
  var 새비밀번호 = 요청.body.새비밀번호;
  var 닉네임 = 요청.body.닉네임;
  var 이메일 = 요청.body.이메일;
  var 수정정보 = {
    userName: 이름,
    userPw: createHashedPassword(새비밀번호),
    userNick: 닉네임,
    userEmail: 이메일
  }
  // 기존의 아이디면 넘어가고 아니라면 아이디중복체크(닉네임, 이메일 동일)
  db.collection('user').findOne({ userId: 요청.user.userId }, function (에러, 결과) {
    if (createHashedPassword(비밀번호) == 결과.userPw) {
      db.collection('user').findOne({ userNick: 닉네임, userId: { $ne: 요청.user.userId } }, function (에러, 닉네임결과) {
        db.collection('user').findOne({ userEmail: 이메일, userId: { $ne: 요청.user.userId } }, function (에러, 이메일결과) {
          console.log("닉넴결과 = " + 닉네임결과, " 이메일결과 = " + 이메일결과)

          if (닉네임결과 == null && 이메일결과 == null) {
            db.collection('user').updateOne({ userId: 요청.user.userId }, { $set: 수정정보 }, function (에러, 결과) {
              응답.send("성공")
            })
          } else if (닉네임결과 != null) {
            응답.send("중복Nick")
          } else if (이메일결과 != null) {
            응답.send("중복Email")
          }
        })
      })
    } else {
      응답.send('비밀번호틀림')
    }
  })
})
//==========================================

//회원정보삭제
app.delete('/userDelete', 로그인했냐, function (요청, 응답) {
  var 아이디 = 요청.body.아이디;
  var 비밀번호 = 요청.body.비밀번호;
  db.collection('user').findOne({ userId: 요청.user.userId }, function (에러, 결과) {
    if (createHashedPassword(비밀번호) == 결과.userPw) {
      db.collection('user').deleteOne({ userId: 아이디 }, function (에러, 결과) {
        응답.send("회원삭제완료")
      })
    } else {
      응답.send('비밀번호틀림')
    }
  })
})
//==========================================

// 비밀번호 찾기
var variable = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z".split(",");
var 임시비밀번호 = createRandomPassword(variable, 8);


//비밀번호 랜덤 함수
function createRandomPassword(variable, passwordLength) {
  var randomString = "";
  for (var j = 0; j < passwordLength; j++)
    randomString += variable[Math.floor(Math.random() * variable.length)];
  return randomString
}

app.post('/findPw', function (요청, 응답) {
  var 아이디 = 요청.body.아이디;
  db.collection('user').findOne({ userId: 아이디 }, function (에러, 결과) {
    var 유저이메일 = 결과.userEmail
    var 수정정보 = {
      userPw: createHashedPassword(임시비밀번호)
    }
    db.collection('user').updateOne({ userId: 아이디 }, { $set: 수정정보 }, function (에러, 결과) {

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: { // 이메일을 보낼 계정 데이터 입력
          user: 'soonmin07@gmail.com',
          pass: 'smwhyytnnddetece',
        },
      });
      const emailOptions = { // 옵션값 설정
        from: 'BoardService@gmail.com',
        to: 유저이메일,
        subject: 'BoardService에서 임시비밀번호를 알려드립니다.',
        html:
          "<h1 >BoardService에서 새로운 비밀번호를 알려드립니다.</h1> <h2> 비밀번호 : " + 임시비밀번호 + "</h2>"
          + '<h3 style="color: crimson;">임시 비밀번호로 로그인 하신 후, 반드시 비밀번호를 수정해 주세요.</h3>'
        ,
      };
      transporter.sendMail(emailOptions, (err, info) => {
        if (err) {
          console.log("err = ", err);
          return
        }
        console.log("ok", info);
      }); //전송
    })
  })
  응답.send('메일발송성공')
})
//==========================================


//chat GPT

app.get("/chatGPT", function(요청, 응답){
응답.render(__dirname + '/views/chatGPT.ejs', {사용자: 요청.user})
})

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);
app.post('/chatGPT', async function(요청, 응답){
  var 질문내용 = 요청.body.question;
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: 질문내용,
    max_tokens: 300,
    temperature: 0,
  });
  
  if (response.data) {
    if (response.data.choices) {
      응답.send(response.data.choices[0].text)
    }
  }
  
})


//==========================================
