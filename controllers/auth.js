const User = require("../models/user");
const Order = require("../models/order");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
// node提規模快 => 隨機生成加密數
const crypto = require("crypto");
const nodemailer = require("nodemailer");
// 郵件傳輸對象
const transporter = nodemailer.createTransport({
  // 主機位置
  host: "smtp.163.com",
  port: "465",
  secure: true,
  // 郵件授權內容,網易
  auth: {
    user: "qwe2795qwe@163.com",
    pass: "ENJACZJKFUUIDQGW",
  },
});

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    docTitle: "會員登入",
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "會員登入", hasBreadcrumbUrl: false },
    ],
    errorMessage: req.flash("error"),
    oldInput: { email: "", password: "" },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  // 取得資料後判斷登入
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  console.log(errors.array());

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      docTitle: "會員登入",
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "會員登入", hasBreadcrumbUrl: false },
      ],
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array(),
    });
  }
  // 查詢User資料庫，是否匹配email
  User.findOne({ email }).then((user) => {
    if (!user) {
      // 資料庫沒有該用戶
      return res.status(422).render("auth/login", {
        docTitle: "會員登入",
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "會員登入", hasBreadcrumbUrl: false },
        ],
        errorMessage: "沒有該用戶資料",
        oldInput: { email, password },
        validationErrors: [],
      });
    }
    // bcrypt比對操作 => 查詢是否匹配
    bcrypt
      .compare(password, user.password)
      .then((doMatch) => {
        if (doMatch) {
          // 登入時儲存資料
          // 設置sessio值
          req.session.isLogin = true;
          // 將user資料，儲存到db session
          req.session.user = user;
          return req.session.save((err) => {
            // 資料儲存後跳頁
            return res.redirect("/");
          });
        }

        return res.status(422).render("auth/login", {
          docTitle: "會員登入",
          breadcrumb: [
            { name: "首页", url: "/", hasBreadcrumbUrl: true },
            { name: "會員登入", hasBreadcrumbUrl: false },
          ],
          errorMessage: "密碼錯誤",
          oldInput: { email, password },
          validationErrors: [],
        });
      })
      .catch((err) => console.log("登入異常", err));
  });
};

exports.postLogout = (req, res, next) => {
  // session登出設置
  req.session.destroy((err) => {
    console.log("登出", err);
    res.redirect("/");
  });
};

// 註冊
exports.getRegistered = (req, res, next) => {
  res.render("auth/registered", {
    docTitle: "會員註冊",
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "會員註冊", hasBreadcrumbUrl: false },
    ],
    errorMessage: req.flash("error"),
    oldInput: { email: "", password: "", confirmPassword: "" },
    validationErrors: [],
  });
};

exports.postRegistered = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // 錯誤時渲染頁面
    console.log(errors.array());

    return res.status(422).render("auth/registered", {
      docTitle: "會員註冊",
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "會員註冊", hasBreadcrumbUrl: false },
      ],
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      validationErrors: errors.array(),
    });
  }

  // 查詢是否註冊

  bcrypt.hash(password, 12).then((hashPassword) => {
    const user = new User({
      email,
      // 帶入加密密碼
      password: hashPassword,
      cart: {
        items: [],
      },
    });

    return user.save().then(() => {
      // 導頁後進行發送，避免過程過於龐大
      res.redirect("/login");
      transporter.sendMail({
        from: "qwe2795qwe@163.com",
        to: email,
        subject: "註冊成功",
        html: "<b>歡迎新用戶註冊</b>",
      });
    });
  });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    docTitle: "重設密碼",
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "重設密碼", hasBreadcrumbUrl: false },
    ],
    errorMessage: req.flash("error"),
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  // 生成隨機字符
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log("重設密碼err", err);
      return res.redirect("/reset");
    }
    // 十六進制轉換
    const token = buffer.toString("hex");
    User.findOne({ email }).then((user) => {
      if (!user) {
        req.flash("error", "該用戶帳號並不存在");
        return res.redirect("/reset");
      }
      user.resetToken = token;
      // 設置token過期時間
      user.resetTokenExpiration = Date.now() * 1000 * 60 * 60;
      console.log(user.resetTokenExpiration);
      // user.resetTokenExpiration = 100;
      return user.save().then(() => {
        res.redirect("/");
        transporter.sendMail({
          from: "qwe2795qwe@163.com",
          to: email,
          subject: "重設密碼",
          html: `
            已請求密碼重置，請點擊以下地址
            <a href="http://localhost:3000/reset/${token}">重置連結</a>
          `,
        });
      });
    });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  // 查詢User結果=> token相同，時間符合
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  }).then((user) => {
    if (!user) {
      // 沒有匹配用戶時=>token過期...
      res.redirect("/login");
    }
    res.render("auth/new-password", {
      docTitle: "重設新密碼",
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "重設新密碼", hasBreadcrumbUrl: false },
      ],
      userId: user._id.toString(),
      passwordToken: token,
      errorMessage: req.flash("error"),
    });
  });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      // 查找到用戶時
      resetUser = user;
      // 新密碼加密操作
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashPassword) => {
      resetUser.password = hashPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;

      return resetUser
        .save()
        .then((result) => {
          res.redirect("/login");
        })
        .catch((err) => {
          console.log("修改密碼err", err);
        });
    });
};

exports.getUserOrderCount = (req, res, next) => {
  User.find()
    .lean()
    .then(async (users) => {
      for (let i = 0; i < users.length; i++) {
        const number = await Order.find({
          "user.userId": users[i]._id,
        }).countDocuments();

        users[i].userOrderCount = await number;
      }

      res.json(users);
    });
};
