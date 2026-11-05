import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { VendorsRoutingModule } from './vendors-routing.module';
import { VendorsPageComponent } from './vendors-page.component';
import { RegisterVendorDialogComponent } from './register-vendor-dialog.component';

@NgModule({
  declarations: [VendorsPageComponent, RegisterVendorDialogComponent],
  imports: [SharedModule, VendorsRoutingModule],
})
export class VendorsModule {}
