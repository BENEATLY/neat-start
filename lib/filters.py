# Author:     Thomas D'haenens
# Created:    14/09/2019 8:21
# License:    GPLv3


# IMPORT: Custom Modules
from basic import *                                                                                        # Basic Lib


# FUNCTION: Split In Operations
def splitInOperations(filter):
    try:
        inBracket = 0
        startInBracketIndex = None
        startOutBracketIndex = 0
        splitted = []
        for index, char in enumerate(filter):
            if (char == '('):
                inBracket += 1
                if (inBracket == 1):
                    startInBracketIndex = index
                    if (startOutBracketIndex != 0):
                        if (index != startOutBracketIndex):
                            splitted.append(filter[startOutBracketIndex:index])
            elif (char == ')'):
                if (inBracket == 1):
                    splitted.append(filter[startInBracketIndex:index+1])
                    startOutBracketIndex = index+1
                inBracket -= 1
            elif (((char == '|') or (char == '&')) and (inBracket == 0)):
                if (index != startOutBracketIndex):
                    splitted.append(filter[startOutBracketIndex:index])
                splitted.append(char)
                startOutBracketIndex = index+1
            elif (index+1 == len(filter)):
                splitted.append(filter[startOutBracketIndex:])
        if ((startInBracketIndex != None) and (startOutBracketIndex-startInBracketIndex == len(filter))):
            splitted = splitInOperations(filter[1:-1])
        if len(splitted) == 1:
            return splitted[0]
        if len(splitted) == 0:
            return True
        return splitted
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return []

# FUNCTION: Create Operations
def createOperations(filter):
    try:
        if ('&' in filter):
            calc = {'value' : [], 'operation': '&'}
            startIndex = 0
            for index, statement in enumerate(filter):
                if (statement == '&'):
                        calc['value'].append(''.join(filter[startIndex:index]))
                        startIndex = index+1
                elif (index+1 == len(filter)):
                    calc['value'].append(''.join(filter[startIndex:]))
        elif ('|' in filter):
            calc = {'value' : [], 'operation': '|'}
            startIndex = 0
            for index, statement in enumerate(filter):
                if (statement == '|'):
                        calc['value'].append(''.join(filter[startIndex:index]))
                        startIndex = index+1
                elif (index+1 == len(filter)):
                    calc['value'].append(''.join(filter[startIndex:]))
        else:
            return filter
        return calc
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return {'value' : [False], 'operation': '&'}

# FUNCTION: Iterate Operations
def iterateOperations(filter):
    try:
        if isinstance(filter, dict):
            for index,val in enumerate(filter['value']):
                if (isinstance(val, str)):
                    if (('|' in val) or ('&' in val) or ('(' in val) or (')' in val)):
                        filter['value'][index] = createOperations(splitInOperations(val))
                        filter['value'][index] = iterateOperations(filter['value'][index])
        return filter
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return {'value' : [False], 'operation': '&'}

# FUNCTION: Convert Value
def convertValue(val):
    if val.isdigit():
        return int(val)
    elif (val.startswith("'") and val.endswith("'")):
        return val[1:-1]
    elif (val.startswith('"') and val.endswith('"')):
        return val[1:-1]
    elif ('.' in val):
        return float(val)
    elif (val == 'true'):
        return True
    elif (val == 'false'):
        return False
    elif (val == 'null'):
        return None

# FUNCTION: Compare Values
def compareValues(val, ref, statement):
    if (ref != None):
        if (isinstance(val, float) and isinstance(ref, int)):
            ref = float(ref)
        elif (isinstance(val, int) and isinstance(ref, float)):
            val = float(val)
        elif (type(val) != type(ref)):
            return False
    if (statement == '!='):
        return (val != ref)
    elif (statement == '='):
        return (val == ref)
    elif (statement == '>='):
        return (val >= ref)
    elif (statement == '>'):
        return (val > ref)
    elif (statement == '<='):
        return (val <= ref)
    elif (statement == '<'):
        return (val < ref)
    elif (statement == '!~='):
        return (str(ref).lower() not in str(val).lower())
    elif (statement == '~='):
        return (str(ref).lower() in str(val).lower())
    else:
        return False

# FUNCTION: Evaluate Statement
def evaluateStatement(object, statement):
    try:
        try:
            val = deepcopy(object)
            attrs = statement['property'].split('.')
            for index,attr in enumerate(attrs):
                if attr in val:
                    val = val[attr]
                    if (index+1 == len(attrs)):
                        return compareValues(val, statement['value'], statement['statement'])
                else:
                    return False
        except:
            return False
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Verify Statement
def verifyStatement(object, val, sep):
    try:
        val = val.split(sep)
        if len(val) == 2:
            try:
                return evaluateStatement(object, {'property': val[0], 'value': convertValue(val[1]), 'statement': sep})
            except:
                return False
        else: return False
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Split In Statements
def splitInStatements(object, val):
    try:
        if ('!=' in val):
            return verifyStatement(object, val, '!=')
        elif ('>=' in val):
            return verifyStatement(object, val, '>=')
        elif ('<=' in val):
            return verifyStatement(object, val, '<=')
        elif ('!~=' in val):
            return verifyStatement(object, val, '!~=')
        elif ('~=' in val):
            return verifyStatement(object, val, '~=')
        elif ('=' in val):
            return verifyStatement(object, val, '=')
        elif ('>' in val):
            return verifyStatement(object, val, '>')
        elif ('<' in val):
            return verifyStatement(object, val, '<')
        else:
            return False
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Solve Statements
def solveStatements(object, filter):
    try:
        if isinstance(filter, str):
            filter = splitInStatements(object, filter)
        if isinstance(filter, dict):
            for index,val in enumerate(filter['value']):
                if (isinstance(val, str)):
                    filter['value'][index] = splitInStatements(object, val)
                else:
                    filter['value'][index] = solveStatements(object, val)
        return filter
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return {'value' : [False], 'operation': '&'}

# FUNCTION: Solve Operations
def solveOperations(filter):
    try:
        if isinstance(filter, dict):
            for index, operation in enumerate(filter['value']):
                if isinstance(operation, dict):
                    filter['value'][index] = solveOperations(operation)
            if filter['operation'] == '&': filter = all(filter['value'])
            elif filter['operation'] == '|': filter = any(filter['value'])
        return filter
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False

# FUNCTION: Filter By API Parameters
def filterByAPIParams(object, filter):
    try:
        if (filter == None):
            return True
        filter = createOperations(splitInOperations(filter))
        filter = iterateOperations(filter)
        filter = solveStatements(object, filter)
        filter = solveOperations(filter)
        return filter
    except:
        appLogger.error(' '.join(str(traceback.format_exc()).split()))
        return False
