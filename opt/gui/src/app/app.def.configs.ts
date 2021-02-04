// Imports: Config Loaders
import { AppConfig } from './app.config';


// Construct Config Dictionary
const configImportsDict = {
  'AppConfig': AppConfig
};

// Construct Config List
const configImportsList = [AppConfig];

// Get Config By Name
function getConfigImportByName(name) { return configImportsDict[name]; }


// Export Dicts, Lists & Functions
export { configImportsDict, configImportsList, getConfigImportByName };
