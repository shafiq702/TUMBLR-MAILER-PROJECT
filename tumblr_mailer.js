var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var csvFile = fs.readFileSync("friend_list.csv", "utf8");
var emailTemplate = fs.readFileSync("email_template.html", "utf8");
// Authenticate via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'rbXtj3IjK0EODatpN10rZ6acrsTakpvFt1ZRKPmbrheeHggz1e',
  consumer_secret: 'O9rSbunzUeYqL4cPGAeHcL0EQsMAuV1hgOsCSUcCf3MI4wTlJe',
  token: 'u9XUZlYFPwYdzyWCXxD3le9bclU2YRHYhh3kGIwGFqp611rfGk',
  token_secret: '03Eh4GKLOJF13ZOPT8ZFOk4sCgbO1t0IfPVBqhVmO2caQVpnKv'
});
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('KHQCBKGRBGYo8VaDi6nyqA');

//Parse data from csvFile
function csv_parse(csvFile){
    
    var array = csvFile.split("\n");
    var headers = array[0].split(",");
    
    var array2 = [];
    var counter = 0;  
    
    while(counter < array.length-2)
    {
        var values = array[counter+1].split(",");
        var obj = {};
        for (var i = 0; i < values.length; i++){
            obj[headers[i]] = values[i]; 
        }
        array2.push(obj);
        counter+=1;
    }
    return array2;
};

//Gather data from Tumblr api
client.posts('shafiq702.tumblr.com', function(error, blog){
    var today = Date.parse(Date());
    var latestPosts = [];
    var millisecondsInSevenDays = 604800000;
    
    blog.posts.forEach(function(post){
        var postDate = Date.parse(post.date);
        var difference = today - postDate;

        if(difference <= millisecondsInSevenDays){
            latestPosts.push(post)
        }
    });
    //Replace using ejs.render
    function email_replace(emailTemplate){

        var values = csv_parse(csvFile);
        var customTemplate;
        
        for(var i = 0; i < values.length; i++){
            
            var firstName = values[i].firstName;
            var numMonthsSinceContact = values[i].numMonthsSinceContact;
            
            customTemplate = ejs.render(emailTemplate,{firstName: firstName, numMonthsSinceContact: numMonthsSinceContact, latestPosts: latestPosts});
            sendEmail(firstName,values[i].emailAddress,"Shafiq","shafiq702@gmail.com","testing",customTemplate);
        }
    }
  });

//sends email using the Mandrill Api JavaScript
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }