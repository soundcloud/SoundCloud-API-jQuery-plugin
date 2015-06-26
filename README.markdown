## jQuery plugin: SoundCloud oAuth 2.0 API wrapper

### A simple usage example

Include the plugin in your HTML code:

```html
<script type="text/javascript" charset="utf-8" src="scripts/jquery.sc.api.js"></script>
```

and then, initialize it:

```javascript
var api = $.sc.api('qqhlwkbJgox1DEssX9O1Dg');
```

or handle the successful authorization yourself:

```javascript
var api = $.sc.api('qqhlwkbJgox1DEssX9O1Dg', {
  onAuthSuccess: function(user, container) {
    alert('you are SoundCloud user ' + user.username);
  }
});
```

also instead of passing the callbacks you can use the custom events:

```javascript
var api = $.sc.api('qqhlwkbJgox1DEssX9O1Dg');
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
