// Imports: Custom Services
import { DataService } from './data.service';
import { TimezoneService } from './timezone.service';
import { TranslationService } from './translation.service';
import { SnackBarService } from './snackbar.service';
import { RouteFetchService } from './routing.service';

// Imports: Config Loaders
import { AppConfig } from './app.config';


// App Config Function
function initConfig(config: AppConfig) { return () => config.load(); }

// App User Data Function
function initUserData(data: DataService) { return () => data.loadUser(); }

// App Routes Function
function initRoutes(data: DataService) { return () => data.loadRoutes(); }

// App Timezone Function
function initTimezone(timezone: TimezoneService) { return () => timezone.loadTimezone(); }

// App Translation Function
function initTranslation(translation: TranslationService) { return () => translation.loadTranslation(); }

// Construct Function Dictionary
const functionImportsDict = {
  'initConfig': initConfig,
  'initUserData': initUserData,
  'initRoutes': initRoutes,
  'initTimezone': initTimezone,
  'initTranslation': initTranslation
};


// Export Dicts, Lists & Functions
export { functionImportsDict };
