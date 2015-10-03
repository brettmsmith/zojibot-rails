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
var loaded = false;

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
    $("#commandform").submit(addCommand);
    $("#navbaruser").html(username);
    $("#navbarlogout").show();
    $("#navbarli").show();
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

function addCommand(event){//TODO: Reset the text boxes
    console.log("Call: "+$("#addcall").val())
    event.preventDefault();
    console.log("Modonly: "+$("#addmodonly").val());
    loaded = false;
    $.ajax({
        url: base+"/commands/add",
        data:{user: username, call:$("#addcall").val(), response:$("#addresponse").val(), token:usertoken, userlevel:$("#addmodonly").val()}
    }).done(commandclick);
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

function loadCommands(data){//TODO: add in edit link stuff; on edit.click(fill in that i's placeholders and show the form)
    console.log("Load commands raw: "+data);
    if(data.commands.length < 10){
        for (var i = data.commands.length+1; i <= 10; i++) {
            /*$("#call"+i).hide();
            $("#res"+i).hide();
            $("#userlevel"+i).hide();
            $("#edit"+i).hide();*/
            $("#row"+i).hide();
        }
    }
    for (var i = 1; i <= data.commands.length; i++) {//TODO: add delete command buttons
        $("#call"+i).html(data.commands[i-1].call);
        $("#editcall"+i).val(data.commands[i-1].call);
        $("#res"+i).html(data.commands[i-1].response);
        $("#editres"+i).val(data.commands[i-1].response);
        $("#userlevel"+i).html(data.commands[i-1].userlevel);
        $("#edituserlevel"+i).val(data.commands[i-1].userlevel);
        /*$("#editbtn"+i).click(function(){
            $("#editform"+i).show();
        });*/

        /*$("#call"+i).show();
        $("#res"+i).show();
        $("#userlevel"+i).show();
        $("#edit"+i).show();
        $("#editform"+i).hide();
        */
        $("#row"+i).show();
    }
}
/*For editing commands, I could do text boxes with each command, but it would make more
stuff to load and handle client side. When edit is clicked, change from showing text to
showing the edit text boxes
*/

function showRow(i){
    console.log("Showing row: "+i);
    $("#editform"+i).show();
    $("#editbtn"+i).addClass("noshow");
    $("#deletebtn"+i).removeClass("noshow");
}

function editCommand(i){
    $.ajax({
        url: base+"/commands/edit",
        data: {user: username, token: usertoken, call:$("#editcall"+i).val(), userlevel:$("#edituserlevel"+i).val(), response: $("#editres"+i).val()}

    }).done(function(data){
        console.log("Edit command response: "+data)
        loaded = false;
        $("#editbtn"+i).removeClass("noshow");
        $("#deletebtn"+i).addClass("noshow");
        commandclick();
    })
}

function deleteRow(i){//TODO: Ask for confirmation of delete
    console.log("Delete request: "+$("#call"+i).html());
    $.ajax({
        url: base+"/commands/delete",
        data: {user: username, token: usertoken, call:$("#call"+i).html()}
    }).done(function(data){
        console.log("Delete command response: "+data);
        $("#editbtn"+i).removeClass("noshow");
        $("#deletebtn"+i).addClass("noshow");
        $("#editform"+i).hide();
        loaded = false;
        commandclick();
    });
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
    if(!loaded){
        json = getCommands(page, loadCommands);
        loaded = true;
        $("#addcall").val("");
        $("#addresponse").val("");
    }
}

function settingsclick(){
    $("#status").hide();
    $("#commands").hide();
    $("#settings").fadeIn();
    $("#statustab").removeClass("active");
    $("#commandtab").removeClass("active");
    $("#settingstab").addClass("active");
}
