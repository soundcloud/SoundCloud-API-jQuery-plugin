## jQuery plugin: SoundCloud oAuth 2.0 API wrapper

### A simple usage example

First and most important, you'll need to get a Client ID from SoundCloud. If
you haven't got one already, just register an app on the SoundCloud [Apps][] page.

[apps]: http://soundcloud.com/you/apps/new

Include the plugin in your HTML code:

```html
<script type="text/javascript" charset="utf-8" src="scripts/jquery.sc.api.js"></script>
```

and then, initialize it:

```javascript
var api = $.sc.api('Enter your Client ID here');
```

or handle the successful authorization yourself:

```javascript
var api = $.sc.api('Enter your Client ID here', {
  onAuthSuccess: function(user, container) {
    alert('you are SoundCloud user ' + user.username);
  }
});
```

also instead of passing the callbacks you can use the custom events:

```javascript
var api = $.sc.api('Enter your Client ID here');
$(document).bind($.sc.api.events.AuthSuccess, function(event) {
  var user = event.user;
  // do something with the user object or call the api
  api.get('/me/tracks', function(tracks) {
    console.log(tracks);
  })
});
```

Please refer to the [wiki][] for full documentation.

[wiki]: https://github.com/soundcloud/SoundCloud-API-jQuery-plugin/wiki
