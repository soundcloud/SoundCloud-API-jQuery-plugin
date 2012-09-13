(function($) {
  var soundCloudApi_Client_ID  = '542bdb53829b5b7cf02988d566c708de';
  var api = $.sc.api(soundCloudApi_Client_ID, {
    onAuthSuccess: function(user, container) {
     if ( ! user.id ) { user = JSON.parse(user); }
      $('<span class="username">Logged in as: <strong>' + user.username + '</strong></a>').prependTo(container);
      console.log('you are SoundCloud user ' + user.username);
    }
  });
  
  // wait for the API to be available
  $(document).bind($.sc.api.events.AuthSuccess, function(event) {
    var user = event.user;
    // call the api
    api.get('/me/tracks', function(data) {
      console.log('and here are your tracks', data);
      // you can use new jQuery templating for generating the track list
      $('#track').render(data).appendTo("#track-list");
    });
  });


})(jQuery);
