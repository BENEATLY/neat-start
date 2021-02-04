// Imports: Components
import * as appDefComponents from './app.def.components';


// Construct Modal List
const modalImportsList = [

    // Default Modals
    { name: 'info', component: appDefComponents.componentImportsDict['InfoModalComponent'] },
    { name: 'property', component: appDefComponents.componentImportsDict['PropertyModalComponent'] },
    { name: 'longcontent', component: appDefComponents.componentImportsDict['LongContentModalComponent'] },
    { name: 'help', component: appDefComponents.componentImportsDict['HelpModalComponent'] }

];


// Export Dicts, Lists & Functions
export { modalImportsList };
