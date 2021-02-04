# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Custom Modules
from basic import *                                                                                                                 # Basic Lib


# FUNCTION: Get Class by Name
def getClassByName(name, tables):
    classes = [classname[1] for classname in inspecter.getmembers(tables, inspecter.isclass) if (classname[1].__module__ == 'tables') and ((classname[0].lower() == name.lower()) or (getTableName(classname[0]) == name.lower()))]
    if len(classes) == 1:
        return classes[0]
    else:
        return None

# FUNCTION: Verify Existing Id
def verifyId(session, tables, model, id):
    try:
        if not isinstance(id, int):
            if id.isdigit():
                id = int(id)
            else:
                appLogger.warning('Attribute \'id\' is not an integer (validating id failed)') # noCoverage
                return False # noCoverage
        if not id in [i.id for i in session.query(model).all()]:
            appLogger.warning('Attribute \'id\' is not existing for ' + str(model().__class__.__name__) + ' (validating id failed)') # noCoverage
            return False # noCoverage
        return True
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Convert Data Type
def convertDataType(value, dataType):
    try:
        dataType = str(dataType)
        if dataType.startswith('FLOAT'):
            if (not isinstance(value, float)) and (isinstance(value, int)):
                return float(value)
        elif dataType.startswith('TIME'):
            if (not isinstance(value, time)) and (isinstance(value, str)):
                return time.fromisoformat(value)
        elif dataType.startswith('DATETIME'):
            if (not isinstance(value, datetime)) and (isinstance(value, str)):
                return datetime.fromisoformat(value)
        elif dataType.startswith('DATE'):
            if (not isinstance(value, date)) and (isinstance(value, str)):
                return date.fromisoformat(value)
        return None
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return None # noCoverage

# FUNCTION: Verify Data Type
def verifyDataType(value, dataType, nullable):
    try:
        dataType = str(dataType)
        if dataType.startswith('VARCHAR'):
            length = int(dataType.split('(')[1].split(')')[0]) if ('(' in dataType) else None
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            else:
                if not isinstance(value, str):
                    return False # noCoverage
                elif len(value) < 1:
                    return False # noCoverage
                elif length and (len(value) > length):
                    return False # noCoverage
        elif dataType.startswith('INTEGER'):
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            elif not isinstance(value, int):
                return False # noCoverage
        elif dataType.startswith('BOOLEAN'):
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            elif not isinstance(value, bool):
                return False # noCoverage
        elif dataType.startswith('FLOAT'):
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            elif not isinstance(value, float):
                return False # noCoverage
        elif dataType.startswith('TIME'):
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            elif not isinstance(value, time):
                return False # noCoverage
        elif dataType.startswith('DATETIME'):
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            elif not isinstance(value, datetime):
                return False # noCoverage
        elif dataType.startswith('DATE'):
            if value is None:
                if not nullable: # noCoverage
                    return False # noCoverage
            elif not isinstance(value, date):
                return False # noCoverage
        else:
            return False # noCoverage
        return True
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False # noCoverage

# FUNCTION: Check If Creation is OK with these Values
def validateObject(session, tables, model, obj, ignore):
    appLogger.info('Validating object of ' + str(model().__class__.__name__))
    try:
        if 'id' not in ignore:
            if not isinstance(obj.id, int):
                appLogger.warning('Attribute \'id\' is not an integer (validating object failed)') # noCoverage
                return None # noCoverage
            if not obj.id in [i.id for i in session.query(model).all()]:
                appLogger.warning('Attribute \'id\' is not existing for ' + str(model().__class__.__name__) + ' (validating object failed)') # noCoverage
                return None # noCoverage
        else:
            try:
                del obj['id']
            except:
                pass
        for col in model.__table__.columns:
            columnName = str(col).split(model.__tablename__ + '.')[1]
            if (columnName != 'id') and ('_id' not in columnName):
                if columnName in vars(obj):
                    if (not col.nullable) and (getattr(obj, columnName) is None):
                        appLogger.warning('Attribute \'' + str(columnName) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                        return None # noCoverage
                    if (getattr(obj, columnName) is not None) and (col.unique) and (getattr(obj, columnName) in [getattr(i, columnName) for i in session.query(model).all()]):
                        appLogger.warning('Attribute \'' + str(columnName) + '\' must be unique, but is already present in another entry (validating object failed)') # noCoverage
                        return None # noCoverage
                    if (convertDataType(getattr(obj, columnName), col.type) != None):
                        setattr(obj, columnName, convertDataType(getattr(obj, columnName), col.type))
                    if (getattr(obj, columnName) is not None) and (not verifyDataType(getattr(obj, columnName), col.type, col.nullable)):
                        appLogger.warning('Attribute \'' + str(columnName) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                        return None # noCoverage
                elif not col.nullable:
                    appLogger.warning('Attribute \'' + str(columnName) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                    return None # noCoverage
        for rel_key, rel_val in inspect(model).relationships.items():
            col = [col for col in model.__table__.columns if str(col).split(model.__tablename__ + '.')[1] == (rel_key + '_id')]
            if len(col) == 1:
                col = col[0]
                if (rel_key + '_id') in vars(obj):
                    if (not col.nullable) and (getattr(obj, rel_key + '_id') is None):
                        appLogger.warning('Attribute \'' + str(rel_key + '_id') + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                        return None # noCoverage
                    if not getattr(obj, rel_key + '_id') in [i.id for i in session.query(getClassByName(str(rel_val.target), tables)).all()]:
                        appLogger.warning('Attribute \'' + str(rel_key + '_id') + '\' is not known in the target table (validating object failed)') # noCoverage
                        return None # noCoverage
                    if (getattr(obj, rel_key + '_id') is not None) and (not verifyDataType(getattr(obj, rel_key + '_id'), col.type, col.nullable)):
                        appLogger.warning('Attribute \'' + str(rel_key + '_id') + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                        return None # noCoverage
                else:
                    if rel_key in vars(obj):
                        val = getattr(obj, rel_key)
                        if (not col.nullable) and (val is None):
                            appLogger.warning('Attribute \'' + str(rel_key) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                            return None # noCoverage
                        if not isinstance(val, int):
                            if (val is not None):
                                if (not isinstance(val, getClassByName(str(rel_val.target), tables))):
                                    if hasattr(val, 'id'):
                                        if (not val.id in [i.id for i in session.query(getClassByName(str(rel_val.target), tables)).all()]):
                                            appLogger.error(val.id)
                                            appLogger.error(str(rel_val.target))
                                            appLogger.error([i.id for i in session.query(getClassByName(str(rel_val.target), tables)).all()])
                                            appLogger.warning('Attribute \'' + str(rel_key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                            return None # noCoverage
                                    else:
                                        appLogger.warning('Attribute \'' + str(rel_key) + '\' does not meet the defined data format for the target (validating object failed)') # noCoverage
                                        return None # noCoverage
                                elif (isinstance(val, Obj)) and (not val in [i for i in session.query(getClassByName(str(rel_val.target), tables)).all()]):
                                    appLogger.warning('Attribute \'' + str(rel_key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                    return None # noCoverage
                                else:
                                    appLogger.warning('Attribute \'' + str(rel_key) + '\' does not meet the defined data format for the target (validating object failed)') # noCoverage
                                    return None # noCoverage
                            if val is None:
                                obj.deleteAttr(rel_key + '_id')
                                obj.setAttr(rel_key, None)
                            elif (not isinstance(val, getClassByName(str(rel_val.target), tables))):
                                obj.deleteAttr(rel_key + '_id')
                                obj.setAttr(rel_key, session.query(getClassByName(str(rel_val.target), tables)).filter_by(id=val.id).first())
                        else:
                            if not val in [i.id for i in session.query(getClassByName(str(rel_val.target), tables)).all()]:
                                appLogger.warning('Attribute \'' + str(rel_key + '_id') + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage
                            obj.deleteAttr(rel_key + '_id')
                            obj.setAttr(rel_key, (None if (val == None) else session.query(getClassByName(str(rel_val.target), tables)).filter_by(id=val).first()))
                    elif not col.nullable:
                        appLogger.warning('Attribute \'' + str(rel_key) + '\' is none, but can\'t be none (validating object failed)') # noCoverage
                        return None # noCoverage
            elif rel_key in vars(obj):
                val = getattr(obj, rel_key)
                if isinstance(val, list):
                    newList = []
                    for value in val:
                        if isinstance(value, int):
                            foundItem = session.query(getClassByName(str(rel_val.target), tables)).filter_by(id=value).first()
                            if foundItem:
                                newList.append(foundItem)
                            else:
                                appLogger.warning('Attribute \'' + str(rel_key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                return None # noCoverage
                        elif hasattr(value, '__dict__') and ('id' in vars(value)) and (not isinstance(value, getClassByName(str(rel_val.target), tables))):
                            if isinstance(value.id, int):
                                foundItem = session.query(getClassByName(str(rel_val.target), tables)).filter_by(id=value.id).first()
                                if foundItem:
                                    newList.append(foundItem)
                                else:
                                    appLogger.warning('Attribute \'' + str(rel_key) + '\' is not known in the target table (validating object failed)') # noCoverage
                                    return None # noCoverage
                            else:
                                appLogger.warning('Attribute \'' + str(rel_key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                                return None # noCoverage
                        elif (not isinstance(value, getClassByName(str(rel_val.target), tables))):
                            appLogger.warning('Attribute \'' + str(rel_key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                            return None # noCoverage
                    obj.setAttr(rel_key, newList)
                else:
                    appLogger.warning('Attribute \'' + str(rel_key) + '\' does not meet the defined data format for this column (validating object failed)') # noCoverage
                    return None # noCoverage
        appLogger.info('Validating object of ' + str(model().__class__.__name__) + ' succeeded')
        return obj
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))

# FUNCTION: Check If Edit is OK with these Values
def validateEditability(session, tables, model, obj):
    appLogger.info('Validating editability of ' + str(model().__class__.__name__))
    try:
        delattr(obj, 'id')
    except:
        pass
    try:
        objTemp = copy(obj)
        for key, val in vars(obj).items():
            if key in [str(col).split(model.__tablename__ + '.')[1] for col in model.__table__.columns]:
                if (key != 'id') and ('_id' not in key):
                    col = [col for col in model.__table__.columns if str(col).split(model.__tablename__ + '.')[1] == key][0]
                    if (not col.nullable) and (val is None):
                        appLogger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating editability failed)') # noCoverage
                        return None # noCoverage
                    if (val is not None) and (col.unique) and (val in [getattr(i, key) for i in session.query(model).all()]):
                        appLogger.warning('Attribute \'' + str(key) + '\' must be unique, but is already present in another entry (validating editability failed)') # noCoverage
                        return None # noCoverage
                    if (convertDataType(val, col.type) != None):
                        val = convertDataType(val, col.type)
                    if (val is not None) and (not verifyDataType(val, col.type, col.nullable)):
                        appLogger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating editability failed)') # noCoverage
                        return None # noCoverage
                else:
                    appLogger.warning('Attribute \'' + str(key) + '\' is an id or a reference to another table, only direct properties can be edited (validating editability failed)') # noCoverage
                    return None # noCoverage
            else:
                if key in inspect(model).relationships:
                    col = [col for col in model.__table__.columns if str(col).split(model.__tablename__ + '.')[1] == (key + '_id')]
                    if len(col) == 1:
                        col = col[0]
                        columnName = str(col).split(underscore(model().__class__.__name__) + '.')[1].split('_id')[0]
                        if (not col.nullable) and (val is None):
                            appLogger.warning('Attribute \'' + str(key) + '\' is none, but can\'t be none (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if not val in [i.id for i in session.query(getClassByName(str(inspect(model).relationships[key].target), tables)).all()]:
                            appLogger.warning('Attribute \'' + str(key) + '\' is not known in the target table (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if (val is not None) and (col.unique) and (val in [getattr(i, key) for i in session.query(model).all()]):
                            appLogger.warning('Attribute \'' + str(key) + '\' must be unique, but is already present in another entry (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if (convertDataType(getattr(obj, columnName), col.type) != None):
                            setattr(obj, columnName, convertDataType(getattr(obj, columnName), col.type))
                        if (val is not None) and (not verifyDataType(val, col.type, col.nullable)):
                            appLogger.warning('Attribute \'' + str(key) + '\' does not meet the defined data format for this column (validating editability failed)') # noCoverage
                            return None # noCoverage
                        try:
                            delattr(objTemp, key + '_id')
                        except:
                            pass
                        setattr(objTemp, key, (None if (val == None) else session.query(getClassByName(str(inspect(model).relationships[key].target), tables)).filter_by(id=val).first()))
                    else:
                        if not isinstance(val, list):
                            appLogger.warning('Attribute \'' + str(key) + '\' is not a list (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if (False not in [hasattr(value, '__dict__') for value in val]) and (False not in [('id' in vars(value)) for value in val]):
                            val = [value.id for value in val]
                        if False in [verifyDataType(value, 'INTEGER', False) for value in val]:
                            appLogger.warning('Attribute \'' + str(key) + '\' list contains a value which is no integer (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if len(set(val)) != len(val):
                            appLogger.warning('Attribute \'' + str(key) + '\' list contains a value which is already present in the list (validating editability failed)') # noCoverage
                            return None # noCoverage
                        if False in [value in [i.id for i in session.query(getClassByName(str(inspect(model).relationships[key].target), tables)).all()] for value in val]:
                            appLogger.warning('Attribute \'' + str(key) + '\' list contains a value which is not known in the target table (validating editability failed)') # noCoverage
                            return None # noCoverage
                        setattr(objTemp, key, [session.query(getClassByName(str(inspect(model).relationships[key].target), tables)).filter_by(id=value).first() for value in val])
                else:
                    appLogger.warning('Attribute \'' + str(key) + '\' is not known in the table (validating editability failed)') # noCoverage
                    return None # noCoverage
        appLogger.info('Validating editability of ' + str(model().__class__.__name__) + ' succeeded')
        return objTemp
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
