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

$(document).ready(function(){
    $("#test").click(function(){
        $(this).hide();
    });
});
