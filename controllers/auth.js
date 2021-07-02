const User = require("../models/user");
const bcrypt = require("bcrypt");

exports.getLogin = (req, res, next) => {
  console.log("csruf123: "+req.csrfToken());
  res.render("auth/login", {
    docTitle: "會員登入",
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "會員登入", hasBreadcrumbUrl: false },
    ],
    errorMsg: req.flash("error")
  });
};

exports.postLogin = (req, res, next) => {
  // 取得資料後判斷登入
  const email = req.body.email;
  const password = req.body.password;
  // 查詢User資料庫，是否匹配email
  User.findOne({ email }).then((user) => {
    if (!user) {
      req.flash("error", "沒有該用戶資料")
      // 資料庫沒有該用戶
      return res.redirect("/login");
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

        req.flash("error", "密碼錯誤")
        // 資料不匹配時
        res.redirect("/login");
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
    errorMsg: req.flash("error"),
  });
};
exports.postRegistered = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  // 查詢是否註冊
  User.findOne({ email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash("error", "該用戶已經註冊");
        return res.redirect("/registered");
      }

      if ( password !== confirmPassword ) {
        req.flash("error", "確認密碼不一致")
        return res.redirect("/registered");
      }
      return bcrypt.hash(password, 12).then((hashPassword) => {
        const user = new User({
          email,
          // 帶入加密密碼
          password: hashPassword,
          cart: {
            items: [],
          },
        });

        return user.save();
      });
    })
    .catch((err) => {
      console.log("post註冊錯誤", err);
    });
};
