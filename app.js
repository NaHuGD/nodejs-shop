const express = require("express");
const bodyParser = require("body-parser");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const path = require("path");
const errorController = require("./controllers/error.js");
const mongoose = require("mongoose");
const User = require("./models/user");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
// mongoDb位置
const MONGODB_URI = "mongodb://localhost/nodejs-shop";
// 引入csrf
const csrf = require("csurf");
// 引入表單驗證
const flash = require("express-flash-messages");

const app = express();
// nongodb session實例化
const store = new MongoDBStore({
  url: MONGODB_URI,
  // mongodb資料庫名稱,若不設定會出現先的test db
  databaseName: "nodejs-shop",
  // mongodb資料庫名稱
  collection: "sessions",
});

const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// 設置session
app.use(
  session({
    secret: "session key",
    // resave => 每次請求皆重新設置cookie
    resave: false,
    // 每次請求無論有無設置cookie皆代上
    saveUninitialized: false,
    // 設置client端cookie
    cookie: {
      httpOnly: true,
    },
    // 設置store儲存對象
    store,
  })
);

app.use(csrfProtection);
app.use(flash());


app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findOne()
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

// 設置csrf, isLogin中間件
app.use((req, res, next) => {
 res.locals.isAuthenticated = req.session.isLogin;
 res.locals.csrfToken = req.csrfToken();
 next();
})

app.use(authRoutes);
app.use(shopRoutes);
app.use("/admin", adminRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then((result) => {
    app.listen(3000, () => {
      console.log("App listening on port 3000!");
    });
  })
  .catch((err) => console.log(err));
