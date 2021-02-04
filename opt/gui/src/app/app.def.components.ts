// Imports: Default
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { LogInComponent } from './login/login.component';
import { LanguageComponent } from './language/language.component';
import { NavbarComponent } from './navbar/navbar.component';
import { LeftBarComponent } from './leftbar/leftbar.component';
import { SettingsVersionComponent } from './settings/version/version.component';
import { SettingsRightComponent } from './settings/right/right.component';
import { SettingsUserComponent } from './settings/user/user.component';
import { SettingsTeamComponent } from './settings/team/team.component';
import { SettingsFunctionComponent } from './settings/function/function.component';
import { SettingsSSLComponent } from './settings/ssl/ssl.component';
import { SettingsCrudComponent } from './settings/crud/crud.component';
import { SettingsLanguageComponent } from './settings/language/language.component';
import { UserInfoComponent } from './user/info/info.component';
import { UserLanguageComponent } from './user/language/language.component';
import { UserSessionComponent } from './user/session/session.component';
import { UserTimezoneComponent } from './user/timezone/timezone.component';
import { UserLogOutComponent } from './user/logout/logout.component';
import { FileComponent } from './file/file.component';

// Imports: Modals
import { InfoModalComponent } from './modals/info/info.component';
import { PropertyModalComponent } from './modals/property/property.component';
import { LongContentModalComponent } from './modals/longcontent/longcontent.component';
import { HelpModalComponent } from './modals/help/help.component';

// Imports: Focuses
import { ImageFocusComponent } from './focuses/image/image.component';


// Construct Component Dictionary
const componentImportsDict = {
  'DashboardComponent': DashboardComponent,
  'HomeComponent': HomeComponent,
  'LogInComponent': LogInComponent,
  'LanguageComponent': LanguageComponent,
  'NavbarComponent': NavbarComponent,
  'LeftBarComponent': LeftBarComponent,
  'SettingsVersionComponent': SettingsVersionComponent,
  'SettingsRightComponent': SettingsRightComponent,
  'SettingsUserComponent': SettingsUserComponent,
  'SettingsTeamComponent': SettingsTeamComponent,
  'SettingsFunctionComponent': SettingsFunctionComponent,
  'SettingsSSLComponent': SettingsSSLComponent,
  'SettingsCrudComponent': SettingsCrudComponent,
  'SettingsLanguageComponent': SettingsLanguageComponent,
  'UserInfoComponent': UserInfoComponent,
  'UserLanguageComponent': UserLanguageComponent,
  'UserSessionComponent': UserSessionComponent,
  'UserTimezoneComponent': UserTimezoneComponent,
  'UserLogOutComponent': UserLogOutComponent,
  'FileComponent': FileComponent,
  'InfoModalComponent': InfoModalComponent,
  'PropertyModalComponent': PropertyModalComponent,
  'LongContentModalComponent': LongContentModalComponent,
  'HelpModalComponent': HelpModalComponent,
  'ImageFocusComponent': ImageFocusComponent
};

// Construct Component List
const componentImportsList = [DashboardComponent, HomeComponent, LogInComponent, LanguageComponent, NavbarComponent, LeftBarComponent, SettingsVersionComponent, SettingsRightComponent, SettingsUserComponent, SettingsTeamComponent, SettingsFunctionComponent, SettingsSSLComponent, SettingsCrudComponent, SettingsLanguageComponent, UserInfoComponent, UserLanguageComponent, UserSessionComponent, UserTimezoneComponent, UserLogOutComponent, FileComponent, InfoModalComponent, PropertyModalComponent, LongContentModalComponent, HelpModalComponent, ImageFocusComponent];

// Get Component By Name
function getComponentImportByName(name) { return componentImportsDict[name]; }


// Export Dicts, Lists & Functions
export { componentImportsDict, componentImportsList, getComponentImportByName };
