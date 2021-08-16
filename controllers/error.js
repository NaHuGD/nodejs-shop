exports.get404 = (req, res, next) => {
  res.status(404).render("404", { docTitle: "页面未找到" });
};

exports.get500 = (req, res, next) => {
  res
    .status(500)
    .render("500", { docTitle: "程序出錯err:500", errorMessage: "程序出錯" });
};
