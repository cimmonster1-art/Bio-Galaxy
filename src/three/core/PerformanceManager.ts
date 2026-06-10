/**
 * Tracks whether the scene should be rendering at all: it pauses when the
 * canvas scrolls out of view and when the browser tab is hidden, and calls back
 * so the orchestrator can start or stop its animation loop. This is the demand
 * rendering gate that keeps the atlas off the GPU when nobody is looking.
 */
export interface PerformanceCallbacks {
  onActivate: () => void;
  onDeactivate: () => void;
}

export class PerformanceManager {
  private inViewport = true;
  private tabVisible = !document.hidden;
  private readonly intersectionObserver: IntersectionObserver;

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: PerformanceCallbacks,
  ) {
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.inViewport = entry.isIntersecting;
        this.evaluate();
      },
      { threshold: 0.05 },
    );
    this.intersectionObserver.observe(container);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** True when the canvas is both on screen and in a visible tab. */
  get active(): boolean {
    return this.inViewport && this.tabVisible;
  }

  private onVisibilityChange = (): void => {
    this.tabVisible = !document.hidden;
    this.evaluate();
  };

  private evaluate(): void {
    if (this.active) this.callbacks.onActivate();
    else this.callbacks.onDeactivate();
  }

  dispose(): void {
    this.intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    void this.container;
  }
}
