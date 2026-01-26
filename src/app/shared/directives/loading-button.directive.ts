import {
    Directive,
    Input,
    OnChanges,
    ElementRef,
    Renderer2,
    SimpleChanges,
    ComponentRef,
    ViewContainerRef
} from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ThemePalette } from '@angular/material/core';

@Directive({
    selector: '[appLoading]',
    standalone: true
})
export class LoadingButtonDirective implements OnChanges {
    @Input('appLoading') isLoading = false;
    @Input() color: ThemePalette; // To match button color if needed, though usually we want contrast

    private spinnerRef: ComponentRef<MatProgressSpinner> | null = null;
    private originalContent: any;
    private originalWidth: string = '';

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private viewContainerRef: ViewContainerRef
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isLoading']) {
            if (this.isLoading) {
                this.showSpinner();
            } else {
                this.hideSpinner();
            }
        }
    }

    private showSpinner() {
        const button = this.el.nativeElement as HTMLButtonElement;

        // Save original width to prevent collapsing
        this.originalWidth = button.style.width;
        const rect = button.getBoundingClientRect();
        if (rect.width > 0) {
            this.renderer.setStyle(button, 'width', `${rect.width}px`);
        }

        // Disable button
        this.renderer.setAttribute(button, 'disabled', 'true');
        this.renderer.addClass(button, 'mat-button-disabled');

        // Create and attach spinner
        this.spinnerRef = this.viewContainerRef.createComponent(MatProgressSpinner);
        this.spinnerRef.instance.mode = 'indeterminate';
        this.spinnerRef.instance.diameter = 20; // Small spinner
        this.spinnerRef.instance.color = undefined; // Inherit current color (usually works well on buttons)

        // Append spinner to button
        this.renderer.appendChild(button, this.spinnerRef.location.nativeElement);

        // Style spinner container
        this.renderer.setStyle(this.spinnerRef.location.nativeElement, 'display', 'inline-block');
        this.renderer.setStyle(this.spinnerRef.location.nativeElement, 'vertical-align', 'middle');
        this.renderer.setStyle(this.spinnerRef.location.nativeElement, 'margin-left', '8px'); // Space from text if text is kept

        // Optional: Hide original content? 
        // Usually it's better to keep text "Processing..." or just append spinner.
        // Let's just append spinner for now, user can change text manually if they want.
    }

    private hideSpinner() {
        const button = this.el.nativeElement as HTMLButtonElement;

        // Remove spinner
        if (this.spinnerRef) {
            this.spinnerRef.destroy();
            this.spinnerRef = null;
        }

        // Enable button
        this.renderer.removeAttribute(button, 'disabled');
        this.renderer.removeClass(button, 'mat-button-disabled');

        // Restore width
        this.renderer.setStyle(button, 'width', this.originalWidth);
    }
}
