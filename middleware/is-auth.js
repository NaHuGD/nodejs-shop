// 判斷用戶是否登入

module.exports = (req, res, next) => {
  // 未登入時阻止進入
  if (!req.session.isLogin) {
    return res.redirect("/login");
  }
  // 確定登入進行下一步
  next();
};
