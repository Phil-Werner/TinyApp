var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"]};
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { username: req.cookies["username"], shortURL: req.params.id, urls:urlDatabase };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body['newLongURL'];
  //console.log(req.params.id);
  //console.log(req.body['newLongURL']);
  res.redirect('/urls/' + req.params.id);

});

app.post("/urls/:id/delete", (req, res) => {

  //console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect('/urls/');
})

app.post("/urls", (req, res) => {

  let long = req.body;
  let longValue = long.longURL;
  let shortValue = generateRandomString();
  urlDatabase[shortValue] = longValue;
  //console.log(urlDatabase);
                          // debug statement to see POST parameters
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)

  res.redirect('/urls/' + shortValue);
});

app.post("/login", (req, res) => {

  res.cookie('username', req.body['username']);
  //console.log(req.body['username']);
  res.redirect('/urls/');
});

app.post("/logout", (req, res) => {

  res.clearCookie('username');
  res.redirect('/urls/');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  let longURL = urlDatabase[short];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const arrayOfAlphaNum = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let outputString = "";

  for (var x = 0; x < 6; x++) {
    let index = Math.round(Math.random() * 62);
    outputString += arrayOfAlphaNum[index];
  }

  return outputString;
}