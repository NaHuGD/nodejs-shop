const Product = require("../models/product");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/fileHelper");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    docTitle: "添加产品",
    activeAddProduct: true,
    breadcrumb: [
      { name: "首页", url: "/", hasBreadcrumbUrl: true },
      { name: "添加产品", hasBreadcrumbUrl: false },
    ],
    editing: false,
    hashError: false,
    errorMessage: null,
    product: { title: "", imageUrl: "", price: "", description: "" },
    validationErrors: [],
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
      errorMessage: null,
      hashError: false,
      validationErrors: [],
      product,
    });
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;
  const userId = req.user;

  console.log(image);

  if (!image) {
    // 未產生圖片
    return res.status(422).render("admin/edit-product", {
      docTitle: "添加产品",
      activeProductManage: true,
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "添加产品", hasBreadcrumbUrl: false },
      ],
      editing: false,
      hashError: true,
      errorMessage: "未正確上傳圖片",
      product: { title, price, description },
      validationErrors: [],
    });
  }

  const imageUrl = image.path;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "添加产品",
      activeProductManage: true,
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "添加产品", hasBreadcrumbUrl: false },
      ],
      editing: false,
      hashError: true,
      errorMessage: errors.array()[0].msg,
      product: { title, imageUrl, price, description },
      validationErrors: errors.array(),
    });
  }

  const product = new Product({
    title,
    imageUrl,
    price,
    description,
    userId,
    // _id: new mongoose.Types.ObjectId("611632b279c91732f9b8894c"),
  });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(`新增商品err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("qweqweqweq", errors.array());
    return res.status(422).render("admin/edit-product", {
      docTitle: "修改产品",
      activeProductManage: true,
      breadcrumb: [
        { name: "首页", url: "/", hasBreadcrumbUrl: true },
        { name: "修改产品", hasBreadcrumbUrl: false },
      ],
      editing: true,
      hashError: true,
      errorMessage: errors.array()[0].msg,
      product: { title, price, description, _id: productId },
      validationErrors: errors.array(),
    });
  }

  Product.findById(productId)
    .then((product) => {
      console.log("product", product);
      // 判斷是否為正確帳號
      if (req.user._id.toString() !== product.userId.toString()) {
        return res.redirect("/");
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (image) {
        // 圖片重複時刪除
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }

      product
        .save()
        .then((result) => {
          res.redirect("/admin/products");
        })
        .catch((err) => {
          const error = new Error(`判斷帳號err: ${err}`);
          error.httpStatuCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(`判斷帳號err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;

  Product.findById(productId)
    .then((product) => {
      // 判斷是否有產品 在刪除圖片
      if (!product) {
        next(new Error("未找到產品"));
      }

      fileHelper.deleteFile(product.imageUrl);
      // 產品及用戶ID都匹配才能刪除
      return Product.deleteOne({ _id: productId, userId: req.user._id });
    })
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(`刪除商品err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
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
    })
    .catch((err) => {
      const error = new Error(`取得商品err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};
