# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Custom Modules
from basic import *                                                                         # Basic Lib


# FUNCTION: Stop Service
def stopService(service):
    try:
        appLogger.debug('Stopping service: ' + service)
        status = getoutput(systemctl + ' stop ' + service)
        if status:
            appLogger.warning(status)
        else:
            appLogger.info('Stopped service: ' + service)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Start Service
def startService(service):
    try:
        appLogger.debug('Starting service: ' + service)
        status = getoutput(systemctl + ' start ' + service)
        if status:
            appLogger.warning(status)
        else:
            appLogger.info('Started service: ' + service)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Reload Service
def reloadService(service):
    try:
        appLogger.debug('Reloading service: ' + service)
        status = getoutput(systemctl + ' reload ' + service)
        if status:
            appLogger.warning(status)
        else:
            appLogger.info('Reloaded service: ' + service)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))


# FUNCTION: Kill Process By User
def killProcessByUser(user):
    try:
        appLogger.debug('Killing all processes of user: ' + user)
        status = getoutput('pkill -u ' + user)
        if status:
            appLogger.warning(status)
        else:
            appLogger.info('Killed all processes of user: ' + user)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Kill Process By Name
def killProcessByName(name, force=False):
    try:
        appLogger.debug('Killing all processes by name: ' + name)
        status = getoutput('pkill -f ' + name + (' -9' if force else ''))
        if status:
            appLogger.warning(status)
        else:
            appLogger.info('Killed all processes by name: ' + name)
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Restart Web Server
def restartWebServer():
    try:
        stopService('nginx')
        killProcessByName('nginx', True)
        startService('nginx')
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
