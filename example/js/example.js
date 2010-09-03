(function($) {
  var soundCloudApiKey = 'qqhlwkbJgox1DEssX9O1Dg';
  var api = $.sc.api(soundCloudApiKey, {
    onAuthSuccess: function(user, container) {
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