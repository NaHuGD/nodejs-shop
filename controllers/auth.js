const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    docTitle: "會員登入",
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "會員登入", hasBreadcrumbUrl: false },
    ],
    isAuthenticated: req.session.isLogin,
  });
};

exports.postLogin = (req, res, next) => {
  // 登入時儲存資料
  User.findOne().then((user) => {
    // 設置sessio值
    req.session.isLogin = true;
    // 將user資料，儲存到db session
    req.session.user = user;
    req.session
      .save((err) => {
        // 資料儲存後跳頁
        res.redirect("/");
      })
      .catch((err) => {
        console.log("登入儲存異常", err);
      });
  });
};

exports.postLogout = (req, res, next) => {
  // session登出設置
  req.session.destroy((err) => {
    console.log("登出", err);
    res.redirect("/");
  });
};
