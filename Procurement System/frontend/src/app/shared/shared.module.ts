import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material.module';
import { TimelineComponent } from './components/timeline/timeline.component';
import { StatusChipComponent } from './components/status-chip/status-chip.component';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { ReasonDialogComponent } from './components/reason-dialog/reason-dialog.component';

const COMPONENTS = [
  TimelineComponent,
  StatusChipComponent,
  DocumentUploadComponent,
  PageHeaderComponent,
  ReasonDialogComponent,
];

@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, ...COMPONENTS],
})
export class SharedModule {}
