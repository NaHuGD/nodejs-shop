const Product = require("../models/product");
const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        docTitle: "产品中心",
        activeProductList: true,
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "产品中心", hasBreadcrumbUrl: false },
        ],
      });
    })
    .catch((err) => {
      const error = new Error(`取得商品頁err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        docTitle: "商城",
        activeShop: true,
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "商城", hasBreadcrumbUrl: false },
        ],
      });
    })
    .catch((err) => {
      const error = new Error(`取得商品詳情err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        docTitle: "购物车",
        activeCart: true,
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "购物车", hasBreadcrumbUrl: false },
        ],
        cartProducts: products,
      });
    })
    .catch((err) => {
      const error = new Error(`取得購物車err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.postAddToCart = (req, res, next) => {
  const productId = req.body.productId;

  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(`新增購物車err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;

  req.user
    .deleteProductFromCart(productId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(`刪除購物車err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.getProductDetail = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      res.render("shop/product-detail", {
        docTitle: "产品详情",
        product: product,
        activeProductList: true,
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "产品中心", url: "/product-list", hasBreadcrumbUrl: true },
          { name: "产品详情", hasBreadcrumbUrl: false },
        ],
      });
    })
    .catch((err) => {
      const error = new Error(`獲取產品詳情err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.postCreateOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });

      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products,
      });

      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/checkout");
    })
    .catch((err) => {
      const error = new Error(`訂單管理err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/checkout", {
        docTitle: "订单管理",
        activeCheckout: true,
        orders,
        breadcrumb: [
          { name: "首页", url: "/", hasBreadcrumbUrl: true },
          { name: "订单管理", hasBreadcrumbUrl: false },
        ],
      });
    })
    .catch((err) => {
      const error = new Error(`獲取訂單管理err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = `invoice-${orderId}.pdf`;
  const invoicePath = path.join("data", "invoices", invoiceName);
  const fontsPath = path.join("fonts", "msyh.ttf");

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("沒有匹配訂單"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("未授權操作"));
      }

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      // attachment => 附件下載
      // inline => 瀏覽器查看
      res.setHeader(
        "Content-Disposition",
        `inline; filename=ivoice-${orderId}.pdf`
      );
      // 寫入位置
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.font(fontsPath).fontSize(25).text("發貨訂單資訊");
      pdfDoc.fontSize(14).text("------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.product.price * prod.quantity;
        pdfDoc
          .font(fontsPath)
          .fontSize(14)
          .text(
            `產品名稱：${prod.product.title} | 購買數量：${prod.quantity} | 價格：${prod.product.price}`
          );
      });
      pdfDoc.fontSize(14).text("------------------");
      pdfDoc.font(fontsPath).fontSize(14).text(`總價${totalPrice}`);
      pdfDoc.end();
    })
    .catch((err) => {
      const error = new Error(`獲取訂單管理err: ${err}`);
      error.httpStatuCode = 500;
      return next(error);
    });
};
