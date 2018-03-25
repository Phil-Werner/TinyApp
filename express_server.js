var express = require("express");
var cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
var app = express();
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
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

/* The function generateRandomString returns a random string of six characters, each
character being either an uppecase letter, lowercase letter, or number.  It does this
by using math.random to randomly generate a number between 0 and 61, then indexing
it against the arrayOfAlphaNum.  (It does this six times.)  */

function generateRandomString() {
  const arrayOfAlphaNum = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let outputString = "";

  for (var x = 0; x < 6; x++) {
    let index = Math.round(Math.random() * 61);
    outputString += arrayOfAlphaNum[index];
  }

  return outputString;
}

/* The function urlsForUser takes in a given user id and returns an object containing
all the urls that that user created. */

function urlsForUser(id) {

  let outputObj = {};
  for (elm in urlDatabase) {
    if (urlDatabase[elm]["userID"] === id) {
      outputObj[elm] = urlDatabase[elm]
    }
  }
  return outputObj;
}
/* The function checkForHTTP takes in a string (a url).  It then checks to see if the
url starts with http://. (Or https://)  If it does, it returns the same string.  If not
 it adds http:// to the beginning of the string and then returns it.  This keeps all the
 links working nicely!  */

function checkForHTTP(url) {
  let outputString = "";
  if (url.slice(0,7) === "http://") {
    return url;
  } else if (url.slice(0,8) === "https://") {
    return url;
  } else {
    outputString += "http://";
    outputString += url;
    return outputString;
  }
}
/* The function isLoggedIn returns true is the user is logged in and false otherwise.
Note that it takes the current request as a parameter when you call it. */

function isLoggedIn(req) {
  let currentUserId = req.session.user_id;
  if (users[currentUserId]) {
    return true;
  } else {
    return false;
  }
}

/* app.get("/") (ie the root page) will send the user to the login page if they are not
logged in, otherwise send them to the urls page. */

app.get("/", (req, res) => {
  if (!isLoggedIn(req)) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

/* app.get("/urls") will render the urls_index page.  But first it makes sure that they
are logged in, and if they are, it sets the tempalteVars to include the given user
and the urls object that contains urls that the given user created.  See function
urlsForUser.  */

app.get("/urls", (req, res) => {
  let currentUserId = req.session.user_id;

  if (!isLoggedIn(req)) {
    res.status(400).send("Sorry, must login before you can visit this page.");
    return;
  }

  let userUrls = urlsForUser(currentUserId);
  let templateVars = { user: users[req.session.user_id], urls: userUrls };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let currentUserId = req.session.user_id;

  if (!isLoggedIn(req)) {
    res.redirect("/login");
  } else {
    let templateVars = { user: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {

  res.render("urls_register");
});

/* app.post("/register") will add a new user to the users object.  It takes in the
email address and the password from the users input, and assigns an id to the user
that is a randomly generated string of six characters.  Note that the password cannot
be blank, the email cannot be blank, and it checks to make sure that the given email
is not already registered.  Before saving the password it hashes it using bcrypt.  */

app.post("/register", (req, res) => {

  let randomId = generateRandomString();
  let newEmail = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

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
  }

  users[randomId] = {};
  users[randomId]["id"] = randomId;
  users[randomId]["email"] = newEmail;
  users[randomId]["password"] = hashedPassword;
  req.session.user_id = randomId;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let templateVars = { user: null };
  res.render("login", templateVars);
});

/* app.get("/urls/:id") will render the urls_show view as long as the user is logged in
and attempting to view a url that they themselves created.  Before rending urls_show,
it sets the templateVars to include user (from the cookie), and the shortURL from the
:id, and the urlsDatabase. */

app.get("/urls/:id", (req, res) => {
  let currentUserId = req.session.user_id;

  if (!isLoggedIn(req)) {
    res.status(400).send("Sorry, you must log in before you can visit this page.");
    return;
  }

  if (users[currentUserId]["id"] !== urlDatabase[req.params.id]["userID"]) {
    res.status(400).send("Sorry, you cannot modify or view urls that you did not create");
    return;
  }

  let templateVars = { user: users[req.session.user_id], shortURL: req.params.id, urls:urlDatabase };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  if (!isLoggedIn(req)) {
    res.status(400).send("Sorry, you must be logged in to edit a url");
    return;
  }

  let editedURL = checkForHTTP(req.body['newLongURL']);
  if (urlDatabase[req.params.id]["userID"] === (req.session.user_id)) {

    urlDatabase[req.params.id]["url"] = editedURL;
    res.redirect('/urls/' + req.params.id);
  } else {

    res.status(400).send("Sorry, you can only edit your own URLs");
  }
});

/* app.post("/urls/:id/delete") will delete a given url, as long as the user is
logged in and is attempting to delete a url that they created. */

app.post("/urls/:id/delete", (req, res) => {
  if (!isLoggedIn(req)) {
    res.status(400).send("Sorry, you must be logged in to delete urls")
    return;
  }

  if (req.session.user_id === urlDatabase[req.params.id]["userID"]) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls/');
  } else {
    res.status(400).send("Sorry, you can only delete your own URLs");
  }
});

/* app.post("/urls") creates and adds a new url to the urls object.  It takes in the
long form of the url from the users input, and randomly creates the short url,
a string of six letters or numbers.  It then adds it to the urlDatabase object and
redirects the usr to /urls/:id */

app.post("/urls", (req, res) => {

  let long = req.body.longURL;
  let longValue = checkForHTTP(long);
  let shortValue = generateRandomString();
  urlDatabase[shortValue] = {};
  urlDatabase[shortValue]["url"] = longValue;
  urlDatabase[shortValue]["userID"] = req.session.user_id;
  res.redirect('/urls/' + shortValue);

});

/* app.post("/login") will log the user in by setting the cookie using req.session.user_id.
First though it checks that the given email is in the users object, by using a for..in loop
and comparing all the saved emails with the login email.  If the email address is found,
it then compares the saved, hashed password with the inputed password using
bcrypt.compareSync.  */

app.post("/login", (req, res) => {

  let loginEmail = req.body['email'];
  let loginPassword = req.body['password'];

  for (elm in users) {

    if (users[elm]["email"] === loginEmail) {

      if (bcrypt.compareSync(loginPassword, users[elm]["password"])) {
        req.session.user_id = users[elm]["id"];
        res.redirect('/urls');
        return;
      } else {
        res.status(403).send("Wrong password!  Try again!");
        return;
      }
    }
  }
  res.status(403).send("No such user! Try again!");
});

app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect('/login');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  let longURL = urlDatabase[short]["url"];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});

