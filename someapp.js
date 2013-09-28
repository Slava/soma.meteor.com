c = new Meteor.Collection('crimes');
c._ensureIndex({ location: "2dsphere" });

if (Meteor.isClient) {
  Session.set('location', [-122.41544999999999, 37.7745897]);
  Session.set('radius', 100);
  Template.map.rendered = function() {
    var mapOptions = {
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("map-canvas"),
      mapOptions);

    var p = [-122.41544999999999, 37.7745897];
    var p2 = {
      lng: p[0],
      lat: p[1]
    };

    map.setCenter(new google.maps.LatLng(p2.lat, p2.lng));
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(p2.lat, p2.lng),
      draggable:true,
      animation: google.maps.Animation.DROP,
      title:'That\'s me!',
      icon:'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });
    marker.setMap(map);
    google.maps.event.addListener(marker, 'dragend', function() {
      var pos = marker.getPosition();
      console.log(pos);
      Session.set('location', [pos.ob, pos.nb]);
    });

    Session.set('map', true);
  };

  Template.map.destroyed = function() {
    Session.set('map', false);
  };

  Meteor.startup(function () {
    var markers = [];
    var oldRadius = 100;
    var oldLoc = Session.get('location');
    var clearMarkers = function() {
      markers.forEach(function (x) {
        x.setMap(null);
      });
      markers = [];
    };

    Deps.autorun(function() {
      var isMap = Session.get('map');
      if(isMap) {
        if (Session.get('radius') < oldRadius || !EJSON.equals(Session.get('location'), oldLoc))
          clearMarkers();
        oldRadius = Session.get('radius');
        oldLoc = Session.get('location');
        var allPosts = c.find({ location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: Session.get('location')
            },
            $maxDistance: Session.get('radius')
          }
        } });
        allPosts.forEach(function (post) {
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(post.location.coordinates[1], post.location.coordinates[0]),
            title: post.descript,
            postId: post._id
          });

          if (_.any(markers, function (x) { return x._id === post._id; }))
            return;
          marker.setMap(map);
          markers.push(marker);
        });
      }
    });

    Deps.autorun(function () {
      if (Session.get('map')) {
        function HomeControl(controlDiv, map, increase) {

          // Set CSS styles for the DIV containing the control
          // Setting padding to 5 px will offset the control
          // from the edge of the map.
          controlDiv.style.padding = '5px';

          // Set CSS for the control border.
          var controlUI = document.createElement('div');
          controlUI.style.backgroundColor = 'white';
          controlUI.style.borderStyle = 'solid';
          controlUI.style.borderWidth = '2px';
          controlUI.style.cursor = 'pointer';
          controlUI.style.textAlign = 'center';
          controlUI.title = 'Click to set the map to Home';
          controlDiv.appendChild(controlUI);

          // Set CSS for the control interior.
          var controlText = document.createElement('div');
          controlText.style.fontFamily = 'Arial,sans-serif';
          controlText.style.fontSize = '12px';
          controlText.style.paddingLeft = '4px';
          controlText.style.paddingRight = '4px';
          if (increase)
            controlText.innerHTML = '<strong>+</strong>';
          else
            controlText.innerHTML = '<strong>-</strong>';
          controlUI.appendChild(controlText);

          // Setup the click event listeners: simply set the map to Chicago.
          google.maps.event.addDomListener(controlUI, 'click', function() {
            if (increase)
              Session.set('radius', oldRadius + 100);
            else
              Session.set('radius', oldRadius - 100);
          });
        }

        Meteor.setTimeout(function () {
          // Create the DIV to hold the control and call the HomeControl() constructor
          // passing in this DIV.
          var homeControlDiv = document.createElement('div');
          var homeControl = new HomeControl(homeControlDiv, map, 1);

          homeControlDiv.index = 1;
          map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);

          var homeControlDiv = document.createElement('div');
          var homeControl = new HomeControl(homeControlDiv, map);

          homeControlDiv.index = 2;
          map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);
        }, 400);
      }
    });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (!c.find().count())
      data.forEach(function (x) { c.insert(x); });
  });
}
