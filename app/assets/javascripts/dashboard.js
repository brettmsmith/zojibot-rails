/* Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

#have a function for each thing that hides all of the other tabs/whatever and
#shows the current one; use jquery & id's on the containers for pretty easy hiding.
#can also change the active tab using an id; should probably add in fading effects
#or something to make it look pretty after stuff actually works.

#use document.ready(or other page loading thing) to hide everything? this would
#give stuff time to load all at once. If not, need to figure out another way to
#do stuff(like ajax hooks). I'm not sure how to include ruby code on stuff without
#it actually doing it the first time.*/

//I could have a pid var I set at the beginning and set by getting from app
//Later I could set up an semi constant alarm thing to make sure nothing has changed
var pid;
//var base = "http://localhost:3000"
var base = "http://zojibot.herokuapp.com"
var page = 1;

//$(document).ready(function(){
function load(){//TODO: Fix this hack
    page = 1;
    console.log("Document.ready");
    $("#statustab").click(statusclick);
    $("#commandtab").click(commandclick);
    $("#settingstab").click(settingsclick);
    $("#commands").hide();
    $("#settings").hide();
    checkBotStatus(pageLoad);
    //formid.submit(callback) for adding a command
}
//});

function getCommands(batch, fun){
    console.log("Getting page "+batch);
    $.ajax({
        url: base+"/commands",
        data: {user:username, token: usertoken, batch: batch}
    }).done(function(data){
        console.log("Commands response: "+data);
        fun(JSON.parse(data));
    })
}

function checkBotStatus(fun){
    $.ajax({
        url: base+"/bot",//do I need to add a random number to anti-cache?
        data:{user: username, token: usertoken}
    }).done(fun);
}

function pageLoad(data){
    console.log("In pageLoad, data is: "+data);
    if(data == 0){
        $("#botbutton").removeClass("btn-bot-stop");
        $("#botbutton").addClass("btn-bot-start");
        $("#botbutton").html("Start bot");
    }
    else {
        $("#botbutton").removeClass("btn-bot-start");
        $("#botbutton").addClass("btn-bot-stop");
        $("#botbutton").html("Stop bot");
    }
}

function botLogic(data){
    if(data == 0){
        $.ajax({
            url: base+"/start",
            data: {user: username, token: usertoken}
        }).done(function(res){
            if (res == "Success") {
                pageLoad(1);
            }
        });
    }
    else{
        $.ajax({
            url: base+"/stop",
            data: {user: username, token: usertoken}
        }).done(function(res){
            if(res == "Success"){
                pageLoad(0);
            }
        })
    }
}

function loadCommands(data){
    for (var i = 1; i <= data.commands.length; i++) {
        $("#call"+i).html(data.commands[i-1].call);
        $("#res"+i).html(data.commands[i-1].response);
        $("#userlevel"+i).html(data.commands[i-1].userlevel);
        $("#call"+i).show();
        $("#res"+i).show();
        $("#userlevel"+i).show();
    }
    if(data.commands.length < 10){
        for (var i = data.commands.length+1; i <= 10; i++) {
            $("#call"+i).hide();
            $("#res"+i).hide();
            $("#userlevel"+i).hide();
        }
    }
}

function toggleBot(){//get pid, if 0, start the bot, otherwise stop the bot
    $("#botbutton").html("Working...");
    checkBotStatus(botLogic);
}

function statusclick(){
    $("#commands").hide();
    $("#settings").hide();
    $("#status").fadeIn();
    $("#commandtab").removeClass("active");
    $("#settingstab").removeClass("active");
    $("#statustab").addClass("active");
}

function commandclick(){
    $("#status").hide();
    $("#settings").hide();
    $("#commands").fadeIn();
    $("#statustab").removeClass("active");
    $("#settingstab").removeClass("active");
    $("#commandtab").addClass("active");
    json = getCommands(page, loadCommands);
}

function settingsclick(){
    $("#status").hide();
    $("#commands").hide();
    $("#settings").fadeIn();
    $("#statustab").removeClass("active");
    $("#commandtab").removeClass("active");
    $("#settingstab").addClass("active");
}
