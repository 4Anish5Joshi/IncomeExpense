// saving-modal.component.ts
import { Component, Inject } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface DialogData {
  expectedAnnualSaving: number;
}
@Component({
  selector: 'app-saving-modal',
  templateUrl: './saving-modal.component.html',
  styleUrls: ['./saving-modal.component.scss'],
})
export class SavingModalComponent {
  expectedAnnualSaving!: number;

  constructor(
    public dialogRef: MatDialogRef<SavingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  save(): void {
    this.dialogRef.close(this.data.expectedAnnualSaving);
  }
}
