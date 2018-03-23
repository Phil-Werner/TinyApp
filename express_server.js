var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
  url: "http://www.lighthouselabs.ca",
  userID: "userRandomID"
  },
  "9sm5xK": {
  url: "http://www.google.com",
  userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher"
  }
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  //console.log(users[req.cookies["user_id"]]);
  let currentUserId = req.cookies.user_id;

  console.log(currentUserId);

  if (!users[currentUserId]) {
    res.status(400).send("Sorry, must login before you can visit this page.");
    return;
  }

  let userUrls = urlsForUser(currentUserId);
  let templateVars = { user: users[req.cookies["user_id"]], urls: userUrls };

  // console.log(templateVars);
  // console.log(users[req.cookies["user_id"]]);
  // console.log(req.cookies["user_id"]);
  // console.log(req.cookies);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let currentUserId = req.cookies.user_id;

  if (!users[currentUserId]) {
    res.redirect("/login");
  } else {

    let templateVars = { user: users[req.cookies["user_id"]]};
    //console.log(req.cookies);
    //console.log(templateVars);

    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {

  res.render("urls_register");
});

app.post("/register", (req, res) => {

  let randomId = generateRandomString();
  let newEmail = req.body.email;
  let password = req.body.password;
  //console.log('ID:' + randomId + "email:" + email + "password:" + password);

  //console.log(users);

  if (newEmail === "") {
    res.status(400).send("Your email cannot be blank!");
    return;
  }

  if (password === "") {
    res.status(400).send("Your password cannot be blank!");
    return;
  }

  for (elm in users) {
    if (users[elm]["email"] === newEmail) {
      res.status(400).send("This email is already registered.  Please try again and have a nice day.")
      return;
    }
      //console.log(users[elm]["email"]);
      //console.log(newEmail);
  }

   users[randomId] = {};

   //console.log(users);
   users[randomId]["id"] = randomId;
   users[randomId]["email"] = newEmail;
   users[randomId]["password"] = password;

  //console.log(users);
  res.cookie('user_id', randomId);
  // console.log(users);
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let templateVars = { user: null };
  res.render("login", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let currentUserId = req.cookies.user_id;

  if (!users[currentUserId]) {
    res.status(400).send("Sorry, you must log in before you can visit this page.");
    return;
  }

  if (users[currentUserId]["id"] !== urlDatabase[req.params.id]["userID"]) {
    res.status(400).send("Sorry, you cannot modify or view urls that you did not create");
    return;
  }

  let templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.id, urls:urlDatabase };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  //urlDatabase[req.params.id] = {};

  if (urlDatabase[req.params.id]["userID"] === (req.cookies["user_id"])) {

    urlDatabase[req.params.id]["url"] = req.body['newLongURL'];
    res.redirect('/urls/' + req.params.id);
  } else {

    res.status(400).send("Sorry, you can only edit your own URLs");
  }

  //urlDatabase[req.params.id]["userID"] = req.cookies["user_id"];
  //console.log(req.params.id);
  //console.log(req.body['newLongURL']);
});

app.post("/urls/:id/delete", (req, res) => {

  //console.log(req.params.id);
  if (req.cookies["user_id"] === urlDatabase[req.params.id]["userID"]) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls/');
  } else {
    res.status(400).send("Sorry, you can only delete your own URLs");
  }
});

app.post("/urls", (req, res) => {

  let long = req.body;
  let longValue = long.longURL;
  let shortValue = generateRandomString();
  urlDatabase[shortValue] = {};
  urlDatabase[shortValue]["url"] = longValue;
  urlDatabase[shortValue]["userID"] = req.cookies["user_id"];
  //console.log(urlDatabase);
                          // debug statement to see POST parameters
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
  //console.log(urlDatabase);
  res.redirect('/urls/' + shortValue);
});

app.post("/login", (req, res) => {

  let loginEmail = req.body['email'];
  let loginPassword = req.body['password'];

  for (elm in users) {

    if (users[elm]["email"] === loginEmail) {

        if (users[elm]["password"] === loginPassword) {
          res.cookie('user_id', users[elm]["id"]);
          res.redirect('/urls');
          return;
        } else {
          res.status(403).send("Wrong password!  Try again!");
          return;
        }
    }
  }

  res.status(403).send("No such user! Try again!");



  //console.log("loginEmail = " + loginEmail);
  //console.log("loginPassword = " + loginPassword);
  //console.log(req.body);
  //res.cookie('user_id', req.body['username']);
  //console.log(req.body['username']);


  //res.redirect('/urls/');
});

app.get("/logout", (req, res) => {

  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  let longURL = urlDatabase[short]["url"];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const arrayOfAlphaNum = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let outputString = "";

  for (var x = 0; x < 6; x++) {
    let index = Math.round(Math.random() * 61);
    outputString += arrayOfAlphaNum[index];
  }

  return outputString;
}

function urlsForUser(id) {

  let outputObj = {};
  for (elm in urlDatabase) {
    if (urlDatabase[elm]["userID"] === id) {
      outputObj[elm] = urlDatabase[elm]
    }
  }
  return outputObj;
}

//console.log(urlsForUser("user2RandomID"));