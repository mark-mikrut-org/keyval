keyval:
a key value getter/setter website; uses flask as backend, html/javascript as 
front end.

To run the website, you need to run flask.  To do that you need to first have
a python 2.7 environment, and make sure that flask and sqlalchemy are installed
in it.  I use anaconda to manage my python versions and dependencies, so for me:

conda create -n py27 python=py27
. activate py27
conda install flask
conda install sqlalchemy


OK, now to actually run it:

# from the root where this project is installed
# for FLASK/DB debug info, set this first
FLASK_DEBUG=true
# and then start up flask on the app
FLASK_APP=keyval/keyval.py flask run



this will start the http server on your localhost, on port 5000 (you can change the host
and/or port via command-line arguments)...


From your browser, load http://localhost:5000

Here, you can "Signup" as a username.  Once signed up, you can login as
that user, and from there can set, get, getall, deleteall your key/values. You can
logout when finished as that user.  Note that your login is preserved in flask
session information stored in your browser, so if you don't logout you'll still be
loged in if you close your browser tab/window, and come back later.  And of course
you can signup as multiple users.  Each user is separate -- key values are kept
by user, and users can't see or change each other's keys/values.

Note that I haven't bothered with user password protection for this small project.
That would not be hard to add.




Note that I've included the necessary things so that you can install keyval via pip
into your python environment as a package if you like:

# do this to install via pip
pip install <path to the project root>

