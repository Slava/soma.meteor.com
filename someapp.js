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

    var p = Session.get('location');
    var p2 = {
      lng: p[0],
      lat: p[1]
    };

    map.setCenter(new google.maps.LatLng(p2.lat, p2.lng));
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(p2.lat, p2.lng),
      title:'That\'s me!',
      icon:'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });
    marker.setMap(map);   

    Session.set('map', true);
  };

  Template.map.destroyed = function() {
    Session.set('map', false);
  };

  Meteor.startup(function () {
    google.maps.Map.prototype.clearMarkers = function() {
      for(var i=0; i < this.markers.length; i++){
          this.markers[i].setMap(null);
      }
      this.markers = new Array();
    };

    Deps.autorun(function() {
      var isMap = Session.get('map');
      var oldRadius = 100;
      if(isMap) {
        if (Session.get('radius') < oldRadius)
          ;
        oldRadius = Session.get('radius');
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
          marker.setMap(map);
        });    
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
