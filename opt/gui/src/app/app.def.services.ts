// Imports: Custom Services
import { DataService } from './data.service';
import { TimezoneService } from './timezone.service';
import { TranslationService } from './translation.service';
import { SnackBarService } from './snackbar.service';
import { RouteFetchService } from './routing.service';


// Construct Service Dictionary
const serviceImportsDict = {
  'DataService': DataService,
  'TimezoneService': TimezoneService,
  'TranslationService': TranslationService,
  'SnackBarService': SnackBarService,
  'RouteFetchService': RouteFetchService
};

// Construct Service List
const serviceImportsList = [DataService, TimezoneService, TranslationService, SnackBarService, RouteFetchService];

// Get Service By Name
function getServiceImportByName(name) { return serviceImportsDict[name]; }


// Export Dicts, Lists & Functions
export { serviceImportsDict, serviceImportsList, getServiceImportByName };
