# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Standard Modules
from flask import Flask, g, request, Response, flash, redirect, url_for, send_file                               # Flask App Lib
from werkzeug.utils import secure_filename                                                                       # Secure File Upload Lib
from flask_cors import CORS                                                                                      # CO Res Sharing Lib
from flask_sqlalchemy import SQLAlchemy                                                                          # SQLAlchemy Lib
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth                                                          # Basic/Token Auth Lib
from string import ascii_letters, digits                                                                         # String Functions
from random import choice, choices                                                                               # Random Gen Function
from psutil import Process                                                                                       # Process Lib
from logging.handlers import RotatingFileHandler                                                                 # Rotated Logging Lib
from werkzeug.security import generate_password_hash, check_password_hash                                        # Hashing Lib
import time as timeLib                                                                                           # Time Lib
from flask_caching import Cache                                                                                  # Caching Lib
from threading import Timer                                                                                      # Timer Lib
from site import getsitepackages                                                                                 # Site Package Function

# IMPORT: Custom Modules
from basic import *                                                                                              # Basic Lib
import services                                                                                                  # Services from Lib
import actions                                                                                                   # Actions from Lib
import validate                                                                                                  # Validate from Lib
import tables                                                                                                    # Tables from Lib
import filters                                                                                                   # Filters from Lib


# START TIME OF SERVICE
serviceStart = datetime.now()

# RESTART APP STATUS
restartEnabled = False


# FUNCTION: Periodic Clear Sessions
def periodicClearSessions():
    try:
        oldSessions = db.session.query(tables.ActiveSession).filter(tables.ActiveSession.lastActive < (datetime.now() - timedelta(days=14)).replace(tzinfo=timezone.utc)).all()
        [db.session.delete(oldSession) for oldSession in oldSessions]
        db.session.commit()
        appLogger.info('Cleared old sessions')
        Timer(86400, periodicClearSessions).start()
    except:
        appLogger.warning('Unable to clear old sessions')

# FUNCTION: Sys Path Check
def sysPathCheck():
    try:
        sitePackagePath = [path for path in getsitepackages() if ('site-packages' in path)][0]
        sysPathFile = sitePackagePath + ('' if (sitePackagePath.endswith('/')) else '/') + 'neatly-base.pth'
        if (os.path.isfile(sysPathFile)):
            sysPathFileContent = readTextFile(sysPathFile)
            if (sysPathFileContent == locationConfig['lib']):
                appLogger.info('Sys path reference is up-to-date')
            else:
                appLogger.debug('Updating sys path reference')
                writeTextFile(sysPathFile, locationConfig['lib'])
                appLogger.info('Updated sys path reference')
        else:
            appLogger.debug('Adding sys path reference')
            writeTextFile(sysPathFile, locationConfig['lib'])
            appLogger.info('Added sys path reference')
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Update Web Server
def updateWebServer(basePath, apiPort, apiProtocol, apiSSLCertificate, apiSSLKey, guiProtocol):
    try:
        appLogger.debug('Updating Nginx configuration')
        removeFile('/etc/nginx/conf.d/default_gui.conf')
        writeReplacedTextFile('/etc/nginx/conf.d/default_gui.conf', readTextFile('/etc/nginx/templates/' + guiProtocol + '/default_gui.conf'), {'{{basePath}}': basePath, '{{protocol}}': apiProtocol, '{{port}}': str(apiPort), '{{certPath}}': str(apiSSLCertificate), '{{keyPath}}': str(apiSSLKey)})
        appLogger.debug('Updated Nginx configuration')
        services.restartWebServer()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Load API Config
def loadAPIConfig():
    try:
        global apiConfig, basePath, getCallConfig, apiVersion, apiPort, debug, apiProtocol, apiSSLCertificate, apiSSLKey
        appLogger.debug('Loading API config')
        apiConfig = readJSONFile('/etc/neatly/base/api/api.json')                                                        # API Configuration
        basePath = apiConfig['basePath']                                                                                 # API Base Path
        getCallConfig = apiConfig['getCallConfig']                                                                       # GET Call Config
        apiVersion = apiConfig['version']                                                                                # API Version
        apiPort = apiConfig['port']                                                                                      # API Port
        debug = apiConfig['debug']                                                                                       # API Debug Mode
        if 'protocol' in apiConfig:
            apiProtocol = apiConfig['protocol']
            if (apiProtocol == 'https'):
                if ('ssl' in apiConfig) and ('certificate' in apiConfig['ssl']) and ('key' in apiConfig['ssl']):
                    apiSSLCertificate = apiConfig['ssl']['certificate']
                    apiSSLKey = apiConfig['ssl']['key']
                else:
                    apiProtocol = 'http'
                    apiSSLCertificate = None
                    apiSSLKey = None
            else:
                apiProtocol = 'http'
                apiSSLCertificate = None
                apiSSLKey = None
        else:
            apiProtocol = 'http'
            apiSSLCertificate = None
            apiSSLKey = None
        appLogger.debug('Loaded API config')
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Load GUI Config
def loadGUIConfig():
    try:
        global guiConfig, guiVersion, guiProtocol
        appLogger.debug('Loading GUI config')
        guiConfig = readJSONFile('/etc/neatly/base/gui/gui.json')                                                        # GUI Configuration
        guiVersion = guiConfig['version']                                                                                # GUI Version
        guiProtocol = guiConfig['protocol']                                                                              # GUI Protocol
        appLogger.debug('Loaded GUI config')
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Load Component Versions
def loadComponentVersions():
    try:
        global dbVersion, webServerVersion, messagingVersion, pythonVersion
        appLogger.debug('Loading component versions')
        dbVersion = determineDBVersion(db.session)                                                                       # DB Version
        webServerVersion = determineWebServerVersion()                                                                   # Webserver Version
        messagingVersion = determineKafkaVersion()                                                                       # Messaging Version
        pythonVersion = determinePythonVersion()                                                                         # Python Version
        appLogger.debug('Loaded component versions')
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Sync GUI Configuration
def syncGUIConfiguration():
    try:
        appLogger.info('Syncing GUI configuration with web server')
        if (not os.path.isfile(locationConfig['gui'] + 'assets/config.json')):
            try:
                result = getoutput('ln -s /etc/neatly/base/gui/gui.json ' + locationConfig['gui'] + 'assets/config.json')
                appLogger.info('Successfully created symbolic link for GUI configuration')
            except:
                appLogger.error('Failed to create symbolic link for GUI configuration')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/translations')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/translations/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI translations')
            except:
                appLogger.error('Failed to create symbolic link for GUI translations')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/backgrounds')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/backgrounds/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI backgrounds')
            except:
                appLogger.error('Failed to create symbolic link for GUI backgrounds')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/routes')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/routes/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI routes')
            except:
                appLogger.error('Failed to create symbolic link for GUI routes')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/icons')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/icons/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI icons')
            except:
                appLogger.error('Failed to create symbolic link for GUI icons')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/logos')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/logos/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI logos')
            except:
                appLogger.error('Failed to create symbolic link for GUI logos')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/images')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/images/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI images')
            except:
                appLogger.error('Failed to create symbolic link for GUI images')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/gui/svgs')):
            try:
                result = getoutput('ln -s ' + '/etc/neatly/base/gui/svgs/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for GUI SVGs')
            except:
                appLogger.error('Failed to create symbolic link for GUI SVGs')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
        if (not os.path.isdir(locationConfig['gui'] + 'assets/objects')):
            try:
                result = getoutput('ln -s ' + locationConfig['lib'] + 'objects/' + ' ' + locationConfig['gui'] + 'assets/')
                appLogger.info('Successfully created symbolic link for objects')
            except:
                appLogger.error('Failed to create symbolic link for objects')
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# DEFINITION: Flask Service
app = Flask(__name__)

# DEFINITION: Flask Caching
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# DEFINITION: Flask Authentication Services
basicAuth = HTTPBasicAuth()
tokenAuth = HTTPTokenAuth(scheme='Token')


# CONFIGURATION: Flask Application
dbConfig = readJSONFile('/etc/neatly/base/db.json')
app.config['SQLALCHEMY_DATABASE_URI'] = createDBPathConfig(dbConfig['connection'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False
app.json_encoder = CustomJSONEncoder
app.json_decoder = CustomJSONDecoder
CORS(app)

# CONFIGURATION: SQL ALCHEMY
sqlOptions = {'autoflush': False}

# CONFIGURATION: Create DB Session (Global)
global db
db = SQLAlchemy(app, session_options=sqlOptions)


# SYNC GUI CONFIGURATION
syncGUIConfiguration()


# CONFIGURATION: Create Logger
loggingConfig = readJSONFile('/etc/neatly/base/logging.json')
apiLogger = createLogger('apiLogger', createFilePathConfig(loggingConfig, 'api'), getattr(logging, loggingConfig['api']['level']))
apiLogger.debug('Created API logger (Flask)')

# CONFIGURATION: API Config
loadAPIConfig()

# CONFIGURATION: GUI Config
loadGUIConfig()

# CONFIGURATION: Component Versions
loadComponentVersions()

# SYS PATH CHECK (SITE-PACKAGES)
sysPathCheck()

# PERFORM CLEAR SESSION JOB
periodicClearSessions()


# FUNCTION: Reinitialise DB
def reInitDB():
    global db
    db = SQLAlchemy(app, session_options=sqlOptions)

# FUNCTION: Session Key Generation
def sessionkeyGenerator(size=100, chars=ascii_letters + digits):
    return ''.join(choice(chars) for _ in range(size))

# FUNCTION: Get All Tables
def getAllTables():
    return [classname[0] for classname in inspecter.getmembers(tables, inspecter.isclass) if (classname[1].__module__ == 'tables') and (classname[0] != 'Generic')]

# FUNCTION: Get All Tables (Lower Case)
def getAllTablesLowerCase():
    return [classname[0].lower() for classname in inspecter.getmembers(tables, inspecter.isclass) if (classname[1].__module__ == 'tables') and (classname[0] != 'Generic')]

# FUNCTION: Get Class by Name
def getClassByName(name):
    classes = [classname[1] for classname in inspecter.getmembers(tables, inspecter.isclass) if (classname[1].__module__ == 'tables') and ((classname[0].lower() == name.lower()) or (getTableName(classname[0]) == name.lower()))]
    if len(classes) == 1:
        return classes[0]
    else:
        return None

# FUNCTION: Get Class Name
def getClassName(name):
    return [classname[0] for classname in inspecter.getmembers(tables, inspecter.isclass) if (classname[1].__module__ == 'tables') and (classname[0] != 'Generic') and ((classname[0].lower() == name.lower()) or (getTableName(classname[0]) == name.lower()))][0]

# FUNCTION: Check if Obj is in Get Call Config
def inGetCallConfig(name):
    return getClassName(name) in getCallConfig

# FUNCTION: Get KeyWord Argument
def getKeyWordArgument(args, item):
    if (item in args):
        return args[item]
    else:
        return None

# FUNCTION: Parse API Path Options
def parseAPIPathOptions(options, types):
    try:
        if options:
            parsedOptions = {}
            for type in types:
                if ((type + '=') in options):
                    if (type == 'filter'):
                        parsedOptions[type] = options.split(type + '=')[1]
                        parsedOptions[type] = '&'.join([option for option in parsedOptions[type].split('&') if option.startswith('(')])
                    else:
                        try:
                            parsedOptions[type] = (int(options.split(type + '=')[1].split('&')[0]) if (types[type] == 'int') else options.split(type + '=')[1].split('&')[0])
                        except:
                            parsedOptions[type] = None
                elif (not types[type]):
                    parsedOptions[type] = ((('&' + type + '&') in options) or (options.endswith('&' + type)))
                else:
                    parsedOptions[type] = None
            return parsedOptions
        else:
            return {x: None for x in types}
    except:
        return {x: None for x in types}

# FUNCTION: Sort By
def sortBy(x, sort):
    result = x
    for sortOption in sort.split('.'):
        result = result[sortOption]
        if (result == None):
            return 'zzzzzzzzzzzzzzzzzzzz'
    return str(result)

# FUNCTION: Result Format Wrapper
def resultFormatWrapper(objects, rights, limit, count, sort, order, directSortable, perPage, page, options=[]):
    try:
        serialized = ('serialized' in options)
        needToSort = (sort and (not directSortable))
        if (needToSort):
            if (not serialized):
                objects = serializeListObject(objects, rights)
            try:
                objects = sorted(objects, key=lambda x: sortBy(x, sort), reverse=((order != None) and (order.upper() == 'DESC')))
            except:
                return ('', 400) # noCoverage
        if ((limit) and (limit > 0)):
            objects = objects[0:limit]
        if (count):
            return jsonify(len(objects))
        if (perPage and page):
            if (perPage > 0):
                totalObjects = objects
                objects = splitArrayInEqualParts(objects, perPage)
                if (page < 1):
                    return ('', 400) # noCoverage
                elif ((len(objects) == 0) and (page == 1)):
                    return jsonify({'page': 1, 'maxPage': 1, 'perPage': perPage, 'total': len(totalObjects), 'content': []})
                elif (page > (len(objects))):
                    return ('', 400) # noCoverage
                else:
                    maxPage = len(objects)
                    objects = objects[page-1]
                    return jsonify({'page': page, 'maxPage': maxPage, 'perPage': perPage, 'total': len(totalObjects), 'content': objects if (needToSort or serialized) else serializeListObject(objects, rights)})
            else:
                return ('', 400) # noCoverage
        else:
            return jsonify(objects if (needToSort or serialized) else serializeListObject(objects, rights))
    except:
        return jsonify(objects if (needToSort or serialized) else serializeListObject(objects, rights))

# FUNCTION: Serialize List Object
def serializeListObject(objects, rights):
    try:
        return [obj.getPublic(getCallConfig, {'user': g.user, 'right': rights}) for obj in objects]
    except:
        return [obj.getPublic(getCallConfig, {'user': g.user, 'right': rights}) for obj in objects]

# FUNCTION: Start Flask Application
def startApp():
    try:
        # Disable Restart Status
        global restartEnabled
        restartEnabled = False
        # Debug Off: No Automatic API Reloads
        if (apiProtocol == 'http'):
            app.run(host='0.0.0.0', port=apiPort, debug=debug, use_reloader=False)
        elif (apiProtocol == 'https'):
            app.run(host='0.0.0.0', port=apiPort, debug=debug, use_reloader=False, ssl_context=(apiSSLCertificate, apiSSLKey))
        else:
            appLogger.error('Invalid API protocol \'' + str(apiProtocol) + '\', unable to start API') # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Restart Flask Application
def restartApp():
    try:
        global restartEnabled
        restartEnabled = True
        loadAPIConfig()
        loadGUIConfig()
        updateWebServer(basePath, apiPort, apiProtocol, apiSSLCertificate, apiSSLKey, guiProtocol)
        appLogger.info('Initiating API restart')
        shutdownServer()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Launch
def launch():
    # Start API
    startApp()
    # API Restart Listener
    while (restartEnabled):
        appLogger.info('Restarting API')
        startApp()
    appLogger.warning('API process stopped') # noCoverage

# FUNCTION: Switch API Protocol
def switchAPIProtocol(protocol):
    try:
        appLogger.debug('Switching API to protocol: ' + protocol)
        updateAPIProtocol(protocol)
        restartApp()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Switch GUI Protocol
def switchGUIProtocol(protocol):
    try:
        appLogger.debug('Switching GUI to protocol: ' + protocol)
        updateGUIProtocol(protocol)
        restartApp()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Shutdown Flask Application
def shutdownServer():
    try:
        appLogger.info('Shutting down Flask application')
        func = request.environ.get('werkzeug.server.shutdown')
        func()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Get Size of Response
def getResponseSize(response):
    try:
        return response.headers['Content-Length']
    except:
        return 0

# FUNCTION: Get Info of API Call
def apiCallInfo(request, response, start):
    try:
        sep = ' - '
        return 'API' + sep + str(request.environ['REMOTE_ADDR']) + sep + str(request.environ['REQUEST_METHOD']) + sep + str(request.environ['REQUEST_URI']) + sep + str(response._status_code) + sep + str(int((timeLib.time()-start)*1000)) + 'ms' + sep + str(getResponseSize(response)) + 'B'
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return 'Something went wrong while gathering API call info'

# FUNCTION: Measure API Response Calculation Time
@app.before_request
def beforeRequest():
    g.start = timeLib.time()

# FUNCTION: Log API Call
@app.after_request
def afterRequest(response):
    apiLogger.info(apiCallInfo(request, response, g.start))
    if (hasattr(g, 'session')):
        g.session.lastActive = datetime.now().replace(tzinfo=timezone.utc)
        try:
            db.session.commit()
        except:
            pass
    return response

# FUNCTION: Basic Auth Validation (User/Pass)
@basicAuth.verify_password
def basicAuthVerifyPassword(userName, password):
    try:
        user = db.session.query(tables.User).filter_by(userName=userName).first()
        if user:
            g.user = user
            if (not g.user.password):
                return False
            else:
                return check_password_hash(g.user.password, password)
        else:
            return False
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Token Auth Validation
@tokenAuth.verify_token
def tokenAuthVerifyToken(token):
    try:
        session = db.session.query(tables.ActiveSession).filter_by(token=token).first()
        if session:
            g.user = session.user
            g.session = session
            return True
        else:
            return False
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# CALL: Basic Auth Success Result
@app.route(basePath + 'login', methods=['GET'])
@basicAuth.login_required
def basicAuthSuccess():
    try:
        newToken = sessionkeyGenerator()
        g.user.activesession.append(tables.ActiveSession(token=newToken, ip=request.remote_addr, client=(request.headers['User-Agent'] if ('User-Agent' in request.headers) else None), user=g.user))
        actions.merge(g.user, db.session, g.user, {})
        return jsonify({'authentication': True, 'token': newToken, 'expiryDate': 14})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# CALL: Basic Auth Error Message
@basicAuth.error_handler
def basicAuthError():
    return jsonify({'authentication': False})

# CALL: Token Auth Success Result
@app.route(basePath + 'token', methods=['GET'])
@tokenAuth.login_required
def tokenAuthSuccess():
    try:
        return jsonify({'authentication': True, **g.user.getPublic(getCallConfig, None)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# CALL: Token Auth Error Message
@tokenAuth.error_handler
def tokenAuthError():
    return jsonify({'authentication': False})


# GET: Item by Id
@app.route(basePath + '<path:path>/id/<int:id>', methods=['GET'])
@app.route(basePath + '<path:path>/id/<int:id>&config', methods=['GET'])
@app.route(basePath + '<path:path>/id/<int:id>&logs', methods=['GET'])
@app.route(basePath + '<path:path>/id/<int:id>&status', methods=['GET'])
@tokenAuth.login_required
def getItemById(**kwargs):
    try:
        path = getKeyWordArgument(kwargs, 'path')
        id = getKeyWordArgument(kwargs, 'id')
        if (path in getAllTablesLowerCase()) and inGetCallConfig(path):
            object = getClassName(path)
            rights = actions.checkRights(db.session, tables.Right, g.user, object, 'Get by Id')
            if not rights:
                return ('', 403) # noCoverage
            classObject = getClassByName(object)
            noFilterByRights = noRightObject(classObject, rights)
            item = db.session.query(classObject).filter_by(id=id).first()
            if item:
                if filterByRights(item, g.user, rights, None):
                    return jsonify(item.getPublic(getCallConfig, {'user': g.user, 'right': rights}))
                else:
                    return ('', 404) # noCoverage
            else:
                return ('', 404) # noCoverage
        return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Item List
@app.route(basePath + '<path:path>/list', methods=['GET'])
@app.route(basePath + '<path:path>/list&status', methods=['GET'])
@app.route(basePath + '<path:path>/list&self', methods=['GET'])
@app.route(basePath + '<path:path>/list&<string:options>', methods=['GET'])
@tokenAuth.login_required
def getItemList(**kwargs):
    try:
        path = getKeyWordArgument(kwargs, 'path')
        optionTypes = {'level': 'str', 'filter': 'str', 'perPage': 'int', 'page': 'int', 'sort': 'str', 'order': 'str', 'limit': 'int', 'count': None, 'status': None}
        options = parseAPIPathOptions(getKeyWordArgument(kwargs, 'options'), optionTypes)
        level = options['level']
        filter = options['filter']
        perPage = options['perPage']
        page = options['page']
        sort = options['sort']
        order = options['order']
        limit = options['limit']
        count = options['count']
        status = options['status']
        directSortable = False
        if (path in getAllTablesLowerCase()) and inGetCallConfig(path):
            object = getClassName(path)
            # No Need for Rights to Check Your Own Rights
            if (path == 'right') and (request.path.endswith('&self')):
                return jsonify(actions.getOwnRights([obj.getPublic(getCallConfig, None) for obj in db.session.query(getClassByName(object)).all()], g.user.getPublic(getCallConfig, None)))
            rights = actions.checkRights(db.session, tables.Right, g.user, object, 'Get List')
            if not rights:
                return ('', 403) # noCoverage
            classObject = getClassByName(object)
            noFilterByRights = noRightObject(classObject, rights) and (not level)
            if filter:
                objects = [obj for obj in db.session.query(classObject).all() if (noFilterByRights or filterByRights(obj, g.user, rights, level)) and filters.filterByAPIParams(obj.getPublic(getCallConfig, {'user': g.user, 'right': rights}), filter)]
                return resultFormatWrapper(objects, rights, limit, count, sort, order, directSortable, perPage, page)
            else:
                objects = [obj for obj in db.session.query(classObject).all() if (noFilterByRights or filterByRights(obj, g.user, rights, level))]
                return resultFormatWrapper(objects, rights, limit, count, sort, order, directSortable, perPage, page)
        return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: Item (CREATE)
@app.route(basePath + '<path:path>/create', methods=['POST'])
@tokenAuth.login_required
def createItem(**kwargs):
    try:
        path = getKeyWordArgument(kwargs, 'path')
        if (path in getAllTablesLowerCase()) and inGetCallConfig(path):
            object = getClassName(path)
            rights = actions.checkRights(db.session, tables.Right, g.user, object, 'Create')
            if not rights:
                return ('', 403) # noCoverage
            data = validate.validateObject(db.session, tables, getClassByName(object), objectify(orjson.loads(request.data)), ['id'])
            if not data:
                return ('', 403) # noCoverage
            data = actions.complyRights(db.session, tables, getClassByName(object), data, rights, g.user)
            if data:
                if hasattr(data, 'password') and (path == 'user'):
                    data.password = generate_password_hash(data.password)
                result = actions.createByDict(g.user, db.session, getClassByName(object), {}, **vars(data))
                return (('', 201) if result else ('', 409))
            else:
                return ('', 403) # noCoverage
        return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# PUT: Item (DELETE)
@app.route(basePath + '<path:path>/delete/<int:id>', methods=['PUT'])
@tokenAuth.login_required
def deleteItem(**kwargs):
    try:
        path = getKeyWordArgument(kwargs, 'path')
        id = getKeyWordArgument(kwargs, 'id')
        if (path in getAllTablesLowerCase()) and inGetCallConfig(path):
            object = getClassName(path)
            rights = actions.checkRights(db.session, tables.Right, g.user, object, 'Delete')
            if not rights:
                return ('', 403) # noCoverage
            if not validate.verifyId(db.session, tables, getClassByName(object), id):
                return ('', 404) # noCoverage
            if not filterByRights(db.session.query(getClassByName(object)).filter_by(id=id).first(), g.user, rights, None):
                return ('', 404) # noCoverage
            if actions.deleteById(g.user, db.session, getClassByName(object), id, {}):
                return ('', 200)
            else:
                return ('', 404) # noCoverage
        return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: Item (EDIT)
@app.route(basePath + '<path:path>/edit/<int:id>', methods=['POST'])
@app.route(basePath + '<path:path>/edit/<int:id>&config', methods=['POST'])
@tokenAuth.login_required
def editItem(**kwargs):
    try:
        path = getKeyWordArgument(kwargs, 'path')
        id = getKeyWordArgument(kwargs, 'id')
        if (path in getAllTablesLowerCase()) and inGetCallConfig(path):
            object = getClassName(path)
            rights = actions.checkRights(db.session, tables.Right, g.user, object, 'Edit')
            if not rights:
                return ('', 403) # noCoverage
            if (path == 'user') and (not actions.checkLimitations(db.session, getClassByName(object), g.user, rights, id, orjson.loads(request.data))):
                return ('', 404) # noCoverage
            if not validate.verifyId(db.session, tables, getClassByName(object), id):
                return ('', 404) # noCoverage
            if not filterByRights(db.session.query(getClassByName(object)).filter_by(id=id).first(), g.user, rights, None):
                return ('', 404) # noCoverage
            data = validate.validateEditability(db.session, tables, getClassByName(object), objectify(orjson.loads(request.data)))
            if data:
                if hasattr(data, 'password') and (path == 'user'):
                    data.password = generate_password_hash(data.password)
                    actions.edit(g.user, db.session, getClassByName(object), id, {}, **vars(data))
                else:
                    actions.edit(g.user, db.session, getClassByName(object), id, {}, **vars(data))
                return ('', 200)
            else:
                return ('', 404) # noCoverage
        return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: File Upload
@app.route(basePath + 'file/upload', methods=['POST'])
@tokenAuth.login_required
def postUploadFile():
    try:
        rights = actions.checkRights(db.session, tables.Right, g.user, 'File', 'Create')
        if not rights:
            return ('', 403) # noCoverage
        if 'file' not in request.files:
            appLogger.warning('File is not added to upload request') # noCoverage
            return ('', 400) # noCoverage
        file = request.files['file']
        if (file and ('/' not in file.filename)):
            file.filename = secure_filename(file.filename)
            fileReference = ''.join(choices(ascii_letters + digits, k=100))
            existingFiles = next(os.walk(locationConfig['lib'] + 'objects' + '/'))[2]
            unique = False
            while (not unique):
                if (fileReference not in existingFiles):
                    unique = True
                else:
                    fileReference = ''.join(choices(ascii_letters + digits, k=100))
            appLogger.info('Uploading new file "' + file.filename + '" with reference: ' + fileReference)
            file.save(locationConfig['lib'] + 'objects' + '/' + fileReference)
            creationData = {'name': file.filename, 'reference': fileReference, 'creation': None, 'size': int(os.stat(locationConfig['lib'] + 'objects' + '/' + fileReference).st_size/1024)}
            return jsonify(creationData)
        else:
            appLogger.warning('Unsecure file name is not allowed for upload') # noCoverage
            return ('', 400) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: SSL Info
@app.route(basePath + 'ssl/info', methods=['GET'])
@tokenAuth.login_required
def getSSLInfo():
    try:
        rights = actions.checkRights(db.session, tables.Right, g.user, 'Right', 'Edit')
        if not rights[2]:
            return ('', 403) # noCoverage
        sslInfo = readSSL(apiConfig)
        if sslInfo:
            return jsonify(sslInfo)
        else:
            return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: SSL Upload
@app.route(basePath + 'ssl/upload', methods=['POST'])
@tokenAuth.login_required
def postSSLUpload():
    try:
        rights = actions.checkRights(db.session, tables.Right, g.user, 'Right', 'Edit')
        if not rights[2]:
            return ('', 403) # noCoverage
        if (('certificate' not in request.files) and ('key' not in request.files)):
            appLogger.warning('Certificate/Key is not added to request') # noCoverage
            return ('', 400) # noCoverage
        createDir('/etc/neatly/base/ssl')
        if ('certificate' in request.files):
            file = request.files['certificate']
            if (file and file.filename.endswith('.crt') and ('/' not in file.filename)):
                fileName = secure_filename(file.filename)
                appLogger.info('Uploading new certificate: ' + fileName)
                file.save('/etc/neatly/base/ssl/' + fileName)
                updateSSLConfig('certificate', fileName)
            else:
                appLogger.warning('Certificate is not allowed') # noCoverage
                return ('', 400) # noCoverage
        if ('key' in request.files):
            file = request.files['key']
            if (file and file.filename.endswith('.key') and ('/' not in file.filename)):
                fileName = secure_filename(file.filename)
                appLogger.info('Uploading new key: ' + fileName)
                file.save('/etc/neatly/base/ssl/' + fileName)
                updateSSLConfig('key', fileName)
            else:
                appLogger.warning('Key is not allowed') # noCoverage
                return ('', 400) # noCoverage
        if (apiProtocol == 'https'):
            restartApp()
        else:
            loadAPIConfig()
            loadGUIConfig()
        return ('', 200)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: API Protocol Switch
@app.route(basePath + 'protocol/api/switch', methods=['POST'])
@tokenAuth.login_required
def postAPIProtocolSwitch():
    try:
        rights = actions.checkRights(db.session, tables.Right, g.user, 'Right', 'Edit')
        if not rights[2]:
            return ('', 403) # noCoverage
        data = orjson.loads(request.data)
        if (('protocol' in data) and (data['protocol'].lower() in ['http', 'https'])):
            if (apiProtocol == data['protocol'].lower()):
                appLogger.debug('Switch to already active protocol (' + apiProtocol + '), no action required')
                return ('', 200)
            elif (data['protocol'].lower() == 'http'):
                appLogger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
                switchAPIProtocol(data['protocol'].lower())
                return ('', 200)
            else:
                appLogger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
                if (hasValidSSL(apiConfig)):
                    switchAPIProtocol(data['protocol'].lower())
                    return ('', 200)
                else:
                    return ('', 400) # noCoverage
        else:
            appLogger.warning('No protocol or invalid protocol defined') # noCoverage
            return ('', 400) # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: GUIProtocol Switch
@app.route(basePath + 'protocol/gui/switch', methods=['POST'])
@tokenAuth.login_required
def postGUIProtocolSwitch():
    try:
        rights = actions.checkRights(db.session, tables.Right, g.user, 'Right', 'Edit')
        if not rights[2]:
            return ('', 403) # noCoverage
        data = orjson.loads(request.data)
        if (('protocol' in data) and (data['protocol'].lower() in ['http', 'https'])):
            if (guiProtocol == data['protocol'].lower()):
                appLogger.debug('Switch to already active protocol (' + guiProtocol + '), no action required')
                return ('', 200)
            elif (data['protocol'].lower() == 'http'):
                appLogger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
                switchGUIProtocol(data['protocol'].lower())
                return ('', 200)
            else:
                appLogger.debug('Switch to different protocol (' + data['protocol'].lower() + ')')
                if (hasValidSSL(apiConfig)):
                    switchGUIProtocol(data['protocol'].lower())
                    return ('', 200)
                else:
                    return ('', 400) # noCoverage
        else:
            appLogger.warning('No protocol or invalid protocol defined') # noCoverage
            return ('', 400) # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Enabled Translations
@app.route(basePath + 'translation/available', methods=['GET'])
def getEnabledTranslations():
    try:
        return jsonify([trans.to_dict() for trans in db.session.query(tables.Translation).filter_by(enabled=True).all()])
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Uptime
@app.route(basePath + 'uptime', methods=['GET'])
def getUptime():
    try:
        return jsonify({'uptime': str(datetime.now()-serviceStart)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Version (All)
@app.route(basePath + 'version/all', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getVersionAll')
def getVersionAll():
    try:
        return jsonify({'api': str(apiVersion), 'gui': str(guiVersion), 'db': str(dbVersion), 'webserver': str(webServerVersion), 'messaging': str(messagingVersion), 'python': str(pythonVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: API Version
@app.route(basePath + 'version/api', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getAPIVersion')
def getAPIVersion():
    try:
        return jsonify({'version': str(apiVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: GUI Version
@app.route(basePath + 'version/gui', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getGUIVersion')
def getGUIVersion():
    try:
        return jsonify({'version': str(guiVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: DB Version
@app.route(basePath + 'version/db', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getDBVersion')
def getDBVersion():
    try:
        return jsonify({'version': str(dbVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Web Server Version
@app.route(basePath + 'version/webserver', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getWebServerVersion')
def getWebServerVersion():
    try:
        return jsonify({'version': str(webServerVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Messaging Bus Version
@app.route(basePath + 'version/messaging', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getMessagingVersion')
def getMessagingVersion():
    try:
        return jsonify({'version': str(messagingVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Python Version
@app.route(basePath + 'version/python', methods=['GET'])
@cache.cached(timeout=0, key_prefix='getPythonVersion')
def getPythonVersion():
    try:
        return jsonify({'version': str(pythonVersion)})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# GET: Health
@app.route(basePath + 'health', methods=['GET'])
def getHealth():
    try:
        return jsonify({'memory': Process(os.getpid()).memory_info().rss, 'cpuPercent': Process(os.getpid()).cpu_percent()})
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage

# POST: Shutdown (Testing Only)
@app.route(basePath + 'shutdown', methods=['POST'])
def postShutdown():
    try:
        if testEnv:
            if (str(envConfig['environment']).lower() == 'test'):
                shutdownServer()
                return ('', 200)
            else:
                return ('', 404) # noCoverage
        else:
            return ('', 404) # noCoverage
    except:
        apiLogger.error(' '.join(str(traceback.format_exc()).split()))
        return ('', 409) # noCoverage


# START: Flask Application
if __name__ == '__main__':
    launch()
