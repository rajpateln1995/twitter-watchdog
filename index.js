var express = require('express');
var app = express();
var Twitter = require('twitter');
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Twitter Settings

var client = new Twitter({
  consumer_key: "Rt5ximbUnoBBY9JaZjE8I0A42",
  consumer_secret: "TBBBN1wcIx9dhJ9ILtw7LLSDlo8NnroEWnfSoLHNpJuWQCT5DT",
  access_token_key: "1503325887441223680-oDlKhLfu0i4lYymaMrklDVZqMAh13W",
  access_token_secret: "E27EN4CXAkt5J8UE1kE320uSnrTDXdY2OFXaIMsYdU3Jx"
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Router + Callback

// http://localhost/
app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/searchTweets', function(request, response){
  var keyword = request.param('keyword');
  response.set('Content-Type', 'application/javascript');
  client.get('search/tweets', {q: keyword}, function(error, tweets, resp) {
     response.send(JSON.stringify(tweets));
  });

});

// Main Listening
http.listen(app.get('port'), function(){
  console.log('Node app is running on port', app.get('port'));
});


// Twitter Stream API

app.get('/streamTweets', function(request, response){
  var keyword = request.param('keyword');
  response.set('Content-Type', 'application/javascript');
  client.stream('statuses/filter', {track: keyword}, function(stream) {
    stream.on('data', function(event) {
      //console.log(event && event.text);
      response.send(JSON.stringify(event));
    });

    stream.on('error', function(error) {
      //console.log(error);
    });
  });

});

 // Web Socket
var stream;
 io.on('connection', function(socket){
   //console.log('a user connected');

   // Socket: streamTweets
   // socket.emit('streamTweets',{keyword:$('#keyword').val()});
   socket.on('streamTweets', function(keyword){
    console.log('keyword: ' + keyword.keyword);

    // Stream API
    stream = client.stream('statuses/filter', {track: keyword.keyword});

    stream.on('data', function(event) {
      console.log(event);
      //response.send(JSON.stringify(event));
      io.emit('tweets', JSON.stringify(event));
    });

    stream.on('error', function(error) {
      console.log(error);
    });


  });

  // Socket: disconnect
   socket.on('disconnect', function(){
     console.log('user disconnected');
   });

   socket.on('stopStreamTweets', function(){
     console.log("stop");
    stream.destroy();
    io.emit('stop');

    });
 });
