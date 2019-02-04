import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { DocumentContextService } from '../services/document-context.service';
import { DynamicPageService } from '../services/dynamic-page.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'tanam-dynamic-page',
  templateUrl: './dynamic-page.component.html',
  styles: []
})
export class DynamicPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly subscriptions: Subscription[] = [];
  readonly rootPath = this.route.snapshot.paramMap.get('typePrefix') || '';
  readonly entryPath = this.route.snapshot.paramMap.get('entryPath') || this.route.snapshot.url.join('/');
  documentFound = null;

  @ViewChild('viewContainer', { read: ViewContainerRef }) viewContainer: ViewContainerRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly documentContextService: DocumentContextService,
    private readonly dynamicPage: DynamicPageService,
    private readonly themeService: ThemeService,
  ) { }

  ngOnInit() {
    console.log(`[DynamicPageComponent:ngOnInit] prefix: '${this.rootPath}'`);
    console.log(`[DynamicPageComponent:ngOnInit] path: '${this.entryPath}'`);
    this.subscriptions.push(this.themeService.getCurrentTheme().subscribe(theme => {
      for (const script of theme.scripts) {
        this.dynamicPage.addScriptToBody(script);
      }
      for (const style of theme.styles) {
        this.dynamicPage.addStyle(style);
      }
    }));
  }

  ngAfterViewInit() {
    this.renderContent();
  }

  ngOnDestroy() {
    this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
  }

  private async renderContent() {
    const contentEntry = await this.documentContextService.getByUrl(this.rootPath, this.entryPath).pipe(take(1)).toPromise();
    this.documentFound = !!contentEntry;
    if (!this.documentFound) {
      return;
    }

    this.dynamicPage.render(this.viewContainer, contentEntry);
  }
}
