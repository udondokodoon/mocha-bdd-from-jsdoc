var fs = require("fs");
var esprima = require("esprima");
var estraverse = require("estraverse");
var _ = require("lodash");

var filename = process.argv[2];

if (!filename) {
  console.error("filename not specified");
  process.exit(1);
}

var tmpl = fs.readFileSync(__dirname + "/tmpl/bdd.tmpl");

var code = fs.readFileSync(filename, "utf8");
var ast = esprima.parse(code, {comment: true});
var doctrine = require("doctrine")

var classInfo = {};
var methodInfo = {};

_.each(ast.comments, function(e) {
  var doc = doctrine.parse(e.value, {unwrap: true});
  //console.log(doc);
  var klass = _.find(doc.tags, function(n) { return n.title === "class" });
  if (klass) {
    classInfo = {
      description: doc.description,
      name: klass.name
    }
  }
  var method = _.find(doc.tags, function(n) { return n.title === "method" });
  var isPrivate = _.find(doc.tags, function(n) { return n.title === "private" });
  if (!method) {
    return;
  }
  if (isPrivate) {
    return;
  }
  var info = {
    description: doc.description,
    name: method.name,
    args: []
  };
  _.each(_.filter(doc.tags, function(n) { return n.title === "param"}), function(n) {
    info.args.push("{" + n.type.name + "} " + n.name + (n.description ? " -- " + n.description : ""));
  });
  methodInfo[method.name] = info;
});

estraverse.traverse(ast, {
  enter: function(currentNode, parentNode) {
    // this.skip();
    // this.break();
  },
  leave: function(currentNode, parentNode) {
    if (currentNode.type === "ExpressionStatement" && currentNode.expression && currentNode.expression.right && currentNode.expression.right.property && currentNode.expression.right.property.name === "extend") {
      classInfo.name = currentNode.expression.left.object.name + "." + currentNode.expression.left.property.name;
    }
    // this.skip();
    // this.break();
  }
});

//console.log(JSON.stringify(classInfo, null, "  "));
//console.log(JSON.stringify(methodInfo, null, "  "));
console.log(_.template(tmpl)({classInfo: classInfo, methodInfo: methodInfo}));