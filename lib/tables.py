# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Custom Modules
from basic import *                                                                                                                 # Basic Lib


# DEFINITION: Define Database
app = Flask(__name__)
dbConfig = readJSONFile('/etc/neatly/base/db.json')
app.config['SQLALCHEMY_DATABASE_URI'] = createDBPathConfig(dbConfig['connection'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# LINKS: Define Many-to-Many Links between Tables
# Assign Functions to Right Object
FunctionRightLink = db.Table('function_right_link',
  db.Column('function_id', db.Integer, db.ForeignKey('function.id', ondelete='CASCADE'), primary_key=True),
  db.Column('right_id', db.Integer, db.ForeignKey('right.id', ondelete='CASCADE'), primary_key=True)
)


# Assign Teams to Right Object
TeamRightLink = db.Table('team_right_link',
  db.Column('team_id', db.Integer, db.ForeignKey('team.id', ondelete='CASCADE'), primary_key=True),
  db.Column('right_id', db.Integer, db.ForeignKey('right.id', ondelete='CASCADE'), primary_key=True)
)



# Generic Class Object
class Generic():
  def to_dict(self): return {c.name: getattr(self, c.name) for c in self.__table__.columns}
  def __iter__(self): return self.to_dict().iteritems()
  def getDirectProperties(self): return [c.name for c in self.__table__.columns if '_id' not in c.name]
  def getDirectIdProperties(self): return [c.name for c in self.__table__.columns if '_id' in c.name]
  def getAllDirectProperties(self): return [c.name for c in self.__table__.columns]
  def getRelatedProperties(self): return [i[0] for i in inspect(self.__class__).relationships.items()]
  def getAllProperties(self): return [c.name for c in self.__table__.columns if '_id' not in c.name] + [i[0] for i in inspect(self.__class__).relationships.items()]
  def getUniquePropertiesGeneric(self, attrs):
      singleUnique = {}
      multiUnique = {}
      for attr in attrs:
          if isinstance(attr, list):
              for att in attr:
                  multiUnique[att] = self.getAttr(att)
          else:
              singleUnique[attr] = self.getAttr(attr)
      return [singleUnique, multiUnique]
  def getAttr(self, attr):
    attrs = [c.name for c in self.__table__.columns if '_id' not in c.name] + [i[0] for i in inspect(self.__class__).relationships.items()]
    if attr in attrs: return getattr(self, attr)
    else: return None
  def setAttr(self, attr, val):
    attrs = [c.name for c in self.__table__.columns if '_id' not in c.name] + [i[0] for i in inspect(self.__class__).relationships.items()]
    if attr in attrs:
        setattr(self, attr, val)
        return True
    else: return False
  def getAll(self):
    attrs = [c.name for c in self.__table__.columns if '_id' not in c.name] + [i[0] for i in inspect(self.__class__).relationships.items()]
    return {attr: self.getAttr(attr) for attr in attrs}
  def getPublicGeneric(self, getCallConfig, userInfo, object, attrs, fin=[]):
    tree = getCallConfig[object] if getCallConfig else {}
    object_to_dict = {}
    for excl in fin:
        if ((not excl['iter']) and (excl['attr'] in attrs)):
            attrs.remove(excl['attr'])
        elif (excl['iter']):
            excl['iter'] -= 1
    fin = [excl for excl in fin if ((excl['iter'] == None) or (excl['iter'] >= 0))]
    for attr in attrs:
      object_to_dict[attr] = self.getAttr(attr)
      if (hasattr(object_to_dict[attr], 'id')):
          if (attr in tree):
              object_to_dict[attr] = object_to_dict[attr].getPublic(getCallConfig, userInfo, fin=fin)
          else:
              directProperties = list(set(self.getAttr(attr).getDirectProperties()).intersection(self.getAttr(attr).getPublicProperties()))
              object_to_dict[attr] = {prop: getattr(self.getAttr(attr), prop) for prop in directProperties}
      elif (hasattr(object_to_dict[attr], '_sa_adapter')):
          if (attr in tree):
              if ((len(object_to_dict[attr]) > 0) and (object_to_dict[attr][0].isTimeSeries())):
                  lastItem = max(object_to_dict[attr], key=attrgetter(object_to_dict[attr][0].isTimeSeries()))
                  object_to_dict[attr] = [lastItem.getPublic(getCallConfig, userInfo, fin=fin)]
              else:
                  if (userInfo != None):
                      object_to_dict[attr] = [item.getPublic(getCallConfig, userInfo, fin=fin) for item in object_to_dict[attr] if filterByRights(item, userInfo['user'], userInfo['right'], None)]
                  else:
                      object_to_dict[attr] = [item.getPublic(getCallConfig, userInfo, fin=fin) for item in object_to_dict[attr]]
          else:
              if isinstance(self.getAttr(attr), list):
                  if (len(self.getAttr(attr)) > 0):
                      directProperties = list(set(self.getAttr(attr)[0].getDirectProperties()).intersection(self.getAttr(attr)[0].getPublicProperties()))
                      object_to_dict[attr] = [{prop: getattr(item, prop) for prop in directProperties} for item in self.getAttr(attr)]
                  else:
                      object_to_dict[attr] = []
              else:
                  del object_to_dict[attr]
      elif (isinstance(object_to_dict[attr], time)):
          object_to_dict[attr] = object_to_dict[attr].isoformat()
      elif (isinstance(object_to_dict[attr], datetime)):
          object_to_dict[attr] = object_to_dict[attr].isoformat()
      elif (isinstance(object_to_dict[attr], date)):
          object_to_dict[attr] = object_to_dict[attr].isoformat()
    return object_to_dict
  def getDefinition(self):
      guiConfig = readJSONFile('/etc/neatly/base/gui/gui.json')
      try:
          return guiConfig['definitions']['Object'][self.__class__.__name__]
      except:
          return None
  def finites(self, newFin, curFin):
      fin = newFin + curFin
      return [dict(y) for y in set(tuple(x.items()) for x in fin)]
  def dictifyObject(self):
      return {attr:self.getAttr(attr) for attr in self.getAllProperties()}


# ActiveSession Object
class ActiveSession(db.Model, Generic):
  __tablename__ = 'active_session'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  token = db.Column(db.String(100), nullable=True, unique=True)                                                                     # Token of the Session
  ip = db.Column(db.String(15), nullable=False)                                                                                     # Remote IP of the Session
  client = db.Column(db.String(), nullable=True)                                                                                    # Client Type of the Session
  creation = db.Column(db.DateTime(), default=datetime.utcnow)                                                                      # Creation DateTime of the Session
  lastActive = db.Column(db.DateTime(), default=datetime.utcnow)                                                                    # Last Active DateTime of the Session

  # IDs with a Reference to another Table
  user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)                 # Reference to the User of the Session

  # Referenced Properties
  user = db.relationship('User', foreign_keys='ActiveSession.user_id', back_populates='activesession', lazy=False)                                                        # User (Object) of the Session

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['token'])
  def getPublicProperties(self): return ['id', 'ip', 'client', 'creation', 'lastActive', 'user']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id', 'token', 'ip', 'client', 'creation', 'lastActive', 'user']
  def notEditable(self): return ['id', 'token', 'ip', 'client', 'creation', 'lastActive', 'user']
  def getOwn(self): return self.user
  def getIsolated(self): return self.user.team
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'activesession'}], fin)
  def isTimeSeries(self): return False


# User Object
class User(db.Model, Generic):
  __tablename__ = 'user'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  userName = db.Column(db.String(20), nullable=False, unique=True)                                                                  # User Name of the User
  firstName = db.Column(db.String(30), nullable=False)                                                                              # First Name of the User
  lastName = db.Column(db.String(30), nullable=False)                                                                               # Last Name of the User
  mail = db.Column(db.String(50), nullable=False)                                                                                   # Mail Address of the User
  phone = db.Column(db.String(30), nullable=True)                                                                                   # Phone Number of the User
  password = db.Column(db.String(100), nullable=True)                                                                               # Password of the User
  creation = db.Column(db.DateTime(), default=datetime.utcnow)                                                                      # Creation DateTime of the User

  # IDs with a Reference to another Table
  team_id = db.Column(db.Integer, db.ForeignKey('team.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)                 # Reference to the Team of the User
  function_id = db.Column(db.Integer, db.ForeignKey('function.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)         # Reference to the Function of the User
  image_id = db.Column(db.Integer, db.ForeignKey('file.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)                # Reference to the Image of the User

  # Referenced Properties
  team = db.relationship('Team', foreign_keys='User.team_id', back_populates='user', lazy=True)                                                                  # Team (Object) of the User
  function = db.relationship('Function', foreign_keys='User.function_id', back_populates='user', lazy=True)                                                          # Function (Object) of the User
  file = db.relationship('File', foreign_keys='File.uploader_id', back_populates='uploader', lazy=True)                             # File (Object) of the User
  activesession = db.relationship('ActiveSession', foreign_keys='ActiveSession.user_id', back_populates='user', lazy=True)                                                # ActiveSession (Object) of the User
  image = db.relationship('File', foreign_keys='User.image_id', back_populates='userImage', lazy=True)                              # Image (Object) of the User

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['userName'])
  def getPublicProperties(self): return ['id', 'userName', 'firstName', 'lastName', 'mail', 'phone', 'creation', 'team', 'function', 'image']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id', 'userName', 'mail', 'creation', 'team', 'function']
  def notEditable(self): return ['id', 'creation']
  def getOwn(self): return self
  def getIsolated(self): return self.team
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'user'}, {'iter': None, 'attr': 'uploader'}], fin)
  def isTimeSeries(self): return False


# Team Object
class Team(db.Model, Generic):
  __tablename__ = 'team'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  name = db.Column(db.String(30), nullable=False, unique=True)                                                                      # Name of the Team

  # IDs with a Reference to another Table

  # Referenced Properties
  user = db.relationship('User', foreign_keys='User.team_id', back_populates='team', lazy=True)                                                                  # User (Object) of the Team
  right = db.relationship('Right', secondary=TeamRightLink, lazy=False, back_populates='team')                                      # Right (Object) of the Team

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['name'])
  def getPublicProperties(self): return ['id', 'name']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id']
  def notEditable(self): return ['id']
  def getOwn(self): return [user.getOwn() for user in self.user]
  def getIsolated(self): return self
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'team'}], fin)
  def isTimeSeries(self): return False


# Function Object
class Function(db.Model, Generic):
  __tablename__ = 'function'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  name = db.Column(db.String(30), nullable=False, unique=True)                                                                      # Name of the Function

  # IDs with a Reference to another Table

  # Referenced Properties
  user = db.relationship('User', foreign_keys='User.function_id', back_populates='function', lazy=True)                                                              # User (Object) of the Function
  right = db.relationship('Right', secondary=FunctionRightLink, lazy=False, back_populates='function')                              # Right (Object) of the Function

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['name'])
  def getPublicProperties(self): return ['id', 'name']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id']
  def notEditable(self): return ['id']
  def getOwn(self): return [user.getOwn() for user in self.user]
  def getIsolated(self): return [user.getIsolated() for user in self.user]
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'function'}], fin)
  def isTimeSeries(self): return False


# ApiObject Object
class ApiObject(db.Model, Generic):
  __tablename__ = 'api_object'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  name = db.Column(db.String(30), nullable=False, unique=True)                                                                      # Name of the ApiObject

  # IDs with a Reference to another Table

  # Referenced Properties
  right = db.relationship('Right', foreign_keys='Right.apiobject_id', back_populates='apiobject', lazy=True)                                                           # Right (Object) of the ApiObject

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['name'])
  def getPublicProperties(self): return ['id', 'name']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id', 'name']
  def notEditable(self): return ['id', 'name']
  def getOwn(self): return None
  def getIsolated(self): return None
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'apiobject'}], fin)
  def isTimeSeries(self): return False


# ApiAction Object
class ApiAction(db.Model, Generic):
  __tablename__ = 'api_action'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  name = db.Column(db.String(30), nullable=False, unique=True)                                                                      # Name of the ApiAction

  # IDs with a Reference to another Table

  # Referenced Properties
  right = db.relationship('Right', foreign_keys='Right.apiaction_id', back_populates='apiaction', lazy=True)                                                           # Right (Object) of the ApiAction

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['name'])
  def getPublicProperties(self): return ['id', 'name']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id', 'name']
  def notEditable(self): return ['id', 'name']
  def getOwn(self): return None
  def getIsolated(self): return None
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'apiaction'}], fin)
  def isTimeSeries(self): return False


# Right Object
class Right(db.Model, Generic):
  __tablename__ = 'right'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  isolated = db.Column(db.Boolean, nullable=False)                                                                                  # Has Rights to see/edit Info from their Team
  own = db.Column(db.Boolean, nullable=False)                                                                                       # Has Rights to see/edit Info from itself
  all = db.Column(db.Boolean, nullable=False)                                                                                       # Has Rights to see/edit All Info

  # IDs with a Reference to another Table
  apiobject_id = db.Column(db.Integer, db.ForeignKey('api_object.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)      # Reference to the ApiObject of the Right
  apiaction_id = db.Column(db.Integer, db.ForeignKey('api_action.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)      # Reference to the ApiAction of the Right

  # Referenced Properties
  apiobject = db.relationship('ApiObject', foreign_keys='Right.apiobject_id', back_populates='right', lazy=False)                                                      # ApiObject (Object) of the Right
  apiaction = db.relationship('ApiAction', foreign_keys='Right.apiaction_id', back_populates='right', lazy=False)                                                      # ApiAction (Object) of the Right
  function = db.relationship('Function', secondary=FunctionRightLink, lazy=False, back_populates='right')                           # Function (Object) of the Right
  team = db.relationship('Team', secondary=TeamRightLink, lazy=False, back_populates='right')                                       # Team (Object) of the Right

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric([])
  def getPublicProperties(self): return ['id', 'apiobject', 'apiaction', 'function', 'team', 'isolated', 'own', 'all']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id']
  def notEditable(self): return ['id']
  def getOwn(self): return None
  def getIsolated(self): return None
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'right'}], fin)
  def isTimeSeries(self): return False


# File Object
class File(db.Model, Generic):
  __tablename__ = 'file'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  name = db.Column(db.String(40), nullable=False)                                                                                   # Name of the File
  reference = db.Column(db.String(100), nullable=False)                                                                             # Reference of the File
  creation = db.Column(db.DateTime(), default=datetime.utcnow)                                                                      # Creation DateTime of the File
  size = db.Column(db.Integer, nullable=False)                                                                                      # Size of the File (in kB)

  # IDs with a Reference to another Table
  uploader_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=False)            # Reference to the User (Object)

  # Referenced Properties
  uploader = db.relationship('User', foreign_keys='File.uploader_id', back_populates='file', lazy=True)                             # User (Object) of the File
  userImage = db.relationship('User', foreign_keys='User.image_id', back_populates='image', lazy=True)                              # User Image (Object) of the File

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['reference'])
  def getPublicProperties(self): return ['id', 'name', 'reference', 'uploader', 'creation', 'size']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id', 'name', 'reference', 'uploader', 'creation', 'size']
  def notEditable(self): return ['id', 'name', 'reference', 'uploader', 'creation', 'size']
  def getOwn(self): return [self.uploader.getOwn(), self.userImage.getOwn()]
  def getIsolated(self): return [self.uploader.team.getIsolated(), self.userImage.team.getIsolated()]
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'file'}], fin)
  def isTimeSeries(self): return False


# Translation Object
class Translation(db.Model, Generic):
  __tablename__ = 'translation'

  # Direct Properties
  id = db.Column(db.Integer, primary_key=True)                                                                                      # PK: UID
  language = db.Column(db.String(20), nullable=False)                                                                               # Language of the Translation
  country = db.Column(db.String(20), nullable=False)                                                                                # Country of the Translation
  flag = db.Column(db.String(10), nullable=False)                                                                                   # Flag of the Translation
  translationFile = db.Column(db.String(10), nullable=False, unique=True)                                                           # Translation File Name of the Translation
  locale = db.Column(db.String(10), nullable=False, unique=True)                                                                    # Locale of the Translation
  enabled = db.Column(db.Boolean, nullable=False)                                                                                   # Enabled to use Translation

  # IDs with a Reference to another Table

  # Referenced Properties

  # Functions
  def getUniqueProperties(self): return self.getUniquePropertiesGeneric(['flag', 'translationFile', 'locale'])
  def getPublicProperties(self): return ['id', 'language', 'country', 'flag', 'translationFile', 'locale', 'enabled']
  def getPublic(self, getCallConfig, userInfo, fin=[]): return self.getPublicGeneric(getCallConfig, userInfo, self.__class__.__name__, self.getPublicProperties(), fin=self.getFinites(fin))
  def notSelfEditable(self): return ['id']
  def notEditable(self): return ['id']
  def getOwn(self): return None
  def getIsolated(self): return None
  def getFinites(self, fin): return self.finites([{'iter': None, 'attr': 'translation'}], fin)
  def isTimeSeries(self): return False
