let express = require('express');
let bodyParser = require('body-parser');
let svgCaptcha = require('svg-captcha');
let path = require('path');
let session = require('express-session');
// 导入自己的首页路由
let indexRoute = require(path.join(__dirname,'/route/indexRoute'));
let app = express();

let myT = require(path.join(__dirname, 'tools/myT.js'));
// let MongoClient = require('mongodb').MongoClient;
// let url = 'mongodb://localhost:27017';

// // Database Name
// let dbName = 'SZHM19';

//模板引擎
app.engine('art', require('express-art-template'));
app.set('views', '/static/views');
//中间件body-parse
app.use(bodyParser.urlencoded({
    extended: false
}));
//中间件express-session
app.use(session({
    secret: 'keyboard cat',
}))

//挂载首页路由
app.use('/index',indexRoute);

app.use(express.static('static'));
app.get('/login', (req, res) => {
    //读取文件并返回
    res.sendfile(path.join(__dirname, 'static/views/login.html'));
});
app.get('/login/captcha', function (req, res) {
    var captcha = svgCaptcha.create();
    //保存一个验证码session
    req.session.captcha = captcha.text;
    // console.log(captcha.text);

    res.type('svg');
    res.status(200).send(captcha.data);
});
//登录页提交表单
app.post('/login', (req, res) => {
    let username = req.body.username;
    let userpass = req.body.userpass;
    let code = req.body.code;
    // console.log(code);
    console.log(req.session);
    if (code == req.session.captcha) {
        myT.find('user', {
            username,
            userpass
        }, (err, docs) => {
            if (docs.length == 1) {
                req.session.userInfo = {
                    username,
                    userpass
                }
                res.redirect('/index');
            } else {
                // console.log('进来')
                res.setHeader('content-type', 'text/html');
                res.send("<script>alert('用户名或密码错误');window.location.href='/login'</script>");
            }
        })
    } else {
        myT.mess(res,'验证码错误','/login')
    }
})
//主页路由器
app.get('/index', (req, res) => {
    //去首页,首先判断是否有session,没有打回登录页
    if (req.session.userInfo) {
        res.sendFile(path.join(__dirname, 'static/views/index.html'))
    } else {
        res.setHeader('content-type', 'text/html');
        res.send("<script>alert('请登录');window.location.href='/login'</script>");
    }

})
//登出路由器
app.get('/loginout', (req, res) => {
    delete req.session.userInfo;
    res.redirect('/login');
})
//登录注册页
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/views/register.html'))
})
//注册页提交表单
app.post('/register', (req, res) => {
    // console.log(req.body);
    let username = req.body.username;
    let userpass = req.body.userpass;
    myT.find('user', {
        username
    }, (err, docs) => {
        if (docs.length == 0) {
            myT.insert('user', {
                username,
                userpass
            }, (err, result) => {
                if (!err) {
                    res.redirect('/login')
                }
            })
        } else {
            myT.mess(res, '用户名已存在', '/register')
        }
    })
    // MongoClient.connect(url, (err, client) => {
    //     let db = client.db(dbName);
    //     let collection = db.collection('user');
    //     collection.find({
    //         username
    //     }).toArray((err, docs) => {
    //         if(err)console.log(err);
    //         // console.log(docs);
    //         if (docs.length == 0) {
    //             collection.insertOne(
    //                 {
    //                     username,
    //                     userpass
    //                 }
    //             , (err, result) => {
    //                 // console.log('111')
    //                 res.redirect('/login')
    //                 client.close();
    //             });
    //         } else {
    //             res.send("<script>alert('用户名已存在');window.location.href='/register'</script>")
    //         }
    //     });

    // });

})

app.listen(8848, '127.0.0.1', () => {
    console.log('success')
})