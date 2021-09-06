const express = require("express");
// const bodyParser = require("body-parser");
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
const multer = require("multer");

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

const storage = multer.diskStorage({
  // 存取位置
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  // 文檔名稱
  filename: function (req, file, cb) {
    console.log(file);
    const prefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, prefix + "-" + file.originalname);
  },
});

app.set("view engine", "ejs");
app.set("views", "views");

const fileFilter = (req, file, cb) => {
  console.log("file", file);
  // 判斷type
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.urlencoded({ extended: false }));
app.use(multer({ storage, fileFilter }).single("image"));
// 讀取靜態資源目錄
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

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

// 設置csrf, isLogin中間件
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLogin;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        // 找不到用戶時，清除session資料
        return req.session.destroy((err) => {
          return res.status(404).send("找不到指定用戶");
        });
      }

      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error("找不到指定用戶出錯", err));
    });
});

app.use(authRoutes);
app.use(shopRoutes);
app.use("/admin", adminRoutes);

// 錯誤頁面設置
app.use("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    docTitle: "DB資料庫異常",
    errorMessage: error,
  });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(3000, () => {
      console.log("App listening on port 3000!");
    });
  })
  .catch((err) => console.log("mongoose連結異常", err));
