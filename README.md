A customizable __Security Token Service__ meant to be used with [Auth0](http://auth0.com).

It speaks Ws-Federation with Saml11 tokens.

## Customize the user validation mechanism

You can customize the way user and password are validated by changing the ```user.js``` file. 

There are some examples in the example folder.

## Customize the login form

By default the login looks like this:

![](http://content.screencast.com/users/ezequielm/folders/Default/media/14c3f8e4-e1c3-4c9f-9f91-d64e46fce7a1/signin.png)

You can change ```views/login.ejs```, ```public/site.css``` and ```public/imgs/logo.png```.

## Customize the sign up form

By default the sign up looks like this:

![](http://content.screencast.com/users/ezequielm/folders/Default/media/7bcf3eb7-5b3b-4dbe-99da-be9cff5e2940/signup.png)

You can change ```views/signup.ejs```, ```public/site.css``` and ```public/imgs/logo.png```.

If you add required attributes, *e.g. phone_number*, to ```user.js``` you can add it to ```views/signup.ejs```:

	<p><input name="phone_number" type="text" id="phone_number" required ></p>

## License

MIT!
