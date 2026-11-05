import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminPageComponent } from './admin-page.component';
import { DepartmentsTabComponent } from './departments-tab/departments-tab.component';
import { LocationsTabComponent } from './locations-tab/locations-tab.component';
import { CatalogTabComponent } from './catalog-tab/catalog-tab.component';
import { UsersTabComponent } from './users-tab/users-tab.component';
import { RecurringTabComponent } from './recurring-tab/recurring-tab.component';

@NgModule({
  declarations: [AdminPageComponent, DepartmentsTabComponent, LocationsTabComponent, CatalogTabComponent, UsersTabComponent, RecurringTabComponent],
  imports: [SharedModule, AdminRoutingModule],
})
export class AdminModule {}
