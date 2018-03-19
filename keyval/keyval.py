from flask import Flask, jsonify, request, g, session

from sqlalchemy import create_engine, Table, Column, String, Integer
from sqlalchemy import ForeignKey, MetaData, select, update, insert
from sqlalchemy import delete, bindparam

app = Flask(__name__)

def setupDb():
    if hasattr(g, 'engine'):
        return

    g.engine = create_engine('sqlite:///key_values', echo=True)
    g.metadata = MetaData()
    
    # quick and dirty way (for me) to either setup the db from
    # scratch or connect to existing; in real life believe I'd
    # grab the metadata from the existing db
    g.users = Table('users', g.metadata,
        Column('id', Integer, primary_key=True),
        Column('name', String)
    )

    g.keyvalues = Table('keyvalues', g.metadata,
        Column('id', Integer, primary_key=True),
        Column('user_id', None, ForeignKey('users.id')),
        Column('key', String),
        Column('value', String)
    )

    g.metadata.create_all(g.engine)

    g.conn = g.engine.connect()
    return g.conn
    
def init_db():
    engine = create_engine('sqlite:///key_values', echo=True)
    metadata = MetaData()
    users = Table('users', metadata,
        Column('id', Integer, primary_key=True),
        Column('name', String)
    )

    keyvalues = Table('keyvalues', metadata,
        Column('id', Integer, primary_key=True),
        Column('user_id', None, ForeignKey('users.id')),
        Column('key', String),
        Column('value', String)
    )

    metadata.create_all(engine)


@app.cli.command('initdb')
def initdb_command():
    init_db()
    print "initialized database"

@app.teardown_appcontext
def close_db(error):
    if hasattr(g, 'engine'):
        g.engine.dispose()


# some global vars for result codes

SUCCESS = 1
FAIL = 0

# routes

@app.route("/")
def site_index():
    return app.send_static_file('index.html')

@app.route("/static/<filename>")
def jsfile(filename):
    return app.send_static_file(filename)


def key_exists(key, user_id, conn):
    s = g.keyvalues.select().\
        where(g.keyvalues.c.user_id == bindparam("user_id")).\
        where(g.keyvalues.c.key == bindparam("key"))
    result = conn.execute(s, user_id=user_id, key=key)
    return len([ row for row in result ]) > 0

@app.route('/get')
def get_key():
    if not 'user_id' in session:
        return jsonify({'result': FAIL, 'message': 'user not logged in'})
    user_id = session['user_id']
    conn = setupDb()
    try:
        key = request.args.get('key',)
        s = g.keyvalues.select().\
            where(g.keyvalues.c.key == bindparam("key")).\
            where(g.keyvalues.c.user_id == bindparam("user_id"))
        result = conn.execute(s, key=key, user_id=user_id)
        response = []
        for row in result:
            response.append({ 'key': row[g.keyvalues.c.key], 
                'value': row[g.keyvalues.c.value]})
        return jsonify({ 'result': SUCCESS, 'data': response })
    except:
        return jsonify({ 'result': FAIL })


@app.route('/set')
def set_key_value():
    if not 'user_id' in session:
        return jsonify({'result': FAIL, 'message': 'user not logged in'})
    user_id = session['user_id']
    conn = setupDb()
    key = request.args.get('key')
    value = request.args.get('value')
    try:
        if key_exists(key, user_id, conn):
            # update
            upd = g.keyvalues.update().\
                where(g.keyvalues.c.user_id == bindparam('userid')).\
                where(g.keyvalues.c.key == bindparam('thekey')).\
                values(value=value)
            result = conn.execute(upd, userid=user_id, thekey=key)
            return jsonify({ 'result': SUCCESS })

        else:
            # insert
            ins = g.keyvalues.insert().values(user_id=user_id, key=key, value=value)
            print ins.compile().params
            result = conn.execute(ins)
            return jsonify({ 'result': SUCCESS, 'data': result.inserted_primary_key})
    except Exception as e:
        return jsonify({ 'result': FAIL, 'message': str(e) })

@app.route('/delete')
def delete_keys():
    if not 'user_id' in session:
        return jsonify({'result': FAIL, 'message': 'user not logged in'})
    user_id = session['user_id']
    conn = setupDb()
    s = g.keyvalues.delete(g.keyvalues.c.user_id == bindparam('user_id'))
    result = conn.execute(s, user_id=user_id)
    return jsonify({ 'result': SUCCESS})

@app.route('/getall')
def get_all():
    if not 'user_id' in session:
        return jsonify({'result': FAIL, 'message': 'user not logged in'})
    user_id = session['user_id']
    conn = setupDb()
    s = g.keyvalues.select(g.keyvalues.c.user_id == bindparam('user_id'))
    result = conn.execute(s, user_id=user_id)
    rows = []
    for row in result:
        rows.append({ 'key': row[g.keyvalues.c.key], 'value': row[g.keyvalues.c.value] })
    return jsonify({ 'result': SUCCESS, 'data': rows })

@app.route('/isloggedin')
def isLoggedIn():
    try:
        if 'user_id' in session:
            conn = setupDb()
            s = g.users.select().where(g.users.c.id == bindparam('userid'))
            result = conn.execute(s, userid=session['user_id'])
            username = None
            for row in result:
                username = row[g.users.c.name]
            return jsonify({ 'result': SUCCESS, 'data': { 'username' : username }})
        else:
            return jsonify({ 'result': SUCCESS, 'data': { 'username' : None } })
    except:
        return jsonify({ 'result': FAIL})

@app.route('/login')
def login():
    try:
        if 'user_id' in session:
            return jsonify({ 'result': FAIL, 'message': 'already logged in'})
        username = request.args.get('username')
        conn = setupDb()
        s = g.users.select(g.users.c.name == bindparam("username"))
        result = conn.execute(s, username=username)
        user_id = None
        for row in result:
            user_id = row[g.users.c.id]
        if user_id:
            session['user_id'] = user_id
            return jsonify({ 'result': SUCCESS })
        else:
            return jsonify({ 'result': FAIL, 'message': 'unknown user' })
    except:
        return jsonify({ 'result': FAIL})

@app.route('/logout')
def logout():
    try:
        session.pop('user_id', None)
        return jsonify({ 'result': SUCCESS })
    except:
        return jsonify({ 'result': FAIL})

@app.route('/signup')
def signup():
    try:
        if 'user_id' in session:
            return jsonify({ 'result': FAIL, 'message': 'must logout first' })
        username = request.args.get('username')
        conn = setupDb()
        s = g.users.select(g.users.c.name == bindparam('username'))
        result = conn.execute(s, username=username)
        if len([row[g.users.c.id] for row in result]) > 0:
            return jsonify({ 'result': FAIL, 'message': 'user name already taken' })
        ins = g.users.insert().values(name=username)
        print ins.compile().params
        result = conn.execute(ins)
        return jsonify({ 'result': SUCCESS })        
    except Exception as e:
        return jsonify({ 'result': FAIL, 'message': str(e) })

@app.route('/unsubscribe')
def unsubscribe():
    try:
        if not 'user_id' in session:
            return jsonify({'result': FAIL, 'message': 'user not logged in'})
        user_id = session['user_id']
        conn = setupDb()
        s = g.keyvalues.delete(g.keyvalues.c.user_id == bindparam('user_id'))
        result = conn.execute(s, user_id=user_id)
        s = g.users.delete(g.users.c.id == bindparam('user_id'))
        result = conn.execute(s, user_id=user_id)
        # log the user out
        session.pop('user_id', None)
        return jsonify({ 'result': SUCCESS })

    except Exception as e:
        return jsonify({ 'result': FAIL, 'message': str(e) })

# to encode session data
app.secret_key = 'A0Zr99k/3yX R~XHH!jmN]LWX/,?RT'
