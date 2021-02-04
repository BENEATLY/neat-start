# IMPORT: Standard Modules
import json                                                                         # JSON Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file) as content:
        return json.load(content)


# CONFIGURATION: Location Configuration
locationConfig = readJSONFile('/etc/neatly/base/location.json')


def __bootstrap__():
   global __bootstrap__, __loader__, __file__
   import imp
   __loader__ = None; del __bootstrap__, __loader__
   imp.load_dynamic(__name__, locationConfig['lib'] + 'migrations/env.so')
__bootstrap__()
