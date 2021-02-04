# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Standard Modules
import sys                                                                                      # System Lib
import ujson                                                                                    # UJSON Lib
from werkzeug.security import generate_password_hash                                            # Hashing Lib


# FUNCTION: Read JSON File (No Logging)
def readJSONFile(file):
    with open(file, encoding='utf-8') as content:
        return ujson.load(content)


# CONFIGURATION: Determine Installation Location
locationConfig = readJSONFile('/etc/neatly/base/location.json')

# CONFIGURATION: Add Current Path to Default Python Paths
sys.path.append(locationConfig['lib'])


# IMPORT: Custom Modules
from tables import *                                                                            # Tables Lib
import actions                                                                                  # Actions Lib


# CONFIGURATION: Logfile
performer = 'RESOURCES'


# CREATE: DB Connection
db = actions.createDBConnection()


# INSERT: Team
teams = [Team(name='Administrators')]
[actions.createByDict(performer, db.session, Team, {}, **team.to_dict()) for team in teams]

# INSERT: Function
functions = [Function(name='Administrator')]
[actions.createByDict(performer, db.session, Function, {}, **function.to_dict()) for function in functions]

# INSERT: User
users = [User(userName='admin', firstName='System', lastName='Administrator', mail='admin@neatly.be', phone=None, password=generate_password_hash('admin'), team=actions.retrieveObject(db.session, teams[0]), function=actions.retrieveObject(db.session, functions[0]))]
[actions.createByDict(performer, db.session, User, {}, **user.to_dict()) for user in users]

# INSERT: Translation
translations = [
    Translation(language='English', country='US', flag='us', translationFile='en-us', locale='en-us', enabled=True),
    Translation(language='Nederlands', country='België', flag='be', translationFile='nl-be', locale='nl-be', enabled=True)
]
[actions.createByDict(performer, db.session, Translation, {}, **translation.to_dict()) for translation in translations]

# INSERT: ApiObject
apiobjects = [
    ApiObject(name='ActiveSession'),
    ApiObject(name='User'),
    ApiObject(name='Team'),
    ApiObject(name='Function'),
    ApiObject(name='ApiObject'),
    ApiObject(name='ApiAction'),
    ApiObject(name='File'),
    ApiObject(name='Right'),
    ApiObject(name='Translation')
]
[actions.createByDict(performer, db.session, ApiObject, {}, **apiobject.to_dict()) for apiobject in apiobjects]

# INSERT: ApiAction
apiactions = [
    ApiAction(name='Get List'),
    ApiAction(name='Get by Id'),
    ApiAction(name='Create'),
    ApiAction(name='Delete'),
    ApiAction(name='Edit')
]
[actions.createByDict(performer, db.session, ApiAction, {}, **apiaction.to_dict()) for apiaction in apiactions]

# INSERT: Right
apiobjects = db.session.query(ApiObject).all()
apiactions = db.session.query(ApiAction).all()
rights = []
# Admin Rights
for apiobject in apiobjects:
    for apiaction in apiactions:
        rights.append(Right(apiobject_id=apiobject.id, apiaction_id=apiaction.id, isolated=False, own=False, all=True))
        rights[-1].team = [actions.retrieveObject(db.session, teams[0])]
# Basic Rights
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='User')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Edit')), isolated=False, own=True, all=False))
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='User')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Get List')), isolated=False, own=False, all=True))
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='User')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Get by Id')), isolated=False, own=False, all=True))
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='Translation')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Get List')), isolated=False, own=False, all=True))
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='Translation')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Get by Id')), isolated=False, own=False, all=True))
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='ActiveSession')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Get List')), isolated=False, own=True, all=False))
rights.append(Right(apiobject=actions.retrieveObject(db.session, ApiObject(name='ActiveSession')), apiaction=actions.retrieveObject(db.session, ApiAction(name='Delete')), isolated=False, own=True, all=False))
[actions.merge(performer, db.session, right, {}) for right in rights]
