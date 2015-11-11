/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var settings = require('settings');

settings.option({
    'backgroundColor': 'black',
    'textColor': 'chromeYellow',
    'highlightBackgroundColor': 'darkCandyAppleRed',
    'highlightTextColor': 'yellow',
    'conference': 'DV15'
});

settings.data({
    'conferencesURL': 'http://cfp.devoxx.be/api/conferences/'
});

var menu = new UI.Menu({
    backgroundColor: settings.option('backgroundColor'),
    textColor: settings.option('textColor'),
    highlightBackgroundColor: settings.option('highlightBackgroundColor'),
    highlightTextColor: settings.option('highlightTextColor'),
    sections: [{title: settings.option('conference') + ' loading...', items: []}]
});
menu.on('accelTap', function(){
    //TODO: implement refresh
});
menu.show();

var dayMenu = new UI.Menu({
    backgroundColor: settings.option('backgroundColor'),
    textColor: settings.option('textColor'),
    highlightBackgroundColor: settings.option('highlightBackgroundColor'),
    highlightTextColor: settings.option('highlightTextColor'),
    sections: [{items: []}]    
});
dayMenu.on('accelTap', function(){
    //TODO: implement refresh
});

var slotInfo = new UI.Card({
    scrollable: true,
    style: 'small',
    title: settings.option('conference'),
    body: 'loading...'
});

//retrieve schedules
ajax({
        url: settings.data('conferencesURL') + settings.option('conference') + '/schedules/',
        type: 'json'
    },
    function(data) {
        if (data.links && data.links.length > 0) {
            var menuItems = [];
            data.links.forEach(function(day) {
                var dayParts = day.title.split(",");
                menuItems.push({
                    title: dayParts[0],
                    subtitle: dayParts[1],
                    href: day.href
                });
            });
            menu.section(0).title = null;
            menu.items(0, menuItems);
        } else {
            menu.section(0).title(settings.option('conference') + ': no schedules!');
        }
    },
    function(error) {
        menu.section(0).title(settings.option('conference') + ': error fetching schedules!');
    }
);

menu.on('select', function(event) {
    ajax({
        url: event.item.href,
        type: 'json'
        },
        function(data) {
            dayMenu.section(0).title = event.item.title;
            var menuItems = [];
            data.slots.forEach(function(slot){
                var slotTitle;
                var slotSummary;
                var slotSpeakers;
                if (slot.notAllocated) {
                    slotTitle = "Not Allocated";
                    slotSummary = "Slot not allocated yet. Please come back later!";
                } else if (slot.talk) {
                    slotTitle = slot.talk.title;
                    slotSummary = slot.talk.summary;
                    var speakers = [];
                    slot.talk.speakers.forEach(function(speaker){
                        speakers.push(speaker.name);
                    });
                    slotSpeakers = speakers.join(',');
                } else if (slot.break) {
                    slotTitle = slot.break.nameEN;
                    slotSummary = slotTitle;
                } else {
                    console.log(JSON.stringify(slot) +": wot is dis?");
                }
                menuItems.push({
                    title: slotTitle,
                    subtitle: slot.fromTime + "-" + slot.toTime + " " + slot.roomName,
                    summary: slotSummary,
                    speakers: slotSpeakers
                });
            });
            dayMenu.items(0, menuItems);
            dayMenu.show();
        },
        function(error) {
            //todo: show some error
        }
    );
});

dayMenu.on('select', function(event) {
    console.log("sum:" + event.item.summary);
    slotInfo.title(event.item.title);
    slotInfo.subtitle(event.item.subtitle);
    var speakersInfo = event.item.speakers ? '\n\nSpeakers: ' + event.item.speakers : '';
    slotInfo.body(event.item.summary + speakersInfo);
    slotInfo.show();
});