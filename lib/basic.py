# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Standard Modules
import logging                                                                              # Logging Lib
import os                                                                                   # OS Lib
from logging.handlers import RotatingFileHandler                                            # Rotated Logging Lib
from flask.json import JSONEncoder, JSONDecoder                                             # JSON Encoder/Decoder Lib
import ujson                                                                                # UJSON Lib
import orjson                                                                               # ORJSON Lib
import json                                                                                 # JSON Lib
import traceback                                                                            # Exception Lib
from subprocess import getoutput                                                            # Process Exec Function
from sqlalchemy.ext.declarative import DeclarativeMeta                                      # SQLAl Serialize Lib
from flask import Flask, Response                                                           # Flask Lib
from sqlalchemy import Table                                                                # Table Lib
from sqlalchemy.inspection import inspect                                                   # Inspect Tables
from flask_sqlalchemy import SQLAlchemy                                                     # SQLAlchemy Lib
from Cryptodome.Cipher import AES                                                           # AES Lib
from Cryptodome.Util.Padding import unpad                                                   # Unpadding Lib
from Cryptodome.Protocol.KDF import PBKDF2                                                  # Key Generator Lib
from datetime import datetime, time, timedelta, date, timezone                              # Date Gen Lib
from inspect import getframeinfo, stack                                                     # Stack Inspect Lib
from copy import copy, deepcopy                                                             # Copy Lib
from importlib.util import spec_from_loader, spec_from_file_location, module_from_spec      # Module Loader Lib
from importlib.machinery import SourceFileLoader                                            # Source File Loader Lib
import inspect as inspecter                                                                 # Inspect Classes Lib
from operator import attrgetter                                                             # Attribute Getter Lib
import shutil                                                                               # File Operations Lib
from inflection import underscore                                                           # CamelCase Function
from OpenSSL import crypto as sslCheck                                                      # SSL Lib
from importlib import reload                                                                # Import Reload Function
import sqlalchemy.ext.baked                                                                 # SQLAlchemy Component
import sqlalchemy.sql.default_comparator                                                    # SQLAlchemy Component
from kafka import KafkaConsumer, KafkaProducer                                              # Kafka Lib
from kafka.admin import KafkaAdminClient, NewTopic                                          # Kafka Admin Lib
import sys                                                                                  # Sytem Lib


# CLASS: Object
class Obj(object):
    def __init__(self, d):
        for a, b in d.items():
            if isinstance(b, (list, tuple)):
                setattr(self, a, [Obj(x) if isinstance(x, dict) else x for x in b])
            else:
                setattr(self, a, Obj(b) if isinstance(b, dict) else b)

    def hasAttr(self, attr):
        hasattr(self, attr)

    def setAttr(self, attr, val):
        setattr(self, attr, val)

    def deleteAttr(self, attr):
        try:
            delattr(self, attr)
        except:
            pass

# CLASS: JSON Encoder
class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            return orjson.dumps(obj).decode('utf-8')
        return super(CustomJSONEncoder, self).default(obj)

# CLASS: JSON Decoder
class CustomJSONDecoder(JSONDecoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            return orjson.loads(obj)
        return super(CustomJSONDecoder, self).default(obj)


# FUNCTION: Create Logger
def createLogger(name, logfile, level):
    if not os.path.isfile(logfile):
        open(logfile, 'a').close()
    handler = RotatingFileHandler(logfile, maxBytes=10*1024*1024, backupCount=3, encoding='utf-8')
    formatter = logging.Formatter(fmt="%(levelname)-7s\t%(asctime)s.%(msecs)03d: %(message)s", datefmt="%d/%m/%Y %H:%M:%S")
    handler.setFormatter(formatter)
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)
    return logger

# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)

# FUNCTION: Create File Path from Config (No Logging)
def createFilePathConfig(config, component):
    return config[component]['path'] + config[component]['file']


# CONFIGURATION: ENV Config
if os.path.isfile('/etc/neatly/base/env.json'):
    testEnv = True
    envConfig = readJSONFile('/etc/neatly/base/env.json')
else:
    testEnv = False # noCoverage

# CONFIGURATION: Create Logger
loggingConfig = readJSONFile('/etc/neatly/base/logging.json')
appLogger = createLogger('appLogger', createFilePathConfig(loggingConfig, 'actions'), getattr(logging, loggingConfig['actions']['level']))
appLogger.debug('Created application logger')

# CONFIGURATION: Determine Installation Location
appLogger.debug('Determining location of main components')
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Determine Database Config
appLogger.debug('Determining configuration of the database')
dbConfig = readJSONFile('/etc/neatly/base/db.json')


# REMOVE: Functions without Logging
del globals()['readJSONFile']
del globals()['createFilePathConfig']


# FUNCTION: Read JSON File (Logging)
def readJSONFile(file):
    try:
        with open(file, encoding='utf-8') as content:
            appLogger.debug('Found ' + str(file))
            return ujson.load(content)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Write JSON File (Logging)
def writeJSONFile(file, info):
    try:
        with open(file, 'w+') as content:
            ujson.dump(info, content)
            appLogger.debug('Wrote to ' + str(file))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Write Clean JSON File (Logging)
def writeCleanJSONFile(file, info):
    try:
        with open(file, 'w+') as content:
            json.dump(info, content, indent=4, sort_keys=True)
            appLogger.debug('Wrote to ' + str(file))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Read Text File (Logging)
def readTextFile(file):
    try:
        with open(file, 'r') as content:
            appLogger.debug('Found ' + str(file))
            return content.read()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Read Text File Bytes (Logging)
def readTextFileBytes(file):
    try:
        with open(file, 'rb') as content:
            appLogger.debug('Found ' + str(file))
            return content.read()
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Write Text File (Logging)
def writeTextFile(file, info):
    try:
        content = open(file, 'w+')
        content.write(info)
        content.close()
        appLogger.debug('Wrote to ' + str(file))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Write Text File Bytes (Logging)
def writeTextFileBytes(file, info):
    try:
        content = open(file, 'wb+')
        content.write(info)
        content.close()
        appLogger.debug('Wrote to ' + str(file))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Write Replaced Text File (Logging)
def writeReplacedTextFile(file, info, changes):
    try:
        for orig,new in changes.items():
            info = info.replace(orig, new)
        writeTextFile(file, info)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create File Path from Config (Logging)
def createFilePathConfig(config, component):
    try:
        filePath = config[component]['path'] + config[component]['file']
        appLogger.debug('Created file path: ' + str(filePath))
        return filePath
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Get Table Name
def getTableName(name, isClass=False):
    try:
        return (underscore(name().__class__.__name__) if (isClass) else underscore(name))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Get Table Name Id
def getTableNameId(name, isClass=False):
    try:
        return ((underscore(name().__class__.__name__) + '.id') if (isClass) else (underscore(name) + '.id'))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Move Directory Files
def moveDirFiles(sourceDir, destDir):
    try:
        files = os.listdir(sourceDir)
        for file in files:
            shutil.move(sourceDir + ('' if (sourceDir.endswith('/')) else '/') + file, destDir)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create Directory
def createDir(dir):
    try:
        if (not os.path.isdir(dir)):
            os.mkdir(dir)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Remove Directory
def removeDir(dir):
    try:
        if (os.path.isdir(dir)):
            shutil.rmtree(dir)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Remove File
def removeFile(file):
    try:
        if (os.path.isfile(file)):
            os.remove(file)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Register File
def registerFile(dir, file):
    try:
        appLogger.info('Registering ' + str(file) + ' in ' + locationConfig['lib'] + 'transition/' + str(dir))
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S-%f')
        createDir(locationConfig['lib'] + 'transition')
        createDir(locationConfig['lib'] + 'transition/' + dir)
        if (os.path.isfile(file)):
            fileContent = readTextFile(file)
            writeTextFile(locationConfig['lib'] + 'transition/' + dir + '/' + timestamp, fileContent)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create DB Path from Config (Logging)
def createDBPathConfig(config):
    try:
        dbPath = config['type'] + '://' + config['userName'] + ':' + config['password'] + '@' + config['ip'] + ':' + str(config['port']) + '/' + config['db'] + ('?client_encoding=utf8' if (config['type'] == 'postgresql') else '')
        appLogger.debug('Created database path')
        return dbPath
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Return JSON Response
def jsonify(obj):
    try:
        return (orjson.dumps(obj).decode('utf-8'), 200, {'Content-Type': 'application/json'})
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return (None, 500)

# FUNCTION: Kill Sleeping Connections
def killSleepingConnections():
    try:
        appLogger.info('Kill all sleeping connections of: ' + str(dbConfig['connection']['db']))
        if (dbConfig['connection']['type'].startswith('postgresql')):
            appLogger.info('Killing sleeping connections')
            grant = getoutput('PGPASSWORD="' + str(dbConfig['connection']['password']) + '"' + ' ' + dbClient + ' ' + '-U' + ' ' + str(dbConfig['connection']['userName']) + ' ' + str(dbConfig['connection']['db']) + ' ' + '-c' + ' ' + '\'REVOKE CONNECT ON DATABASE ' + str(dbConfig['connection']['db']) + ' FROM public;\'')
            out = getoutput('PGPASSWORD="' + str(dbConfig['connection']['password']) + '"' + ' ' + dbClient + ' ' + '-U' + ' ' + str(dbConfig['connection']['userName']) + ' ' + str(dbConfig['connection']['db']) + ' ' + '-c' + ' ' + '\'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=current_database() AND pid <> pg_backend_pid();\'')
            appLogger.info('Killed all sleeping connections')
            return True
        if (dbConfig['connection']['type'].startswith('mysql')):
            processes = getoutput(dbClient + ' ' + '-u ' + str(dbConfig['connection']['userName']) + ' ' + '-p' + str(dbConfig['connection']['password']) + ' ' + '-e "' + 'SHOW PROCESSLIST' + '"')
            processes = [proc for proc in processes.split("\n") if ('Sleep' in proc) and (str(dbConfig['connection']['db']) in proc)]
            for proc in processes:
                pid = proc.split("\t")[0]
                appLogger.info('Killing sleeping connection PID: ' + str(pid))
                getoutput(dbClient + ' ' + '-u ' + str(dbConfig['connection']['userName']) + ' ' + '-p' + str(dbConfig['connection']['password']) + ' ' + '-e "' + 'KILL ' + str(pid) + '"')
            appLogger.info('Killed all sleeping connections')
            return True
        else:
            appLogger.warning('Unknown database type: ' + str(dbConfig['connection']['type'])) # noCoverage
            return False # noCoverage
    except:
        appLogger.error('Unable to kill sleeping connections of: ' + str(dbConfig['connection']['db']))
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Objectify
def objectify(dictionary):
    return Obj(dictionary)

# FUNCTION: Object Key Difference
def objectKeyDiff(pre, post):
    try:
        return [key for key,val in pre.items() if (val != post[key])]
    except:
        appLogger.error('Unable to determine object key difference')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Flatten Array
def flattenArray(arr):
    try:
        out = []
        for i in arr:
            if isinstance(i, list):
                for j in flattenArray(i):
                    if isinstance(j, list):
                        out.append(flattenArray(j))
                    else:
                        out.append(j)
            else:
                out.append(i)
        return out
    except:
        appLogger.error('Unable to flatten array: ' + str(arr))
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []


# FUNCTION: Cut Array in Chunks
def cutArrayInChunks(arr, size):
    try:
        for i in range(0, len(arr), size):
            yield arr[i:i+size]
    except:
        appLogger.error('Unable cut array in chunks: ' + str(arr))
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Split Array in Equal Parts
def splitArrayInEqualParts(arr, size):
    try:
        return list(cutArrayInChunks(arr,size))
    except:
        appLogger.error('Unable to split array in equal parts: ' + str(arr))
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Add Sync Dicts
def addSyncDicts(dicts):
    try:
        base = dicts[0]
        for dic in dicts[1:]:
            if isinstance(dic, dict):
                for k,v in dic.items():
                    base[k] = (v if (k not in base) else addSyncDicts([base[k], v]))
        return base
    except:
        appLogger.error('Unable sync dicts (add)')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return dicts[0]

# FUNCTION: Add Sync Config
def addSyncConfig(dicts):
    try:
        base = dicts[0]
        for dic in dicts[1:]:
            if isinstance(dic, dict):
                for k,v in dic.items():
                    if (k not in base):
                        base[k] = v
                    elif (base[k] == None):
                        base[k] = v
                    elif (isinstance(v, list) and isinstance(base[k], list)):
                        base[k].extend(v)
                    else:
                        base[k] = addSyncConfig([base[k], v])
            elif isinstance(dic, list):
                base.extend(dic)
        return base
    except:
        appLogger.error('Unable sync config (add)')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return dicts[0]

# FUNCTION: Filter Content By Rights (Own, Isolated, All)
def filterByRights(val, ref, right, specificRight):
    try:
        if (specificRight != None):
            if (specificRight == 'all'):
                if right[2]: return True
            elif (specificRight == 'isolated'):
                if (right[1] or right[2]):
                    right = [False, True, False]
            elif (specificRight == 'own'):
                if (right[0] or right[1] or right[2]):
                    right = [True, False, False]
        if right[2]: return True
        if right[1]:
            return checkIsolatedAllowed(val, ref)
        if right[0]:
            return checkOwnAllowed(val, ref)
        if (not (right[0] or right[1] or right[2])): return False
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Check if Own Allowed
def checkOwnAllowed(val, ref):
    return findRight(val.getOwn(), ref)

# FUNCTION: Check if Isolated Allowed
def checkIsolatedAllowed(val, ref):
    return findRight(val.getIsolated(), ref.team)

# FUNCTION: Check if Right is Found
def findRight(val, ref):
    try:
        if (ref == None):
            return False
        if (val == None):
            return False
        elif isinstance(val, list):
            return (ref in val)
        else:
            return (ref == val)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Object Has no Specific Rights
def noRightObject(val, right):
    try:
        if (not (val().getOwn() or val().getIsolated())): return True
        elif right[2]: return True
        else: return False
    except:
        return False # noCoverage

# FUNCTION: Read Topics
def readTopics():
    try:
        consumer = KafkaConsumer(group_id='neatly', bootstrap_servers=['localhost:9092'])
        topics = list(consumer.topics())
        consumer.close()
        return topics
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Create Topics
def createTopics(default=False):
    try:
        topics = readJSONFile('/etc/neatly/base/topic/topic.json')
        appLogger.info('Creating all topics')
        existingTopics = readTopics()
        for topic in topics:
            if (topic['name'] not in existingTopics):
                createTopic(topic)
            else:
                appLogger.debug('Topic ' + topic['name'] + ' already exists')
        appLogger.debug('Created all topics')
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create Topic
def createTopic(topic):
    try:
        appLogger.info('Creating topic: ' + str(topic['name']))
        adminClient = KafkaAdminClient(bootstrap_servers='localhost:9092', client_id='neatly')
        topicList = [NewTopic(name=topic['name'], num_partitions=topic['numPartitions'], replication_factor=topic['replicationFactor'])]
        adminClient.create_topics(new_topics=topicList, validate_only=False)
        adminClient.close()
        appLogger.debug('Created topic: ' + str(topic['name']))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create Producer
def createProducer():
    try:
        if (not os.path.isfile('/etc/neatly/base/topic/topic.json')):
            createTopics(True)
        return KafkaProducer(bootstrap_servers=['localhost:9092'], value_serializer=lambda x: orjson.dumps(x))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Create Consumer
def createConsumer(topic):
    try:
        if (not os.path.isfile('/etc/neatly/base/topic/topic.json')):
            createTopics(True)
        return KafkaConsumer(topic, bootstrap_servers=['localhost:9092'], auto_offset_reset='earliest', enable_auto_commit=True, group_id='neatly', value_deserializer=lambda x: orjson.loads(x.decode('utf-8')))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Determine DB Version
def determineDBVersion(session):
    try:
        if (dbConfig['connection']['type'].startswith('postgresql')):
            return ' '.join(session.execute('SELECT VERSION();').fetchone()[0].split(' ')[0:2])
        elif (dbConfig['connection']['type'].startswith('mysql')):
            installationLocation = getoutput('which mysqld').replace(' ', '\ ')
            if (('/' in installationLocation) and (' no' not in installationLocation)):
                return getoutput(installationLocation + ' ' + '--version').split(' ')[3]
            else:
                appLogger.error('Unable to read the database version') # noCoverage
                return None # noCoverage
        else:
            appLogger.error('Unable to read the database version') # noCoverage
            return None # noCoverage
    except:
        appLogger.error('Unable to read the database version')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Determine Web Server Version
def determineWebServerVersion():
    try:
        version = getoutput('nginx -v').split('/')[1]
        if (version != 'bin'):
            return version
        else:
            appLogger.error('Unable to read the web server version') # noCoverage
            return None # noCoverage
    except:
        appLogger.error('Unable to read the web server version')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Determine Kafka Version
def determineKafkaVersion():
    try:
        version = getoutput('/opt/kafka/bin/kafka-topics.sh --version').split(' ')[0]
        if (version != 'bin'):
            return version
        else:
            appLogger.error('Unable to read the kafka version') # noCoverage
            return None # noCoverage
    except:
        appLogger.error('Unable to read the kafka version')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Determine Python Version
def determinePythonVersion():
    try:
        return sys.version.split(' ')[0]
    except:
        appLogger.error('Unable to read the Python version')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Update API Protocol
def updateAPIProtocol(protocol):
    try:
        defaultAPIConfig = readJSONFile('/etc/neatly/base/api/api.json')
        defaultAPIConfig['protocol'] = protocol
        writeCleanJSONFile('/etc/neatly/base/api/api.json', defaultAPIConfig)
        defaultGUIConfig = readJSONFile('/etc/neatly/base/gui/api.json')
        defaultGUIConfig['apiRootUrl'] = protocol + '://' + defaultGUIConfig['apiRootUrl'].split('://')[1]
        writeCleanJSONFile('/etc/neatly/base/gui/api.json', defaultGUIConfig)
    except:
        appLogger.error('Unable to update the API protocol')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Update GUI Protocol
def updateGUIProtocol(protocol):
    try:
        defaultGUIConfig = readJSONFile('/etc/neatly/base/gui/gui.json')
        defaultGUIConfig['protocol'] = protocol
        writeCleanJSONFile('/etc/neatly/base/gui/gui.json', defaultGUIConfig)
    except:
        appLogger.error('Unable to update the GUI protocol')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Read SSL
def readSSL(config):
    try:
        sslInfo = {}
        if ('ssl' in config):
            appLogger.debug('Found SSL config')
            sslInfo['certificate'] = (config['ssl']['certificate'].split('/')[-1] if ('certificate' in config['ssl']) else None)
            sslInfo['key'] = (config['ssl']['key'].split('/')[-1] if ('key' in config['ssl']) else None)
            if (sslInfo['certificate']):
                cert = sslCheck.load_certificate(sslCheck.FILETYPE_PEM, open(config['ssl']['certificate']).read())
                issuer = cert.get_issuer()
                sslInfo['issuer'] = {
                    'organisation': (issuer.O if (issuer.O) else None),
                    'location': ((issuer.L + ', ' + issuer.C if (issuer.L) else issuer.C) if (issuer.C) else None)
                }
                sslInfo['expiryDate'] = datetime.strptime(cert.get_notAfter().decode('ascii'), '%Y%m%d%H%M%SZ').isoformat()
            return sslInfo
        else:
            appLogger.info('No SSL config present')
            return None
    except:
        appLogger.error('Unable to read the SSL config')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None

# FUNCTION: Has Valid SSL
def hasValidSSL(config):
    try:
        sslInfo = readSSL(config)
        if (sslInfo and sslInfo['certificate'] and sslInfo['key'] and (datetime.fromisoformat(sslInfo['expiryDate']) > datetime.now())):
            appLogger.debug('Valid SSL config detected')
            return True
        else:
            appLogger.warning('Invalid SSL config detected')
            return False
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Update SSL Config
def updateSSLConfig(type, fileName):
    try:
        defaultConfig = readJSONFile('/etc/neatly/base/api/api.json')
        if (type == 'certificate'):
            if ('ssl' not in defaultConfig):
                defaultConfig['ssl'] = {}
            defaultConfig['ssl']['certificate'] = '/etc/neatly/base/ssl/' + fileName
        if (type == 'key'):
            if ('ssl' not in defaultConfig):
                defaultConfig['ssl'] = {}
            defaultConfig['ssl']['key'] = '/etc/neatly/base/ssl/' + fileName
        writeCleanJSONFile('/etc/neatly/base/api/api.json', defaultConfig)
    except:
        appLogger.error('Unable to update the SSL config')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))


# CONFIGURATION: Determing Location of SystemCtl
appLogger.debug('Determining location of: systemctl')
systemctl = getoutput('which systemctl').replace(' ', '\ ')
if (('/' in systemctl) and (' no' not in systemctl)):
    appLogger.debug('Systemctl is installed in: ' + str(systemctl))
else:
    appLogger.error('Systemctl does not seem to be installed') # noCoverage

# CONFIGURATION: Determing Location of Python 3
appLogger.debug('Determining location of: Python 3')
python = getoutput('which python3').replace(' ', '\ ')
if (('/' in python) and (' no' not in python)):
    appLogger.debug('Python 3 is installed in: ' + str(python))
else:
    appLogger.error('Python 3 does not seem to be installed') # noCoverage

# CONFIGURATION: Determing Location of Database Dump
appLogger.debug('Determining location of: database dump')
if (dbConfig['connection']['type'].startswith('postgresql')):
    dbDump = getoutput('which pg_dump').replace(' ', '\ ')
    if (('/' in dbDump) and (' no' not in dbDump)):
        appLogger.debug('Database dump is installed in: ' + str(dbDump))
    else:
        appLogger.error('Database dump does not seem to be installed') # noCoverage
elif (dbConfig['connection']['type'].startswith('mysql')):
    dbDump = getoutput('which mysqldump').replace(' ', '\ ')
    if (('/' in dbDump) and (' no' not in dbDump)):
        appLogger.debug('Database dump is installed in: ' + str(dbDump))
    else:
        appLogger.error('Database dump does not seem to be installed') # noCoverage
else:
    appLogger.error('Unknown database type, not able to determine database dump location') # noCoverage

# CONFIGURATION: Determing Location of Database Restore
appLogger.debug('Determining location of: database restore')
if (dbConfig['connection']['type'].startswith('postgresql')):
    dbRestore = getoutput('which pg_restore').replace(' ', '\ ')
    if (('/' in dbRestore) and (' no' not in dbRestore)):
        appLogger.debug('Database restore is installed in: ' + str(dbRestore))
    else:
        appLogger.error('Database restore does not seem to be installed') # noCoverage
elif (dbConfig['connection']['type'].startswith('mysql')):
    dbRestore = None
else:
    appLogger.error('Unknown database type, not able to determine database restore location') # noCoverage

# CONFIGURATION: Determing Location of Database Client
appLogger.debug('Determining location of: database client')
if (dbConfig['connection']['type'].startswith('postgresql')):
    dbClient = getoutput('which psql').replace(' ', '\ ')
    if (('/' in dbClient) and (' no' not in dbClient)):
        appLogger.debug('Database client is installed in: ' + str(dbClient))
    else:
        appLogger.error('Database client does not seem to be installed') # noCoverage
elif (dbConfig['connection']['type'].startswith('mysql')):
    dbClient = getoutput('which mysql').replace(' ', '\ ')
    if (('/' in dbClient) and (' no' not in dbClient)):
        appLogger.debug('Database client is installed in: ' + str(dbClient))
    else:
        appLogger.error('Database client does not seem to be installed') # noCoverage
else:
    appLogger.error('Unknown database type, not able to determine database client location') # noCoverage

# CONFIGURATION: Determing Location of Coverage (Test Purpose)
if os.path.isfile('/etc/neatly/base/env.json'):
    appLogger.debug('Determining location of: coverage')
    coverage = getoutput('which coverage').replace(' ', '\ ')
    if (('/' in coverage) and (' no' not in coverage)):
        appLogger.debug('Coverage is installed in: ' + str(coverage))
    else:
        appLogger.error('Coverage does not seem to be installed') # noCoverage
