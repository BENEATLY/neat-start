# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Standard Modules
from flask import Flask                                                                     # Flask App Lib
from flask_sqlalchemy import SQLAlchemy                                                     # SQLAlchemy Lib
import traceback                                                                            # Exception Display Lib
from copy import copy, deepcopy                                                             # Copy Function

# IMPORT: Custom Modules
from basic import *                                                                         # Basic Lib
import tables                                                                               # Tables Lib
import validate                                                                             # Validate Lib


# INTERNAL PRODUCER
internalProducer = createProducer()

# GET CALL CONFIG
if (os.path.isfile('/etc/neatly/base/api/api.json')):
    getCallConfig = readJSONFile('/etc/neatly/base/api/api.json')['getCallConfig']
else:
    getCallConfig = readJSONFile('/etc/neatly/base/api/default.json')['getCallConfig']


# FUNCTION: Remove Id of Dictionary
def noId(attr):
  try:
      del attr['id']
  except:
      pass
  return attr

# FUNCTION: Log User
def logUser(user):
    try:
        if isinstance(user, str):
            return user
        elif (hasattr(user, 'userName') and hasattr(user, 'id')):
            return str(user.userName) + ' ' + '(' + str(user.id) + ')'
        else:
            return 'Unknown'
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return 'Unknown'

# FUNCTION: Discover Property Changes
def discoverPropertyChanges(pre, post, meta):
    try:
        if (not pre):
            return list(set(list(post.keys()) + (meta['changes'] if (meta and ('changes' in meta)) else [])))
        elif (not post):
            return list(set(list(pre.keys()) + (meta['changes'] if (meta and ('changes' in meta)) else [])))
        else:
            allProperties = list(set(list(post.keys()) + list(pre.keys())))
            changedProperties = []
            for property in allProperties:
                if ((property in post.keys()) and (property in pre.keys())):
                    if (post[property] != pre[property]):
                        changedProperties.append(property)
                else:
                    changedProperties.append(property)
            return list(set(changedProperties + (meta['changes'] if (meta and ('changes' in meta)) else [])))
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Send Object Update Message
def sendObjectUpdateMessage(user, model, id, type, pre, post, meta):
    try:
        if (internalProducer):
            if (user and (not hasattr(user, 'id'))):
                if (user == 'RESOURCES'):
                    meta = {**meta, **{'default': True}}
            if (('trigger' not in meta) or (meta['trigger'] == True)):
                internalProducer.send('_internal.object.trigger', value={'time': datetime.now().isoformat(), 'objectName': model().__class__.__name__, 'user': (user.id if (user and hasattr(user, 'id')) else None), 'id': (id if (id) else (post['id'] if (type == 'create') else pre['id'])), 'type': type, 'pre': pre, 'post': post, 'changes': discoverPropertyChanges(pre, post, meta), 'meta': meta})
        else:
            appLogger.warning('No producer available to send object update message')
    except:
        appLogger.error('Unable to send object update message')
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Retrieve Object
def retrieveObject(session, item):
    try:
        [singleUnique, multiUnique] = item.getUniqueProperties()
        if (len(singleUnique) > 0):
            for k,v in singleUnique.items():
                if isinstance(v, tables.Generic):
                    object = session.query(item.__class__).filter_by(**{k + '_id': v.id}).first()
                    if (object != None):
                        appLogger.debug('Retrieved object: ' + str(object))
                        return object
                elif (not isinstance(v, list)):
                    object = session.query(item.__class__).filter_by(**{k: v}).first()
                    if (object != None):
                        appLogger.debug('Retrieved object: ' + str(object))
                        return object
                else:
                    object = [o for o in session.query(item.__class__).all() if sorted([i.id for i in o.getAttr(k)]) == sorted([i.id for i in v])]
                    if (len(object) > 1):
                        appLogger.debug('Retrieved object: ' + str(sorted(object, key=lambda x: x.id)[0]))
                        return sorted(object, key=lambda x: x.id)[0]
                    else:
                        appLogger.warning('Unable to retrieve object' + ' ' + str(item.__class__.__name__) + ' ' + 'with unique attributes: ' + str([singleUnique, multiUnique]))
                        return None
            appLogger.warning('Unable to retrieve object' + ' ' + str(item.__class__.__name__) + ' ' + 'with unique attributes: ' + str([singleUnique, multiUnique]))
            return None
        elif (len(multiUnique) > 0):
            items = {}
            for k,v in multiUnique.items():
                if isinstance(v, tables.Generic):
                    items[k + '_id'] = v.id
                elif (not isinstance(v, list)):
                    items[k] = v
            object = session.query(item.__class__).filter_by(**items).all()
            for k,v in multiUnique.items():
                if isinstance(v, list):
                    object = [o for o in object if sorted([i.id for i in o.getAttr(k)]) == sorted([i.id for i in v])]
            if (len(object) > 1):
                appLogger.debug('Retrieved object: ' + str(sorted(object, key=lambda x: x.id)[0]))
                return sorted(object, key=lambda x: x.id)[0]
            else:
                appLogger.warning('Unable to retrieve object' + ' ' + str(item.__class__.__name__) + ' ' + 'with unique attributes: ' + str([singleUnique, multiUnique]))
                return None
        else:
            appLogger.debug('No unique properties to retrieve object')
            return None
        appLogger.debug('Retrieved object: ' + str(object))
        return object
    except:
        appLogger.warning('Unable to retrieve object' + ' ' + str(item.__class__.__name__) + ' ' + 'with unique attributes: ' + str([singleUnique, multiUnique]))
        return None

# FUNCTION: Check Rights
def checkRights(session, model, user, object, action):
    try:
        rights = session.query(model).all()
        rights = [right for right in rights if ((right.apiobject.name == object) and (right.apiaction.name == action))]
        if len(rights) > 0:
            result = [[right.own, right.isolated, right.all] for right in rights if ((user.team in right.team) and (user.function in right.function)) or ((len(right.function) == 0) and (len(right.team) == 0)) or ((user.team in right.team) and (len(right.function) == 0)) or ((len(right.team) == 0) and (user.function in right.function))]
            if len(result) > 0:
                arr = [sum(i) for i in zip(*result)]
                appLogger.debug('Rights: ' + str(arr))
                return arr
            else:
                appLogger.debug('No rights found!')
                return False
        else:
            appLogger.debug('No rights found!') # noCoverage
            return False # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Check Limitations
def checkLimitations(session, model, user, rights, id, data):
    try:
        for key in data.keys():
            if key in model().notEditable():
                appLogger.debug('Limitation: ' + str(key) + ' is not editable')
                return False
        if rights[2]:
            appLogger.debug('Rights \'all\': no limitation')
            return True
        if model().__class__.__name__ == 'User':
            for key in data.keys():
                if key in model().notSelfEditable():
                    appLogger.debug('Limitation: ' + str(key) + ' is not self editable')
                    return False
            if (rights[0]) and (int(id) == user.id):
                appLogger.debug('No limitation')
                return True
        appLogger.debug('Limitation: no right could be matched') # noCoverage
        return False # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Get Own Rights
def getOwnRights(rights, user):
    try:
        rights = [objectify(right) for right in rights]
        user = objectify(user)
        rights = [right for right in rights if ([r for r in right.team if r.id == user.team.id] and [r for r in right.function if r.id == user.function.id]) or ((len(right.function) == 0) and (len(right.team) == 0)) or ([r for r in right.team if r.id == user.team.id] and (len(right.function) == 0)) or ((len(right.team) == 0) and [r for r in right.function if r.id == user.function.id])]
        results = []
        for right in rights:
            if len([res for res in results if (res.apiaction.id == right.apiaction.id) and (res.apiobject.id == right.apiobject.id)]) == 0:
                results.append(right)
            else:
                object = [res for res in results if (res.apiaction.id == right.apiaction.id) and (res.apiobject.id == right.apiobject.id)][0]
                object.all = (object.all or right.all)
                object.own = (object.own or right.own)
                object.isolated = (object.isolated or right.isolated)
        filteredRights = []
        for res in results:
            if res.all:
                right = 'all'
            elif res.isolated:
                right = 'isolated'
            elif res.own:
                right = 'own'
            else:
                right = None
            filteredRights.append({'apiobject': vars(res.apiobject), 'apiaction': vars(res.apiaction), 'right': right})
        return filteredRights
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Complete Tentative Object
def completeTentativeObject(session, tables, model, obj, item):
    try:
        for rel_key, rel_val in inspect(model).relationships.items():
            col = [col for col in model.__table__.columns if str(col).split(model.__tablename__ + '.')[1] == (rel_key + '_id')]
            if len(col) == 1:
                col = col[0]
                if (rel_key + '_id') in vars(deepcopy(obj)):
                    item.setAttr(rel_key, session.query(validate.getClassByName(str(rel_val.target), tables)).filter_by(id=getattr(obj, rel_key + '_id')).first())
        return item
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Comply Rights
def complyRights(session, tables, model, obj, rights, user):
    try:
        if rights[2]:
            return obj
        if rights[1]:
            newItem = model(**vars(obj))
            item = completeTentativeObject(session, tables, model, obj, newItem)
            if item and checkIsolatedAllowed(item, user):
                session.expunge(item)
                return obj
            else:
                return False
        if rights[0]:
            newItem = model(**vars(obj))
            item = completeTentativeObject(session, tables, model, obj, newItem)
            if item and checkOwnAllowed(item, user):
                session.expunge(item)
                return obj
            else:
                return False
        return False
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Create Default Object Rights
def createDefaultObjectRights(userParameter, sessionParameter, apiObject):
    try:
        createByDict(userParameter, sessionParameter, tables.ApiObject, {}, **{'name': apiObject})
        apiActions = ['Get List', 'Get by Id', 'Create', 'Delete', 'Edit']
        rights = []
        for apiAction in apiActions:
            rights.append(tables.Right(apiobject=retrieveObject(sessionParameter, tables.ApiObject(name=apiObject)), apiaction=retrieveObject(sessionParameter, tables.ApiAction(name=apiAction)), isolated=False, own=False, all=True))
            rights[-1].team = [sessionParameter.query(tables.Team).filter_by(id=1).first()]
        [merge(userParameter, sessionParameter, right, {}) for right in rights if (not retrieveObject(sessionParameter, right))]
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create DB Connection
def createDBConnection():
    try:
        app = Flask(__name__)
        dbConfig = readJSONFile('/etc/neatly/base/db.json')
        app.config["SQLALCHEMY_DATABASE_URI"] = createDBPathConfig(dbConfig['connection'])
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        app.config['JSON_SORT_KEYS'] = False
        app.json_encoder = CustomJSONEncoder
        app.json_decoder = CustomJSONDecoder
        db = SQLAlchemy(app)
        appLogger.debug('Created a database connection')
        return db
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Create Item By Dictionary (if not Existing)
def createByDict(userParameter, sessionParameter, modelParameter, meta, **kwargs):
    if (('forceId' in kwargs) and (kwargs['forceId'])):
        del kwargs['forceId']
        if 'id' in kwargs:
            if sessionParameter.query(modelParameter).filter_by(id=kwargs['id']).first():
                appLogger.warning(logUser(userParameter) + " - " + modelParameter().__class__.__name__ + " {" + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in kwargs.items()]) + "} already exists!") # noCoverage
                return False # noCoverage
    else:
        try:
            del kwargs['id']
        except:
            pass
    try:
        [singleUnique, multiUnique] = [list(i.keys()) for i in modelParameter().getUniqueProperties()]
        filteredKwargs = {}
        if (len(singleUnique) > 0):
            for property in singleUnique:
                if property in kwargs:
                    if (isinstance(kwargs[property], list)):
                        if (kwargs[property] == []):
                            filteredKwargs[property] = None
                    else:
                        filteredKwargs[property] = kwargs[property]
                else:
                    filteredKwargs[property] = None
        elif (len(multiUnique) > 0):
            for property in multiUnique:
                if property in kwargs:
                    if (isinstance(kwargs[property], list)):
                        if (kwargs[property] == []):
                            filteredKwargs[property] = None
                    else:
                        filteredKwargs[property] = kwargs[property]
                else:
                    filteredKwargs[property] = None
        if (len(filteredKwargs) > 0) and sessionParameter.query(modelParameter).filter_by(**filteredKwargs).first():
            appLogger.warning(logUser(userParameter) + " - " + modelParameter().__class__.__name__ + " {" + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in kwargs.items()]) + "} already exists!") # noCoverage
            return True # noCoverage
        else:
            regularKwargs = {}
            linkedKwargs = {}
            for key,val in kwargs.items():
                if key in [str(col).split(modelParameter.__tablename__ + '.')[1] for col in modelParameter.__table__.columns]:
                    regularKwargs[key] = val
                if key in inspect(modelParameter).relationships:
                    linkedKwargs[key] = val
            objectToAdd = modelParameter(**regularKwargs)
            for key,val in linkedKwargs.items():
                objectToAdd.setAttr(key, val)
            sessionParameter.add(objectToAdd)
            try:
                appLogger.info(logUser(userParameter) + " - " + "Adding " + modelParameter().__class__.__name__ + " {" + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in kwargs.items()]) + "}")
                sessionParameter.commit()
                post = objectToAdd.getPublic(getCallConfig, None)
                sendObjectUpdateMessage(userParameter, modelParameter, None, 'create', None, post, {**meta, **{'changes': list(regularKwargs.keys())}})
                return True
            except:
                sessionParameter.rollback() # noCoverage
                appLogger.error(logUser(userParameter) + " - " + "Adding " + modelParameter().__class__.__name__ + " {" + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in kwargs.items()]) + "} failed [ROLLBACK]") # noCoverage
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
                return False # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Delete Item By Id (if Existing)
def deleteById(userParameter, sessionParameter, modelParameter, id, meta):
    try:
        instance = sessionParameter.query(modelParameter).filter_by(id=id).first()
        if instance:
            pre = instance.getPublic(getCallConfig, None)
            sessionParameter.delete(instance)
            try:
                appLogger.info(logUser(userParameter) + " - " + "Deleting " + modelParameter().__class__.__name__ + " {id=\"" + str(id) + "\"}")
                sessionParameter.commit()
                sendObjectUpdateMessage(userParameter, modelParameter, id, 'delete', pre, None, meta)
                return True
            except:
                sessionParameter.rollback() # noCoverage
                appLogger.error(logUser(userParameter) + " - " + "Deleting " + modelParameter().__class__.__name__ + " {id=\"" + str(id) + "\"} failed [ROLLBACK]") # noCoverage
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
                return False # noCoverage
        else:
            appLogger.warning(logUser(userParameter) + " - " + modelParameter().__class__.__name__ + " {id=\"" + str(id) + "\"} can't be deleted, it doesn't exist") # noCoverage
            return False # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Edit Item By Id (if Existing)
def edit(userParameter, sessionParameter, modelParameter, idParameter, meta, **kwargs):
    try:
        instance = sessionParameter.query(modelParameter).filter_by(id=idParameter).first()
        if instance:
            pre = instance.getPublic(getCallConfig, None)
            for key, value in kwargs.items():
                setattr(instance, key, value)
            try:
                appLogger.info(logUser(userParameter) + " - " + "Editing " + modelParameter().__class__.__name__ + " {id=\"" + str(idParameter) + '", ' + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in kwargs.items()]) + "}")
                sessionParameter.commit()
                post = instance.getPublic(getCallConfig, None)
                sendObjectUpdateMessage(userParameter, modelParameter, idParameter, 'edit', pre, post, {**meta, **{'changes': list(kwargs.keys())}})
                return True
            except:
                sessionParameter.rollback() # noCoverage
                appLogger.error(logUser(userParameter) + " - " + "Editing " + modelParameter().__class__.__name__ + " {id=\"" + str(idParameter) + '", ' + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in kwargs.items()]) + "} failed [ROLLBACK]") # noCoverage
                appLogger.error(' '.join(str(traceback.format_exc()).split()))
                return False # noCoverage
        else:
            appLogger.warning(logUser(userParameter) + " - " + modelParameter().__class__.__name__ + " {id=\"" + str(idParameter) + "\"} can't be edited, it doesn't exist") # noCoverage
            return False # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Merge Item
def merge(userParameter, sessionParameter, item, meta):
    try:
        initDict = item.dictifyObject()
        sessionParameter.expire_all()
        preDict = item.dictifyObject()
        pre = item.getPublic(getCallConfig, None)
        for attr, val in initDict.items():
            item.setAttr(attr, val)
        sessionParameter.merge(item)
        try:
            appLogger.info(logUser(userParameter) + " - " + "Merging " + item.__class__.__name__ + " {" + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in item.getPublic(getCallConfig, None).items()]) + "}")
            sessionParameter.commit()
            postDict = item.dictifyObject()
            post = item.getPublic(getCallConfig, None)
            sendObjectUpdateMessage(userParameter, item.__class__, item.id, 'edit', pre, post, {**meta, **{'changes': objectKeyDiff(preDict, postDict)}})
            return True
        except:
            sessionParameter.rollback() # noCoverage
            appLogger.error(logUser(userParameter) + " - " + "Merging " + item.__class__.__name__ + " {" + ', '.join([str(k) + "=" + "\"" + str(v) + "\"" for k,v in item.getPublic(getCallConfig, None).items()]) + "} failed [ROLLBACK]") # noCoverage
            appLogger.error(' '.join(str(traceback.format_exc()).split()))
            return False # noCoverage
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage
