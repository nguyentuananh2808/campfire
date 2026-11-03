import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReadingDocumentSummary } from '../../core/learning/learning.models';

@Component({
  selector: 'app-reading-library',
  templateUrl: './reading-library.html',
  styleUrl: './reading-library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingLibrary {
  readonly documents = input.required<ReadingDocumentSummary[]>();
  readonly loading = input(false);
  readonly pendingId = input<string | null>(null);
  readonly selectedId = input<string | null>(null);
  readonly openDocument = output<string>();
  readonly deleteDocument = output<string>();
}
