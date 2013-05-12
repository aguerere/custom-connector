This is an example of user script using MySql.

1. Copy users.js to the root folder.
2. Edit users.js to match your desired logic.
3. Run "npm install mysql" from the root of this project.
4. Run with ```npm start``` and set the ticket number
5. Edit the ```config.json``` file to add the connection settings like this:

~~~javascript
  "MYSQL_CONNECTION": {
    "host": "localhost",
    "user": "root",
    "password": "thepassword",
    "database": "myusersdb"
  }
~~~