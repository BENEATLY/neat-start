# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Custom Modules
from basic import *                                                                             # Basic Lib


# FUNCTION: Get All Table Classes
def getAllTablesClasses():
    return [classname[1] for classname in inspecter.getmembers(tables, inspecter.isclass) if (classname[1].__module__ == 'tables') and (classname[0] != 'Generic')]


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')


# IMPORT: Custom Modules
spec = spec_from_file_location('tables', locationConfig['lib'] + 'tables.py')                   # Import Tables
tables = module_from_spec(spec)                                                                 # Import Tables
spec.loader.exec_module(tables)                                                                 # Import Tables


# CREATE: Tables in DB
tables.db.create_all()

# CREATE: TimeScale Extension & Create TimeScale HyperTables (PostgreSQL Only)
if (dbConfig['connection']['type'].startswith('postgresql')):
    appLogger.info('Enabling TimeScale on: ' + str(dbConfig['connection']['db']))
    extension = getoutput('PGPASSWORD="' + str(dbConfig['connection']['password']) + '"' + ' ' + dbClient + ' ' + '-U' + ' ' + str(dbConfig['connection']['userName']) + ' ' + str(dbConfig['connection']['db']) + ' ' + '-c' + ' ' + '\'CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;\'')
    for cl in getAllTablesClasses():
        if (cl().isTimeSeries()):
            appLogger.info('Creating Hypertable for table: ' + str(cl().__class__.__name__))
            hypertable = getoutput('PGPASSWORD="' + str(dbConfig['connection']['password']) + '"' + ' ' + dbClient + ' ' + '-U' + ' ' + str(dbConfig['connection']['userName']) + ' ' + str(dbConfig['connection']['db']) + ' ' + '-c' + ' ' + '\"SELECT CREATE_HYPERTABLE(\'\\"' + str(cl().__class__.__name__) + '\\"\', \'' + str(cl().isTimeSeries()) + '\');\"')
            if ('ERROR:  ' in hypertable):
                if ('is already a hypertable' in hypertable):
                    appLogger.info(hypertable.split('ERROR:  ')[1].capitalize())
                else:
                    appLogger.error(hypertable.split('ERROR:  ')[1].capitalize())
