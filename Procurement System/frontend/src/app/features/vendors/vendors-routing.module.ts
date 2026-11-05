import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendorsPageComponent } from './vendors-page.component';

const routes: Routes = [{ path: '', component: VendorsPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VendorsRoutingModule {}
