import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
    sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

    toggleSidebar(): void {
        this.sidebarCollapsedSubject.next(!this.sidebarCollapsedSubject.value);
    }

    isSidebarCollapsed(): boolean {
        return this.sidebarCollapsedSubject.value;
    }
}
