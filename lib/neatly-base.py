# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Standard Modules
import json                                                                                 # JSON Lib
import logging                                                                              # Logging Lib
import os                                                                                   # OS Lib
from logging.handlers import RotatingFileHandler                                            # Rotated Logging Lib
import traceback                                                                            # Exception Lib
import subprocess                                                                           # Process Exec Lib
import sys                                                                                  # System Lib


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
        return json.load(content)

# FUNCTION: Create File Path from Config (No Logging)
def createFilePathConfig(config, component):
    return config[component]['path'] + config[component]['file']


# CONFIGURATION: Create Logger
loggingConfig = readJSONFile('/etc/neatly/base/logging.json')
appLogger = createLogger('appLogger', createFilePathConfig(loggingConfig, 'actions'), getattr(logging, loggingConfig['actions']['level']))
appLogger.debug('Created application logger')


# IMPORT: Custom Modules (if Env File is Present)
if os.path.isfile('/etc/neatly/base/env.json'):
    from basic import readJSONFile, python, coverage                                        # Basic Lib


# Check if DB is Set Up
if not os.path.isfile('/etc/neatly/base/db.json'):
    appLogger.error("Neatly Base is not initialised yet! Run 'init-neatly-base' first and complete the installation.")
    print("Neatly Base is not initialised yet! Run 'init-neatly-base' first and complete the installation.")
    sys.exit()

# Launch Application
try:
    if os.path.isfile('/etc/neatly/base/env.json'):
        envConfig = readJSONFile('/etc/neatly/base/env.json')
        if (str(envConfig['environment']).lower() == 'test'):
            # Lauch API with Coverage
            appLogger.info('Launching Neatly Base in test mode')
            subprocess.call(coverage + ' run --parallel-mode --concurrency=multiprocessing' + ' ' + 'api.py' + ' &> /dev/null', shell=True)
        else:
            # Launch API with Python
            appLogger.info('Launching Neatly Base in development mode')
            subprocess.call(python + ' ' + 'api.py' + ' &> /dev/null', shell=True)
    else:
        # Launch API with UWSGI
        appLogger.info('Launching Neatly Base in production mode')
        locationConfig = readJSONFile('/etc/neatly/base/location.json')
        apiConfig = readJSONFile('/etc/neatly/base/api/api.json')
        subprocess.call('cd ' + locationConfig['lib'].replace(' ', '\ ') + ' ' + '&&' + ' ' + './neatly-base-api' + ' ' + '--http 0.0.0.0:' + str(apiConfig['port']) + ' ' + '--logger file:' + loggingConfig['api']['path'].replace(' ',  '\ ') + 'uwsgi.log', shell=True)
except:
    appLogger.error(' '.join(str(traceback.format_exc()).split()))
    appLogger.error('Unable to launch Neatly Base')
