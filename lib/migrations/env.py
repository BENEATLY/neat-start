# IMPORT: Standard Modules
import sys                                                                                      # System Lib
import json                                                                                     # JSON Lib
from importlib.util import spec_from_file_location, module_from_spec                            # Module Loader Lib
import traceback                                                                                # Exception Lib
from sqlalchemy import create_engine                                                            # Engine Creation Function
from alembic import context                                                                     # Alembic Context Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file) as content:
        return json.load(content)


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Determine DB Properties
dbConfig = readJSONFile('/etc/neatly/base/db.json')


# IMPORT: Custom Modules
sys.path.append(locationConfig['lib'])                                                          # Add Lib Location to Script
from basic import *                                                                             # Basic Lib
spec = spec_from_file_location('tables', locationConfig['lib'] + 'tables.py')                   # Import Tables
tables = module_from_spec(spec)                                                                 # Import Tables
spec.loader.exec_module(tables)                                                                 # Import Tables


# CONFIGURATION: Model MetaData
target_metadata = tables.db.Model.metadata


# FUNCTION: Run DB Migrations Online
def runMigrationsOnline():
    connectable = create_engine(createDBPathConfig(dbConfig['connection']))
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction(): context.run_migrations()


# UPDATE: Execute DB Migration
runMigrationsOnline()
