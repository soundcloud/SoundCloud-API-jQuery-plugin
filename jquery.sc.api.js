/*
*   SoundCloud API wrapper for jQuery using oAuth2
*   Author: Matas Petrikas, matas@soundcloud.com
*   Copyright (c) 2010  SoundCloud Ltd.
*   Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
*/

// TODOs
// implement HTML5 uplaod flow
// encrypt the security token in the localStorage

(function($) {
  $.sc = $.sc || {};

  // api wrapper event dictionary
  var events = {
    AuthSuccess  : 'onScAuth',
    AuthDenied : 'onScAuthDenied',
    AuthError : 'onScAuthError',
    NonAuth : 'onScNotAuth',
    ApiCall : 'onScApiCall',
    ApiError : 'onScApiError',
    UnSupported: 'onScApiUnsupported'
  };

  $.sc.api = function(apiKey, callerSettings) {
    var settings = $.extend({
          debug: true, // if enabled, will print most errors into browser console
          useSandbox: false, // set it to true, if you're working on your code, revert to false for live deploy
          host: this.useSandbox ? 'sandbox-soundcloud.com' : 'soundcloud.com',
          redirect: window.location.href.replace(/(\?|#).*$/, ''), // redirect after authorization, default is the current page
          container: $('<div id="sc-container"></div>').prependTo(document.body), // the DOM node where the Auth status is displayed
          authRequired: true, // set to false if you need only public resources
          reAuthorize: true, // if true, wil try to re-authorize on expired token
          onAuthSuccess: function(user, container) { // called when valid token is detected
            $('<span class="username">Logged in as: <strong>' + user.username + '</strong></a>').prependTo(container);
          },
          onAuthDeny: function(error) { // called when user denied the authorization
          },
          onNonAuth: function(connectUrl, container) { // called when no valid token is found
            $('<a></a>', {
              html: 'Connect to SoundCloud',
              href: connectUrl,
              'class': 'sc-authorize'
            })
            .prependTo(container);
          },
          onApiError: function(xhr, status, error) { // called when API returns an error
          }
        }, callerSettings || {}),
        log = function(args) {
          if(settings.debug && console && 'log' in console){
            console.log.apply(console, arguments);
          }
        },
        // trigger custom events on certain methods
        anounceEvent = function(eventType, obj) {
          $(document).trigger({type: eventType, scObj : obj});
        },
        // utility for parsing params from query strings
        getParamInQuery = function(path, param) {
          var match = path.match(new RegExp("(?:\\?|&|#)" + param + "=([^&]*)(?:&|$)"));
          if (match) {
            return decodeURIComponent(match[1]);
          }
        },
        // API authorization token
        token,
        tokenId = 'scAuth',
        removeToken = function() {
          // remove the token from the client
          localStorage.removeItem(tokenId);
        },
        // reading token from the location.hash or localStorage
        readToken = function() {
          var rToken = getParamInQuery(window.location.hash, 'access_token'),
              error = getParamInQuery(window.location.href, 'error'),
              now = new Date().getTime(),
              // for now, token is valid for one hour
              tokenLife = 3600,
              ls = window.localStorage,
              tokenObj;
          // in case we're returning from the SoundCloud connect authorization page, store the token in the localStorage
          if(rToken){
            // clear the token from the hash
            window.location.hash = '';
            // store token
            ls.setItem(tokenId, JSON.stringify({token: rToken, host: settings.host, date: now}));
          }else if(error && error === 'user_denied'){
            // remove some eventual old token
            removeToken();
            // if user denied access, let the DOM know about it
            log('getting token: user denied', arguments);
            settings.onAuthDeny(error);
            anounceEvent(events.AuthDenied, {host: settings.host});
          }else if(error && error === 'invalid_client'){
            log('getting token: wrong API key', arguments);
            throw "API key error, please make sure the key you are using is valid!";
          }
          // TODO potentialy some other errors could be handled here too
          // read the token from the localStorage
          tokenObj = JSON.parse(localStorage.getItem(tokenId));
          // check if the token is issued for the correct host
          // check the existing token time expiry
          if(tokenObj && tokenObj.token && tokenObj.host === settings.host && now - tokenObj.date < tokenLife * 1000){
            return tokenObj.token;
          }else{
            return undefined;
          }
        },
        logout = function() {
          removeToken();
          // reload the page without any tokens
          window.location = window.location.href.replace(/(#).*$/, '');
        },
        connectUrl = 'https://' + settings.host + '/connect?client_id=' + apiKey +'&response_type=token&redirect_uri=' + settings.redirect,
        authorize = function() {
          window.location = connectUrl;
        },
        reqHeaders = function (xhr) {
          if(settings.authRequired){
            xhr.setRequestHeader('Authorization', "OAuth " + token);
          }
          xhr.setRequestHeader('Accept', "application/json");
        },
        // call the SoundCloud API, supported signatures: callApi(resource, callback) or callApi(resource, paramsObj, callback)
        callApi = function(params) {
          var onError = function(xhr, status, error) {
                log('callApi: API error', arguments);
                settings.onApiError(xhr, status, error);
                anounceEvent(events.ApiError, {resource: params.resource, xhr: xhr, status: status, error: error});
                // if the token expired, try to reauthorize automatically
                if(settings.reAuthorize){
                  authorize();
                }
              };

          // throw an error if calling api without token and auth needed
          if(settings.authRequired && !token){
            throw "Please authorize before calling the API at  " + settings.host;
          }

          return $.ajax({
                    url: 'https://api.' + settings.host + params.resource,
                    beforeSend: reqHeaders,
                    data: params.data || {},
                    success: function(data, textStatus, xhr) {
                      // check if data is returned, in FF 401 would still trigger success
                      if(!data){
                        onError(xhr, 'Authorization Unsuccessful, client-side catch', 401);
                        return;
                      }
                      if($.isFunction(params.callback)){
                        params.callback(data);
                      }
                      anounceEvent(events.ApiCall, {resource: params.resource, data: data});
                    },
                    error: onError
                  });
        },
        // handle multiple method signatures, jQuery style
        prepareCallObj = function(args, method) {
          var obj = {resource: args[0], method: method};
          if(args.length === 3){
            obj.callback = args[2];
            obj.data = args[1];
          }else{
            obj.callback = $.isFunction(args[1]) ? args[1] : null;
            obj.data = $.isFunction(args[1]) ? {} : args[1];
          }
          return obj;
        },
        // generate API methods
        callMethod = function(method) {
          return function(resource, data, callback) {
            return callApi(prepareCallObj(arguments, method));
          };
        },
        // gets the currently authorized user
        getMe = function(callback) {
          callMethod('GET')('/me', callback);
        },
        // checks if the wrapper is supported on this client
        supported = true;

    // check if the browser supports the wrapper, check if we have a token available
    if((JSON && 'parse' in JSON) && (localStorage && 'getItem' in localStorage)){
      token = readToken();
    }else{
      supported = false;
      log('SoundCloud API: the browser is not currently supported');
      anounceEvent(events.UnSupported);
    }

    if(!apiKey){
      // check if the developer provided an api key
      throw "Please provide an API key for " + settings.host;
    }else if(token){
      // if already authorized, try to get the logged in user's data
      getMe(function(user) {
        settings.onAuthSuccess(user, settings.container);
        anounceEvent(events.AuthSuccess, {user: user});
      });
    }else{
      // if not yet authorized, execute default callback
      if(settings.authRequired){
        settings.onNonAuth(connectUrl, settings.container);
      }
      anounceEvent(events.NonAuth, {connectUrl: connectUrl});
    }
    // if the wrapper is functional, return the public interface
    return {
      isAuthorized: !!token,
      supported: supported,
      authorize: authorize,
      logout: logout,
      callApi: callApi,
      get: callMethod('GET'),
      post: callMethod('POST'),
      put: callMethod('PUT'),
      'delete': callMethod('DELETE')
    };
  };
  // make events available publicly
  $.sc.api.events = events;

})(jQuery);