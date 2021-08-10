const Product = require("../models/product");
const User = require("../models/user");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    docTitle: "添加产品",
    activeAddProduct: true,
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "添加产品", hasBreadcrumbUrl: false },
    ],
    editing: false,
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;

  if (!editMode) {
    return res.redirect("/");
  }

  const productId = req.params.productId;

  Product.findById(productId).then((product) => {
    if (!product) {
      return res.redirect("/");
    }

    res.render("admin/edit-product", {
      docTitle: "修改产品",
      activeProductManage: true,
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "修改产品", hasBreadcrumbUrl: false },
      ],
      editing: editMode,
      product,
    });
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;
  const userId = req.user;

  const product = new Product({ title, imageUrl, price, description, userId });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;

  Product.findById(productId).then((product) => {
    // 判斷是否為正確帳號
    if (req.user._id.toString() !== product.userId.toString()) {
      return res.redirect("/");
    }
    product.title = title;
    product.price = price;
    product.description = description;
    product.imageUrl = imageUrl;
    product
      .save()
      .then((result) => {
        res.redirect("/admin/products");
      })
      .catch((err) => console.log(err));
  });
};

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  // 產品及用戶ID都匹配才能刪除
  Product.deleteOne({ _id: productId, userId: req.user._id })
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name -_id')
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        docTitle: "产品管理",
        activeProductManage: true,
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "产品管理", hasBreadcrumbUrl: false },
        ],
      });
    });
};
