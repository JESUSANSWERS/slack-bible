var _ = require('lodash')
var bodyParser = require('body-parser')
var books = require('./books')
var express = require('express')
var app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

var booksWithPipes = _.chain(books).values().flatten().join('|').value()
var regex = new RegExp('(' + booksWithPipes + ')\\.?\\s*(\\d{1,3})(?:\\s*[\\:\\s]\\s*(\\d{1,3})(?:\\s*[\\-\\s]\\s*(\\d{1,3}))?)?', 'ig')

function reverseLookup (abbr) {
  return _.findKey(books, function (abbrs) {return _.includes(abbrs, abbr.toLowerCase())})
}

app.post('/', function(request, response) {
  var inputText = request.body.text

  var res, results = []
  while ((res = regex.exec(inputText)) !== null) {
    var trueRef = reverseLookup(res[1]) + '+' + res[2]
    if (res[3]) trueRef += ':' + res[3]
    if (res[4]) trueRef += '-' + res[4]
    results.push(trueRef)
  }

  if (results.length > 0) {
    var attachments = _.map(results, function (result) {
      var title = result.replace('+', ' ')
      var link = 'https://biblegateway.com/bible?passage=' + result

      return {
        title: title,
        title_link: link,
        fallback: title + ' - ' + link,
        color: 'good'
      }
    })

    response.json({text: 'Referenced verses:', attachments: attachments})
  } else {
    response.json({})
  }
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'))
})
