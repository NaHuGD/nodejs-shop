exports.get404 = (req, res, next) => {
  res
    .status(404)
    .render("404", { docTitle: "页面未找到", isAuthenticated: req.session.isLogin });
};