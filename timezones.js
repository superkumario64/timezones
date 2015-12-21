Timezones = new Mongo.Collection('timezones');

if (Meteor.isClient) {
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  //ready for mobile apps
  function onReady() {
    angular.bootstrap(document, ['simple-timezones']);
  }
 
  if (Meteor.isCordova)
    angular.element(document).on('deviceready', onReady);
  else
    angular.element(document).ready(onReady);
 
  // This code only runs on the client
  angular.module('simple-timezones',['angular-meteor']);
 
  angular.module('simple-timezones').controller('TimezonesListCtrl', ['$scope', '$meteor', '$timeout',
    function ($scope, $meteor, $timeout) {
      $scope.$meteorSubscribe('timezones');
      
      $scope.timezones = $meteor.collection(function() {
        return Timezones.find({});
      });
      
      $scope.allTimezones =  moment.tz.names();
      
      $scope.setTimezone = function (timezone) {
        $meteor.call('setTimezone', timezone);
      };
      
      $scope.getUserTimezone = function (){
        if (typeof Meteor.user() !== 'undefined'){
          var tz = Timezones.findOne({"owner": Meteor.userId()});
          if (typeof tz !== "undefined") {
            return tz.timezone;
          } else {
            return "";
          }
        }
        return "";
      };
      
      $scope.getDistinctUserTimezones = function(){
          var distinctEntries = _.uniq(Timezones.find({}, {
              sort: {timezone: 1}, fields: {timezone: true}
          }).fetch().map(function(x) {
              return x.timezone;
          }), true);
          return distinctEntries;
      };
      
      //grabs the first 2 chars from logged in user
      $scope.getUserInitials = function () {
        if (typeof Meteor.user() !== 'undefined' && Meteor.user() != null)
          return Meteor.user().username.substring(0,2).toUpperCase();
      };
      
      $scope.getInitialsFromUsername = function(username) {
          return username.substring(0,2).toUpperCase();
      }
      
      $scope.clock = moment();
      $scope.tickInterval = 1000;
      var tick = function () {
          $scope.clock = moment();
          $timeout(tick, $scope.tickInterval);
      }
      $timeout(tick, $scope.tickInterval);
      
      $scope.getLocalTime = function(timezone) {
          return $scope.clock.tz(timezone).format('ddd, h:mm a');
      }
  }]);
}

Meteor.methods({
  setTimezone: function (timezone) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    var tz = Timezones.findOne({"owner": Meteor.userId()});
    if (typeof tz !== "undefined"){
      // Make sure only the owner can change their timezone
      if (tz.owner !== Meteor.userId()) {
        throw new Meteor.Error('not-authorized');
      }
      Timezones.update(tz._id, { $set: { timezone: timezone} });
    } else {
      Timezones.insert({
        timezone: timezone,
        createdAt: new Date(),
        owner: Meteor.userId(),
        username: Meteor.user().username
      });
    } 
  }
});

if (Meteor.isServer) {
  Meteor.publish('timezones', function () {
    return Timezones.find({});
  });
}