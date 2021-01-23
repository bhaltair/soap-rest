var loopback = require("loopback");
var path = require("path");

var app = (module.exports = loopback());

app.set("restApiRoot", "/api");

var ds = loopback.createDataSource("soap", {
  connector: require("../index"),
  remotingEnabled: true,
  wsdl:
    "https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL",
});

// Unfortunately, the methods from the connector are mixed in asynchronously
// This is a hack to wait for the methods to be injected

ds.once("connected", function () {
  var NumberService = ds.createModel("NumberService", {});

  NumberService.numberToWords = function (ubiNum, cb) {
    NumberService.NumberToWords(
      {
        ubiNum,
      },
      function (err, response) {
        console.log("response: %j", response);
        // var result = !err && result.NumberToWordsResult;
        cb(err, response);
      }
    );
  };

  loopback.remoteMethod(NumberService.numberToWords, {
    accepts: [
      {
        arg: "ubiNum",
        type: "string",
        required: true,
        http: { source: "query" },
      },
    ],
    returns: { arg: "result", type: "object", root: true },
    http: { verb: "get", path: "/numberToWords" },
  });

  // Expose to REST
  app.model(NumberService);

  // LoopBack REST interface
  app.use(app.get("restApiRoot"), loopback.rest());

  // API explorer (if present)
  // 界面
  try {
    var explorer = require("loopback-explorer")(app);
    app.use("/explorer", explorer);
    app.once("started", function (baseUrl) {
      console.log(
        "Browse your REST API at %s%s",
        baseUrl,
        path.join(explorer.route, "/explorer")
      );
    });
  } catch (e) {
    console.log(
      "Run `npm install loopback-explorer` to enable the LoopBack explorer"
    );
  }

  app.use(loopback.urlNotFound());
  app.use(loopback.errorHandler());

  if (require.main === module) {
    app.start();
  }
});

app.start = function () {
  return app.listen(3000, function () {
    var baseUrl = "http://127.0.0.1:3000";
    app.emit("started", baseUrl);
    console.log("LoopBack server listening @ %s%s", baseUrl, "/");
  });
};
